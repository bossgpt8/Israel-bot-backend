import { useState } from "react";
import {
  loginWithGoogle,
  signUpWithEmail,
  loginWithEmail,
} from "@/lib/firebase";
import {
  Bot,
  Zap,
  Shield,
  Users,
  MessageCircle,
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        await signUpWithEmail(formData.email, formData.password, formData.name);
      } else {
        await loginWithEmail(formData.email, formData.password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
<div className="min-h-screen bg-[#020205] text-white overflow-hidden selection:bg-purple-500/30">
    {/* Dynamic Background */}
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(76,29,149,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
    </div>

    <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
      {/* Left Side: Branding & Info */}
      <div className="flex-1 p-8 lg:p-20 flex flex-col justify-between overflow-hidden">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 group cursor-default"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative w-12 h-12 rounded-2xl bg-[#0a0a0f] border border-white/10 flex items-center justify-center shadow-2xl">
              <Bot className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-white uppercase leading-none">
              BOSS<span className="text-purple-500">BOT</span>
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mt-1">
              Unit 2.0
            </span>
          </div>
        </motion.div>

        <div className="max-w-xl py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">
                Version 2.0 Live
              </span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.85] mb-8">
              COMMAND THE <br />
              <span className="relative inline-block text-white">
                NETWORK
                <span className="absolute -bottom-2 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-blue-600 blur-sm opacity-50"></span>
              </span>
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed mb-10 max-w-md">
              The world's most advanced WhatsApp automation ecosystem. 100+
              commands, AI integration, and total group dominance.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Zap, text: "Instant Response" },
                { icon: Shield, text: "Anti-Ban Tech" },
                { icon: MessageCircle, text: "AI Brain 2.0" },
                { icon: Users, text: "Multi-Instance" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500"
                >
                  <item.icon className="w-4 h-4 text-purple-500" />
                  {item.text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="hidden lg:block text-xs font-medium text-gray-600 uppercase tracking-widest"
        >
          &copy; 2026 Boss Unit Bot • Designed by Israel
        </motion.div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="lg:w-[500px] p-4 lg:p-12 flex items-center justify-center bg-white/[0.02] backdrop-blur-3xl border-l border-white/5 relative">
        <div className="w-full max-w-sm space-y-8 relative z-20">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-black tracking-tight uppercase">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-500 text-sm">
              {mode === "login"
                ? "Access your dashboard and manage your instances."
                : "Join the elite network of WhatsApp automation."}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full group relative flex items-center justify-center gap-3 px-6 py-4 bg-white text-black font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="relative z-10">Continue with Google</span>
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-bold tracking-widest">
                <span className="bg-[#04040a] px-4 text-gray-600">
                  Or via Email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Your identity"
                        className="bg-white/5 border-white/10 h-12 pl-12 rounded-xl focus:ring-purple-500/20"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="name@provider.com"
                    className="bg-white/5 border-white/10 h-12 pl-12 rounded-xl focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Security Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    required
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="bg-white/5 border-white/10 h-12 pl-12 rounded-xl focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-500 font-medium text-center"
                >
                  {error}
                </motion.p>
              )}

              <button
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === "login"
                      ? "Access Protocol"
                      : "Initialize Account"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center">
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              {mode === "login"
                ? "New to the network? Create account"
                : "Already registered? Login here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
