"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ORCHESTRATOR_URL } from "@/lib/config";
import { useTheme } from "@/lib/theme";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
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

  const handleSocialLogin = (provider: string) => {
    const demoUser = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      name: provider === "Google" ? "Alex Rivera" : "Senior Engineer",
      email: `${provider.toLowerCase()}user@example.com`
    };
    localStorage.setItem("user", JSON.stringify(demoUser));
    document.cookie = `user=${encodeURIComponent(JSON.stringify(demoUser))}; path=/; max-age=86400; SameSite=Lax`;
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#090a0e] light:bg-[#fbfbfa] text-slate-100 light:text-slate-900 flex flex-col justify-between p-4 sm:p-8 md:p-12 selection:bg-blue-600 selection:text-white bg-grid-pattern transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-white/[0.08] light:border-black/[0.07]">
        <div className="flex items-center gap-3">
          {/* Atelier Monogram */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-blue-500 to-blue-700 light:from-blue-600 light:to-blue-800 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold text-xs tracking-tighter border border-white/10">
            ✦
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-sm tracking-tight text-white light:text-slate-900 font-sans">
              Atelier
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 light:text-slate-500 uppercase">
              STUDIO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Chip */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 light:text-emerald-700 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 light:bg-emerald-600 animate-pulse" />
            <span>MicroVM Engine Active</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[#12141c] light:bg-white border border-white/[0.08] light:border-black/[0.08] text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition-all shadow-sm"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Showcase */}
      <main className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center py-10">
        
        {/* Left Column: Vision & Telemetry */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 light:text-blue-700 text-xs font-mono">
            <span>✦ Precision AI Software Craft</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white light:text-slate-900 leading-[1.12]">
            Software tailored at the speed of thought.
          </h1>

          <p className="text-slate-400 light:text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
            Atelier synthesizes production React applications, provisions secure microVM sandboxes, and compiles live code iteratively through natural dialogue.
          </p>

          {/* Precision Spec Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-[#0f1117] light:bg-white border border-white/[0.08] light:border-black/[0.07] shadow-sm">
              <div className="text-[10px] font-mono uppercase text-slate-400 light:text-slate-500 tracking-wider">Isolation</div>
              <div className="text-sm font-medium text-white light:text-slate-900 mt-1">E2B Sandboxes</div>
              <div className="text-[11px] text-emerald-400 light:text-emerald-600 font-mono mt-0.5">&lt; 1.2s cold start</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0f1117] light:bg-white border border-white/[0.08] light:border-black/[0.07] shadow-sm">
              <div className="text-[10px] font-mono uppercase text-slate-400 light:text-slate-500 tracking-wider">Compiler</div>
              <div className="text-sm font-medium text-white light:text-slate-900 mt-1">Vite 6 + React 19</div>
              <div className="text-[11px] text-blue-400 light:text-blue-600 font-mono mt-0.5">Hot Module Reload</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0f1117] light:bg-white border border-white/[0.08] light:border-black/[0.07] shadow-sm">
              <div className="text-[10px] font-mono uppercase text-slate-400 light:text-slate-500 tracking-wider">Agent Engine</div>
              <div className="text-sm font-medium text-white light:text-slate-900 mt-1">Autonomous I/O</div>
              <div className="text-[11px] text-amber-400 light:text-amber-600 font-mono mt-0.5">Full Stack Loop</div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-[#0f1117] light:bg-white border border-white/[0.09] light:border-black/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40 light:shadow-slate-200/50">
            
            {/* Header & Segmented Tab */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-white light:text-slate-900">
                {isLogin ? "Enter the studio" : "Create your workspace"}
              </h2>
              <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
                {isLogin ? "Access your projects and cloud execution pods" : "Start building with dedicated sandbox compute"}
              </p>

              {/* Segmented Switcher */}
              <div className="grid grid-cols-2 p-1 mt-5 bg-[#090a0e] light:bg-slate-100 rounded-lg border border-white/[0.06] light:border-black/[0.06] text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`py-1.5 rounded-md transition-colors ${
                    isLogin 
                    ? "bg-[#181b26] light:bg-white text-white light:text-slate-900 shadow-sm border border-white/[0.08] light:border-black/[0.06]" 
                    : "text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`py-1.5 rounded-md transition-colors ${
                    !isLogin 
                    ? "bg-[#181b26] light:bg-white text-white light:text-slate-900 shadow-sm border border-white/[0.08] light:border-black/[0.06]" 
                    : "text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 light:text-rose-600 text-xs flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 light:text-slate-700">Full Name</label>
                  <input
                    type="text"
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] light:bg-slate-50 border border-white/[0.08] light:border-black/[0.08] text-sm text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 light:text-slate-700">Email Address</label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] light:bg-slate-50 border border-white/[0.08] light:border-black/[0.08] text-sm text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-300 light:text-slate-700">Password</label>
                  {isLogin && (
                    <span className="text-[11px] text-blue-400 light:text-blue-600 hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#161922] light:bg-slate-50 border border-white/[0.08] light:border-black/[0.08] text-sm text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 light:bg-blue-700 light:hover:bg-blue-800 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{isLogin ? "Sign In to Atelier" : "Create Account"}</span>
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-white/[0.08] light:border-black/[0.08]" />
              <span className="absolute bg-[#0f1117] light:bg-white px-3 text-[11px] font-mono text-slate-400 light:text-slate-500 uppercase tracking-wider">
                Demo Credentials
              </span>
            </div>

            {/* Quick Demo Access Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleSocialLogin("Google")}
                className="py-2 px-3 rounded-lg bg-[#161922] light:bg-slate-50 hover:bg-[#1e222e] light:hover:bg-slate-100 border border-white/[0.08] light:border-black/[0.08] text-xs font-medium text-slate-300 light:text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24">
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
                className="py-2 px-3 rounded-lg bg-[#161922] light:bg-slate-50 hover:bg-[#1e222e] light:hover:bg-slate-100 border border-white/[0.08] light:border-black/[0.08] text-xs font-medium text-slate-300 light:text-slate-700 flex items-center justify-center gap-2 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Specs */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-white/[0.08] light:border-black/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400 light:text-slate-500">
        <div className="flex items-center gap-4">
          <span>ATELIER ENGINE: V3.2</span>
          <span className="hidden sm:inline">|</span>
          <span>E2B SANDBOX PODS</span>
          <span className="hidden sm:inline">|</span>
          <span>VITE 6.0 HMR</span>
        </div>
        <div>
          <span>CRAFTED FOR DEVELOPERS</span>
        </div>
      </footer>
    </div>
  );
}
