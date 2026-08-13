"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ORCHESTRATOR_URL } from "@/lib/config";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(`${ORCHESTRATOR_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      localStorage.setItem("user", JSON.stringify(data.user));
      document.cookie = `user=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=86400; SameSite=Lax`;
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick social login simulation
  const handleSocialLogin = (provider: string) => {
    const demoUser = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: provider === "Google" ? "Alex Rivera" : "Developer",
      email: `${provider.toLowerCase()}user@example.com`
    };
    localStorage.setItem("user", JSON.stringify(demoUser));
    document.cookie = `user=${encodeURIComponent(JSON.stringify(demoUser))}; path=/; max-age=86400; SameSite=Lax`;
    router.push("/dashboard");
  };

  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as "dark" | "light") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-white overflow-hidden flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-5 right-5 z-30">
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 rounded-full text-neutral-300 hover:text-white transition-all shadow-lg backdrop-blur-md"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Ambient Radial Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-rose-600/20 via-purple-600/20 to-blue-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Pinterest-Style Staggered Background Pins Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden grid grid-cols-2 md:grid-cols-4 gap-6 p-8 max-w-[1700px] mx-auto">
        {/* Column 1 */}
        <div className="space-y-6 animate-float-slow hidden md:block">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500" />
              <div>
                <div className="h-3 w-24 bg-neutral-700 rounded-full mb-1" />
                <div className="h-2 w-16 bg-neutral-800 rounded-full" />
              </div>
            </div>
            <div className="h-32 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl p-4 flex flex-col justify-between border border-white/5">
              <span className="inline-block text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full w-fit">✨ AI Dashboard</span>
              <div className="space-y-2">
                <div className="h-2 w-full bg-neutral-700/60 rounded-full" />
                <div className="h-2 w-3/4 bg-neutral-700/60 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-2xl backdrop-blur-sm">
            <div className="h-40 bg-gradient-to-tr from-blue-900/40 to-emerald-900/40 rounded-2xl p-4 flex flex-col justify-between border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">SaaS Template</span>
                <span className="text-xs text-neutral-400">⚡ 100%</span>
              </div>
              <div className="text-sm font-bold text-white">Fullstack E-Commerce</div>
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-6 animate-float-reverse">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-2xl backdrop-blur-sm">
            <div className="h-48 bg-gradient-to-br from-purple-900/40 to-rose-900/40 rounded-2xl p-4 flex flex-col justify-between border border-white/5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xs">🚀</div>
              <div>
                <div className="text-xs text-neutral-400">Lovable AI App</div>
                <div className="text-base font-semibold text-white">Analytics Hub</div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-2xl backdrop-blur-sm">
            <div className="h-28 bg-neutral-800/80 rounded-2xl p-3 flex items-center gap-3 border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex-shrink-0" />
              <div className="space-y-1 flex-1">
                <div className="h-2.5 w-20 bg-neutral-700 rounded-full" />
                <div className="h-2 w-14 bg-neutral-800 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 */}
        <div className="space-y-6 animate-float-slow hidden md:block">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-2xl backdrop-blur-sm">
            <div className="h-36 bg-gradient-to-br from-amber-900/30 to-rose-900/30 rounded-2xl p-4 flex flex-col justify-between border border-white/5">
              <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full w-fit">🔥 Trending Pin</span>
              <div className="text-sm font-semibold text-white">Portfolio Showcase</div>
            </div>
          </div>

          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-2xl backdrop-blur-sm">
            <div className="h-44 bg-neutral-800/60 rounded-2xl p-4 flex flex-col justify-between border border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="h-3 w-3/4 bg-neutral-700 rounded-full" />
            </div>
          </div>
        </div>

        {/* Column 4 */}
        <div className="space-y-6 animate-float-reverse hidden lg:block">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-5 shadow-2xl backdrop-blur-sm">
            <div className="h-52 bg-gradient-to-tr from-cyan-900/40 to-blue-900/40 rounded-2xl p-4 flex flex-col justify-between border border-white/5">
              <div className="text-xs text-cyan-300 font-mono">React + Vite</div>
              <div className="text-lg font-bold text-white">Instant Sandbox</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Pinterest-Style Glassmorphic Authentication Card */}
      <div className="relative z-20 w-full max-w-[440px]">
        {/* Glowing Aura Ring around card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 rounded-[32px] blur-xl opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-glow" />

        <div className="relative bg-neutral-900/90 border border-white/10 rounded-[30px] p-8 md:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          
          {/* Pinterest-Style Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 via-purple-500 to-blue-500 p-0.5 shadow-lg shadow-rose-500/25 mb-4">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-purple-400 to-blue-400">
                  L
                </span>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1 font-sans">
              Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-purple-400 to-blue-400">Lovable</span>
            </h1>
            <p className="text-xs text-neutral-400 max-w-[280px]">
              Turn ideas into fully functional React applications in seconds.
            </p>
          </div>

          {/* Segmented Pill Tab Switcher */}
          <div className="relative flex bg-neutral-950/80 p-1 rounded-full border border-neutral-800/80 mb-6">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(""); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all duration-300 ${
                isLogin 
                ? "bg-white text-neutral-950 shadow-md scale-[1.02]" 
                : "text-neutral-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(""); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all duration-300 ${
                !isLogin 
                ? "bg-white text-neutral-950 shadow-md scale-[1.02]" 
                : "text-neutral-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center gap-2.5 animate-shake">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form Controls */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-950/60 border border-neutral-800 rounded-2xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider ml-1">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950/60 border border-neutral-800 rounded-2xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Password</label>
                {isLogin && (
                  <span className="text-[11px] text-rose-400 hover:underline cursor-pointer">Forgot?</span>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950/60 border border-neutral-800 rounded-2xl text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/20 transition-all"
                required
              />
            </div>

            {/* Primary Action Pill Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 text-white font-semibold text-sm rounded-full shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{isLogin ? "Continue to Workspace" : "Create Free Account"}</span>
              )}
            </button>
          </form>

          {/* Social Auth Separator */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <span className="relative bg-neutral-900 px-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          {/* Social Pills */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialLogin("Google")}
              className="py-2.5 px-3 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 rounded-full text-xs font-medium text-neutral-300 flex items-center justify-center gap-2 transition-all hover:border-neutral-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin("GitHub")}
              className="py-2.5 px-3 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 rounded-full text-xs font-medium text-neutral-300 flex items-center justify-center gap-2 transition-all hover:border-neutral-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-[11px] text-neutral-500">
            By signing in, you agree to our Terms of Service & Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}
