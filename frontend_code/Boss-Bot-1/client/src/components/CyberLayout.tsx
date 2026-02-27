import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Settings,
  Terminal,
  Shield,
  Cpu,
  LogOut,
  Bot,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { logout } from "@/lib/firebase";

interface CyberLayoutProps {
  children: React.ReactNode;
}

export function CyberLayout({ children }: CyberLayoutProps) {
  const [location] = useLocation();
  const { user } = useFirebaseAuth();

  const navItems = [{ href: "/", label: "Dashboard", icon: LayoutDashboard }];

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background Grid Effect */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="scanline" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-2xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none text-white">
                BOSS<span className="text-primary">BOT</span>
              </h1>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                Advanced WhatsApp Platform
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                  relative px-4 py-2 flex items-center gap-2 text-sm font-medium uppercase tracking-wider transition-all
                  ${isActive ? "text-primary" : "text-gray-300 hover:text-white"}
                `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 bg-primary/20 border-b-2 border-primary"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}

            {user && (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-8 h-8 rounded-full border-2 border-primary/50"
                  />
                )}
                <span className="text-xs text-gray-400 hidden md:block">
                  {user.displayName}
                </span>
                <button
                  onClick={() => logout()}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 w-full bg-black border-t border-primary/20 py-1 px-4 text-[10px] font-mono text-primary/50 flex justify-between uppercase">
        <div className="flex gap-4">
          <span>MEM: OK</span>
          <span>NET: SECURE</span>
          <span>ENC: AES-256</span>
        </div>
        <div className="flex gap-2 items-center">
          <Cpu className="w-3 h-3" />
          <span>SYS READY</span>
        </div>
      </footer>
    </div>
  );
}
