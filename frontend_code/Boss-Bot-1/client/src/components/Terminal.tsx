import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { type Log } from "@shared/schema";
import { format } from "date-fns";
import { Terminal as TerminalIcon, Loader2, Trash2 } from "lucide-react";

interface TerminalProps {
  logs: Log[] | undefined;
  isLoading: boolean;
  onClearLogs?: () => void;
}

export function Terminal({ logs, isLoading, onClearLogs }: TerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="cyber-card flex flex-col h-[400px]">
      <div className="bg-primary/5 border-b border-primary/20 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-mono text-sm uppercase">
          <TerminalIcon className="w-4 h-4" />
          <span>System Output Log</span>
        </div>
        <div className="flex items-center gap-3">
          {onClearLogs && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearLogs}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 font-mono text-xs md:text-sm bg-black/90 h-[340px]">
        <div className="space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-primary/50 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>SYNCHRONIZING LOGS...</span>
            </div>
          ) : (
            <div className="space-y-1">
              {logs?.slice().reverse().map((log, i) => (
                <div key={i} className="flex gap-3 hover:bg-white/5 p-0.5 rounded transition-colors">
                  <span className="text-muted-foreground select-none shrink-0">
                    [{log.timestamp ? format(new Date(log.timestamp), "HH:mm:ss") : "--:--:--"}]
                  </span>
                  <span className={`uppercase font-bold shrink-0 w-12 ${
                    log.level === 'error' ? 'text-red-500' :
                    log.level === 'warn' ? 'text-yellow-500' :
                    'text-blue-400'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-gray-300 break-all">{log.message}</span>
                </div>
              ))}
              <div ref={bottomRef} />
              
              <div className="flex gap-2 text-primary animate-pulse mt-2">
                <span>_</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
