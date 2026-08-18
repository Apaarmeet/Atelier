"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ORCHESTRATOR_URL } from "@/lib/config";

const PROMPT_SUGGESTIONS = [
  { 
    category: "SaaS",
    title: "AI Analytics Dashboard", 
    prompt: "Create an AI analytics dashboard with real-time metric cards, conversion funnel charts, active user table, and dark/light mode switcher." 
  },
  { 
    category: "Commerce",
    title: "Minimalist E-Commerce Store", 
    prompt: "Build a sleek e-commerce store with product grid, faceted filters (category, price range), search bar, and sliding cart drawer." 
  },
  { 
    category: "Productivity",
    title: "Kanban Task Manager", 
    prompt: "Build an interactive Kanban board with draggable columns (Backlog, In Progress, Review, Done), task priority badges, and quick add modals." 
  },
  { 
    category: "Fintech",
    title: "Portfolio Asset Tracker", 
    prompt: "Build a crypto and stock portfolio tracker with interactive price sparklines, watchlist manager, and transaction ledger." 
  },
  { 
    category: "SaaS",
    title: "Customer Support Hub", 
    prompt: "Build a customer support triage desk with SLA timers, ticket assignment dropdowns, priority tags, and conversation preview drawer." 
  },
  { 
    category: "Productivity",
    title: "Markdown Documentation Studio", 
    prompt: "Create a rich documentation editor with live split-screen preview, table of contents generator, search modal, and export options." 
  }
];

const PROMPT_MODIFIERS = [
  "+ Dark & Light Mode",
  "+ Mobile Responsive",
  "+ Mock Data & Charts",
  "+ Search & Filters",
  "+ Interactive Modals"
];

