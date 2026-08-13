"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORCHESTRATOR_URL } from "@/lib/config";

const PROMPT_SUGGESTIONS = [
  { emoji: "🎨", title: "E-Commerce Store", prompt: "Build a sleek e-commerce store with product grid, search filters, shopping cart drawer, and modern dark styling." },
  { emoji: "📊", title: "AI Analytics Dashboard", prompt: "Create an AI analytics dashboard with metric summary cards, line graphs, activity feed, and responsive sidebar." },
  { emoji: "⚡", title: "Crypto Tracker", prompt: "Build a crypto portfolio tracker with real-time price sparklines, watchlist, transaction history, and dark theme." },
  { emoji: "📱", title: "Social Community Feed", prompt: "Create a social media feed with post creation box, like/comment buttons, user avatars, and trending topic badges." },
  { emoji: "📝", title: "Kanban Project Board", prompt: "Build an interactive Kanban board with draggable task cards, column status columns (To Do, In Progress, Done), and priority badges." },
];

export default function NewDashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleStartSession = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || prompt;
    if (!targetPrompt.trim()) return;
    
    setLoading(true);
    setError("");

    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return router.push("/");
      const user = JSON.parse(userStr);

      const res = await fetch(`${ORCHESTRATOR_URL}/api/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialPrompt: targetPrompt, userId: user.id }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to start session");
      }
      
      if (data.sessionId) {
        sessionStorage.setItem(`preview-${data.sessionId}`, data.previewUrl || "");
        sessionStorage.setItem(`podName-${data.sessionId}`, data.podName || "");
        router.push(`/dashboard/${data.sessionId}`);
      }
    } catch (err: any) {
      console.error("Error starting session:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-neutral-950 text-white relative overflow-hidden selection:bg-rose-500 selection:text-white">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-rose-600/15 via-purple-600/15 to-blue-600/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-3xl w-full flex flex-col items-center relative z-10">
        
        {/* Badge Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 mb-6 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-medium">Powered by DeepSeek AI & E2B MicroVM Sandbox</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-5xl font-black text-center tracking-tight mb-3 font-sans">
          What will you <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-purple-400 to-blue-400">bring to life</span> today?
        </h1>
        <p className="text-neutral-400 text-center max-w-xl mb-10 text-sm md:text-base">
          Describe any web application, component, or SaaS idea. Lovable will write the code and run it in a live interactive preview.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 w-full p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="whitespace-pre-wrap">{error}</span>
          </div>
        )}

        {/* Glass Prompt Container */}
        <div className="w-full relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 rounded-[28px] blur-xl opacity-25 group-focus-within:opacity-60 transition duration-500" />

          <div className="relative bg-neutral-900/90 border border-white/10 rounded-[26px] p-4 shadow-2xl backdrop-blur-xl">
            <textarea 
              placeholder="Build a modern SaaS landing page with dark mode, interactive pricing cards, testimonials grid, and smooth animations..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleStartSession();
                }
              }}
              className="w-full h-36 bg-transparent text-white p-3 focus:outline-none resize-none placeholder-neutral-500 text-sm md:text-base leading-relaxed"
              autoFocus
            />

            {/* Prompt Studio Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Stack:</span>
                <span className="bg-neutral-800/80 border border-white/5 text-neutral-300 text-[11px] px-2.5 py-0.5 rounded-full font-mono">React 18</span>
                <span className="bg-neutral-800/80 border border-white/5 text-neutral-300 text-[11px] px-2.5 py-0.5 rounded-full font-mono">Vite</span>
                <span className="bg-neutral-800/80 border border-white/5 text-neutral-300 text-[11px] px-2.5 py-0.5 rounded-full font-mono">Tailwind</span>
                <span className="bg-neutral-800/80 border border-white/5 text-neutral-300 text-[11px] px-2.5 py-0.5 rounded-full font-mono">Lucide</span>
              </div>

              <button 
                onClick={() => handleStartSession()} 
                disabled={loading || !prompt.trim()}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-full font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                  loading || !prompt.trim() 
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/5" 
                  : "bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Booting Sandbox...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Application</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Pinterest Inspiration Chips */}
        <div className="mt-10 w-full">
          <div className="text-center text-xs font-medium text-neutral-400 uppercase tracking-widest mb-4">
            Need Inspiration? Try a preset prompt
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {PROMPT_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(item.prompt);
                  handleStartSession(item.prompt);
                }}
                disabled={loading}
                className="group px-3.5 py-2 bg-neutral-900/80 hover:bg-neutral-800 border border-white/5 hover:border-rose-500/40 rounded-full text-xs text-neutral-300 hover:text-white transition-all flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{item.emoji}</span>
                <span>{item.title}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-400">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
