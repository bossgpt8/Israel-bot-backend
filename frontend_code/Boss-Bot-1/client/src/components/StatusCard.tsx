import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { Wifi, WifiOff, RefreshCw, Smartphone, Hash, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StatusCardProps {
  status: "online" | "offline" | "starting" | "error";
  qr: string | null;
  pairingCode: string | null;
  uptime: number;
  linkedNumber?: string | null;
}

export function StatusCard({
  status,
  qr,
  pairingCode,
  uptime,
  linkedNumber,
}: StatusCardProps) {
  const isOnline = status === "online";
  const isStarting = status === "starting";
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Pairing code copied to clipboard.",
      className: "bg-black border-accent text-accent font-mono",
    });
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="cyber-card p-6 border-white/10 bg-white/10 backdrop-blur-2xl relative overflow-hidden">
      {/* Top section: Header + Status Box */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between relative z-10 mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tighter mb-1 text-white uppercase italic">
            System <span className="text-primary">Control</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-mono text-[10px] uppercase tracking-widest font-bold opacity-100">
              Platform Identity:
            </span>
            <span className="text-primary font-display font-bold text-sm tracking-wider">
              BOSS UNIT
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-400 font-mono text-[10px] uppercase tracking-widest font-bold opacity-100">
              Connection State:
            </span>
            <span
              className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-xl ${
                isOnline
                  ? "bg-green-500/20 text-green-400 border-green-500/40 animate-pulse"
                  : status === "error"
                    ? "bg-red-500/20 text-red-400 border-red-500/40"
                    : "bg-primary/20 text-primary border-primary/40"
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Status Box - Now positioned at top right */}
        <div className="flex-shrink-0 relative">
          <div className="w-[220px] h-[220px] bg-black/60 p-4 rounded-2xl border border-white/20 relative overflow-hidden flex items-center justify-center shadow-2xl backdrop-blur-md">
            <AnimatePresence mode="wait">
              {isOnline ? (
                <motion.div
                  key="online"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center"
                >
                  <div className="relative">
                    <Smartphone className="w-20 h-20 text-primary mx-auto mb-3" />
                    <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full animate-ping" />
                  </div>
                  <p className="text-primary font-display font-bold text-xs tracking-widest uppercase">
                    DEVICE LINKED
                  </p>
                  {linkedNumber && (
                    <p className="text-white font-mono text-[10px] mt-2 font-bold tracking-wider">
                      +{linkedNumber}
                    </p>
                  )}
                </motion.div>
              ) : pairingCode ? (
                <motion.div
                  key="pairing"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-center"
                >
                  <Hash className="w-10 h-10 text-primary mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest mb-2 font-bold">
                    Pairing Code
                  </p>
                  <div
                    onClick={() => copyToClipboard(pairingCode)}
                    className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl cursor-pointer hover:bg-primary/20 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span className="text-2xl font-display font-bold text-primary tracking-widest">
                      {pairingCode}
                    </span>
                    <Copy className="w-4 h-4 text-primary" />
                  </div>
                </motion.div>
              ) : qr ? (
                <motion.div
                  key="qr"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white p-2 rounded-xl"
                >
                  <QRCode value={qr} size={180} level="L" />
                </motion.div>
              ) : (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center p-4"
                >
                  {isStarting ? (
                    <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-3" />
                  ) : (
                    <Smartphone className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                  )}
                  <p className="text-muted-foreground font-display text-[10px] font-bold uppercase tracking-[0.2em]">
                    {isStarting ? "Linking..." : "Ready"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom section: Uptime and Network Stats */}
      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="p-4 bg-black/40 border border-white/10 rounded-2xl group hover:border-primary/50 transition-all duration-300">
          <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1 font-bold">
            Bot Uptime
          </div>
          <div className="text-2xl font-display font-bold text-primary">
            {isOnline ? formatUptime(uptime) : "00:00:00"}
          </div>
        </div>
        <div className="p-4 bg-black/40 border border-white/10 rounded-2xl group hover:border-primary/50 transition-all duration-300">
          <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1 font-bold">
            Network Link
          </div>
          <div className="text-2xl font-display font-bold text-white flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-green-400" /> ACTIVE
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-400 opacity-70" /> IDLE
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add CSS keyframes for scan effect if not already present
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes scan {
      0% { top: 0%; }
      50% { top: 100%; }
      100% { top: 0%; }
    }
  `;
  document.head.appendChild(style);
}