export default function NewDashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isStaged, setIsStaged] = useState(false);
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

  const handleStageTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    setIsStaged(true);
    setTimeout(() => setIsStaged(false), 2000);
    const textarea = document.getElementById("prompt-studio-textarea");
    if (textarea) {
      textarea.focus();
      textarea.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const addModifier = (modifier: string) => {
    setPrompt(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return modifier.replace("+ ", "");
      if (trimmed.includes(modifier.replace("+ ", ""))) return trimmed;
      return `${trimmed} with ${modifier.replace("+ ", "").toLowerCase()}`;
    });
    const textarea = document.getElementById("prompt-studio-textarea");
    if (textarea) textarea.focus();
  };

  const filteredSuggestions = useMemo(() => {
    if (selectedCategory === "All") return PROMPT_SUGGESTIONS;
    return PROMPT_SUGGESTIONS.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-[#090a0e] light:bg-[#fbfbfa] text-slate-100 light:text-slate-900 relative overflow-y-auto selection:bg-blue-600 selection:text-white transition-colors duration-200">
      <div className="max-w-3xl w-full flex flex-col items-center relative z-10 py-6">
        
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] light:bg-white border border-white/[0.08] light:border-black/[0.07] text-xs text-slate-300 light:text-slate-700 mb-6 font-mono shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 light:bg-emerald-600 animate-pulse" />
          <span>✦ Atelier Sandbox Engine Ready</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-center tracking-tight text-white light:text-slate-900 mb-3">
          What will you craft today?
        </h1>
        <p className="text-slate-400 light:text-slate-600 text-center max-w-lg mb-8 text-xs sm:text-sm leading-relaxed">
          Describe the interface, architecture, or workflow you want to create. Atelier writes full-stack code and deploys it immediately in live sandboxes.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 w-full p-3.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 light:text-rose-600 rounded-xl text-xs flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="whitespace-pre-wrap">{error}</span>
          </div>
        )}

        {/* Prompt Studio Console */}
        <div className={`w-full bg-[#0f1117] light:bg-white border ${
          isStaged ? "border-blue-500 ring-2 ring-blue-500/20" : "border-white/[0.09] light:border-black/[0.08]"
        } rounded-xl p-4 sm:p-5 shadow-xl shadow-black/40 light:shadow-slate-200/60 transition-all duration-300`}>
          <div className="relative">
            <textarea 
              id="prompt-studio-textarea"
              placeholder="E.g. Build a modern customer support portal with real-time ticket triage, status filters, priority indicators, and responsive drawer..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (!e.shiftKey || e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleStartSession();
                }
                if (e.key === 'Escape') {
                  setPrompt("");
                }
              }}
              className="w-full h-32 bg-transparent text-white light:text-slate-900 focus:outline-none resize-none placeholder-slate-500 light:placeholder-slate-400 text-sm leading-relaxed"
              autoFocus
            />

            {prompt && (
              <button
                onClick={() => setPrompt("")}
                className="absolute right-0 top-0 text-[10px] font-mono text-slate-400 hover:text-slate-200 light:hover:text-slate-700"
                title="Clear input (Esc)"
              >
                Clear
              </button>
            )}
          </div>

          {/* Prompt Modifiers / Feature Adders */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 pb-3">
            <span className="text-[10px] font-mono uppercase text-slate-400 light:text-slate-500 mr-1">Add:</span>
            {PROMPT_MODIFIERS.map((mod, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addModifier(mod)}
                className="px-2.5 py-1 rounded text-[10px] font-mono bg-[#161922] light:bg-slate-100 hover:bg-[#1e222e] light:hover:bg-slate-200 text-slate-300 light:text-slate-700 border border-white/[0.06] light:border-black/[0.06] transition-colors cursor-pointer"
              >
                {mod}
              </button>
            ))}
          </div>

          {/* Console Controls & Stack Badges */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-white/[0.08] light:border-black/[0.06]">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 font-mono text-[11px]">
              <span className="text-slate-400 light:text-slate-500 uppercase text-[10px] mr-1">Stack:</span>
              <span className="bg-[#161922] light:bg-slate-100 border border-white/[0.06] light:border-black/[0.06] text-slate-300 light:text-slate-700 px-2 py-0.5 rounded">React 19</span>
              <span className="bg-[#161922] light:bg-slate-100 border border-white/[0.06] light:border-black/[0.06] text-slate-300 light:text-slate-700 px-2 py-0.5 rounded">Vite</span>
              <span className="bg-[#161922] light:bg-slate-100 border border-white/[0.06] light:border-black/[0.06] text-slate-300 light:text-slate-700 px-2 py-0.5 rounded">Tailwind</span>
            </div>

            <button 
              onClick={() => handleStartSession()} 
              disabled={loading || !prompt.trim()}
              className={`w-full sm:w-auto px-5 py-2 rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-2 ${
                loading || !prompt.trim() 
                ? "bg-[#181b26] light:bg-slate-100 text-slate-500 light:text-slate-400 cursor-not-allowed border border-white/[0.06] light:border-black/[0.06]" 
                : "bg-blue-600 hover:bg-blue-500 light:bg-blue-700 light:hover:bg-blue-800 text-white shadow-sm cursor-pointer"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Spinning Pod...</span>
                </>
              ) : (
                <>
                  <span>Create Application</span>
                  <span className="hidden sm:inline text-[10px] opacity-70 font-mono">↵ Enter</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Starter Templates with Category Filter */}
        <div className="mt-8 w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-400 light:text-slate-500">
              Starter Templates (Click to Edit)
            </div>
            
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1">
              {["All", "SaaS", "Commerce", "Productivity", "Fintech"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    selectedCategory === cat
                    ? "bg-blue-600 light:bg-blue-700 text-white"
                    : "bg-[#12141c] light:bg-slate-100 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 border border-white/[0.06] light:border-black/[0.06]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredSuggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleStageTemplate(item.prompt)}
                className="p-3.5 bg-[#0f1117] light:bg-white hover:bg-[#161922] light:hover:bg-slate-50 border border-white/[0.08] light:border-black/[0.07] rounded-xl text-left transition-colors group flex flex-col justify-between shadow-sm cursor-pointer relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-blue-400 light:text-blue-600 uppercase">{item.category}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartSession(item.prompt);
                      }}
                      disabled={loading}
                      title="Instant Launch"
                      className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 text-[9px] font-mono bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded border border-blue-500/30 transition-all"
                    >
                      ⚡ Run
                    </button>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 group-hover:text-blue-400 light:group-hover:text-blue-600 transition-colors">
                      <path d="M5 12h14" />
                      <path d="M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="text-xs font-medium text-white light:text-slate-900 mt-1">{item.title}</div>
                <div className="text-[11px] text-slate-400 light:text-slate-500 mt-1 line-clamp-1">{item.prompt}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
