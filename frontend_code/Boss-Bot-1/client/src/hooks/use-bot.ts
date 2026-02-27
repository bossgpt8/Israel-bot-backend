import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Log } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

// ============================================
// STATUS HOOKS
// ============================================

export function useBotStatus() {
  return useQuery({
    queryKey: [api.bot.status.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.bot.status.path);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch status");
        }
        const data = await res.json();
        return api.bot.status.responses[200].parse(data);
      } catch (err: any) {
        console.error("Status fetch error:", err);
        throw err;
      }
    },
    refetchInterval: 5000, 
  });
}

// ============================================
// ACTION HOOKS
// ============================================

export function useBotAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ action, phoneNumber, userId }: { action: "start" | "stop" | "restart" | "logout", phoneNumber?: string, userId?: string }) => {
      const res = await fetch(api.bot.action.path, {
        method: api.bot.action.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, phoneNumber, userId }),
      });
      
      if (!res.ok) {
        const text = await res.text();
        let errorMessage = "Action failed";
        try {
          const error = JSON.parse(text);
          errorMessage = error.message || errorMessage;
        } catch (e) {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }
      const text = await res.text();
      try {
        return api.bot.action.responses[200].parse(JSON.parse(text));
      } catch (e) {
        throw new Error("Invalid server response");
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Command Executed",
        description: data.message,
        className: "bg-black border-primary text-primary font-mono",
      });
      queryClient.invalidateQueries({ queryKey: [api.bot.status.path] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================
// LOGS HOOKS (SSE Implementation)
// ============================================

export function useBotLogs(userId?: string) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const eventSource = new EventSource(`/api/bot/logs/stream?userId=${userId || "default"}`);
    
    eventSource.onmessage = (event) => {
      const newLog = JSON.parse(event.data);
      setLogs((prev) => [{
        ...newLog,
        id: Math.random(), // Temporary ID for list rendering
        timestamp: new Date(newLog.timestamp)
      }, ...prev].slice(0, 100));
      setIsLoading(false);
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
      setIsLoading(false);
    };

    return () => {
      eventSource.close();
    };
  }, [userId]);

  return { data: logs, isLoading };
}
