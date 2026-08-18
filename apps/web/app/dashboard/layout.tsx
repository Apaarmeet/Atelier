"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ORCHESTRATOR_URL } from "@/lib/config";
import { useTheme } from "@/lib/theme";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // Global Keyboard Shortcuts (Cmd+N for New Project, Cmd+K for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/dashboard");
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("workspace-search-input");
        if (searchInput) {
          searchInput.focus();
        } else {
          router.push("/dashboard");
        }
      }
      if (e.key === "Escape" && sessionToDelete) {
        setSessionToDelete(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, sessionToDelete]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/");
      return;
    }
    const u = JSON.parse(storedUser);
    setUser(u);

    // Fetch history
    fetch(`${ORCHESTRATOR_URL}/api/users/${u.id}/sessions`)
      .then(res => res.json())
      .then(data => setSessions(data.sessions || []))
      .catch(err => console.error("Error fetching sessions", err));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    document.cookie = "user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/");
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const { id } = sessionToDelete;
    setIsDeleting(true);

    try {
      await fetch(`${ORCHESTRATOR_URL}/api/sessions/${id}`, {
        method: "DELETE",
      });

      setSessions(prev => prev.filter(s => s.id !== id));
      setSessionToDelete(null);

      if (window.location.pathname.includes(id)) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const promptDeleteSession = (e: React.MouseEvent, session: any) => {
    e.preventDefault();
    e.stopPropagation();
    const title = session.messages?.[0]?.content || "Untitled Project";
    setSessionToDelete({ id: session.id, title });
  };

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    return sessions.filter(s => {
      const title = s.messages?.[0]?.content || "";
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [sessions, searchQuery]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090a0e] light:bg-[#fbfbfa] flex items-center justify-center text-slate-200 light:text-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400 light:text-slate-600">Initializing Atelier Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#090a0e] light:bg-[#fbfbfa] text-slate-100 light:text-slate-900 overflow-hidden font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Precision Studio Sidebar */}
      <aside className={`${
        isCollapsed ? "w-16" : "w-64"
      } flex-shrink-0 bg-[#0c0d12] light:bg-[#ffffff] border-r border-white/[0.08] light:border-black/[0.07] flex flex-col relative z-20 transition-all duration-200 ease-in-out`}>
        
        {/* Workspace Brand Header */}
        <div className="h-14 px-3.5 border-b border-white/[0.08] light:border-black/[0.07] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-blue-500 to-blue-700 light:from-blue-600 light:to-blue-800 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform border border-white/10">
              ✦
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <span className="font-semibold text-xs text-white light:text-slate-900 tracking-tight block truncate">
                  Atelier
                </span>
                <span className="text-[10px] font-mono text-slate-400 light:text-slate-500 block truncate">
                  Studio Pod
                </span>
              </div>
            )}
          </Link>

          {/* Controls: Collapse & Theme */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 rounded-md hover:bg-white/[0.06] light:hover:bg-black/[0.05] transition-colors"
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 rounded-md hover:bg-white/[0.06] light:hover:bg-black/[0.05] transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar collapse"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isCollapsed ? "rotate-180" : ""}`}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* New Application CTA */}
        <div className="p-3">
          <Link 
            href="/dashboard" 
            className={`flex items-center ${isCollapsed ? "justify-center px-0" : "justify-between px-3"} gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 light:bg-blue-700 light:hover:bg-blue-800 text-white font-medium text-xs rounded-lg transition-colors shadow-sm`}
            title="Create New App"
          >
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {!isCollapsed && <span>New Project</span>}
            </div>
            {!isCollapsed && <span className="text-[10px] font-mono opacity-70">⌘N</span>}
          </Link>
        </div>

        {/* Quick Search Bar when expanded */}
        {!isCollapsed && sessions.length > 2 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <input
                id="workspace-search-input"
                type="text"
                placeholder="Filter workspaces... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 bg-[#161922] light:bg-slate-50 border border-white/[0.06] light:border-black/[0.07] rounded-md text-[11px] text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-2.5 top-2.5 text-slate-500">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        )}
        
        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {!isCollapsed ? (
            <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400 light:text-slate-500">
              <span>Workspaces</span>
              <span className="text-[10px] bg-white/[0.06] light:bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                {filteredSessions.length}
              </span>
            </div>
          ) : (
            <div className="h-px bg-white/[0.08] light:border-black/[0.07] my-2" />
          )}

          {filteredSessions.map(session => {
            const isActive = pathname === `/dashboard/${session.id}`;
            const firstMsg = session.messages?.[0]?.content || "Untitled Project";

            return (
              <div key={session.id} className="group relative flex items-center">
                <Link 
                  href={`/dashboard/${session.id}`}
                  className={`flex-1 ${
                    isCollapsed ? "p-2 justify-center" : "px-3 py-2 pr-8"
                  } rounded-lg text-xs font-medium transition-colors truncate flex items-center gap-2.5 ${
                    isActive
                    ? "bg-[#181b26] light:bg-slate-100 text-white light:text-slate-900 border border-white/[0.08] light:border-black/[0.07]"
                    : "text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.04] light:hover:bg-slate-50"
                  }`}
                  title={firstMsg}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isActive ? "bg-blue-400 light:bg-blue-600" : "bg-slate-500 light:bg-slate-400"
                  }`} />
                  {!isCollapsed && (
                    <span className="truncate">{firstMsg}</span>
                  )}
                </Link>

                {!isCollapsed && (
                  <button
                    onClick={(e) => promptDeleteSession(e, session)}
                    className="absolute right-2 p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 rounded transition-all focus:opacity-100"
                    title="Delete project"
                    aria-label="Delete session"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}

          {filteredSessions.length === 0 && !isCollapsed && (
            <div className="p-4 text-center rounded-lg border border-dashed border-white/[0.08] light:border-black/[0.07]">
              <p className="text-xs text-slate-400 light:text-slate-500">No matching projects</p>
              <p className="text-[11px] text-slate-500 light:text-slate-400 mt-0.5">Create one above</p>
            </div>
          )}
        </div>

        {/* System Micro-Telemetry Info */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-t border-white/[0.06] light:border-black/[0.06] text-[10px] font-mono text-slate-400 light:text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 light:bg-emerald-600 animate-pulse" />
              <span>MicroVM Sandbox</span>
            </span>
            <span>24ms RTT</span>
          </div>
        )}

        {/* User Account / Footer */}
        <div className="p-2 border-t border-white/[0.08] light:border-black/[0.07] bg-[#090a0e]/60 light:bg-slate-50">
          <div className={`p-1.5 rounded-lg flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}>
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-md bg-[#181b26] light:bg-white border border-white/[0.08] light:border-black/[0.07] flex items-center justify-center text-xs font-mono font-semibold text-blue-400 light:text-blue-700 flex-shrink-0 shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              {!isCollapsed && (
                <div className="truncate text-left">
                  <div className="text-xs font-medium text-white light:text-slate-900 truncate">{user.name || "Engineer"}</div>
                  <div className="text-[10px] text-slate-400 light:text-slate-500 font-mono truncate">{user.email}</div>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 light:text-slate-500 hover:text-rose-400 rounded-md transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </div>

      {/* Deletion Confirmation Guardrail Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="w-full max-w-sm bg-[#0f1117] light:bg-white border border-white/[0.1] light:border-black/[0.1] rounded-xl p-5 shadow-2xl space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-sm font-semibold text-white light:text-slate-900">
                  Delete Workspace?
                </h3>
                <p className="text-[11px] text-slate-400 light:text-slate-500 mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#161922] light:bg-slate-50 border border-white/[0.06] light:border-black/[0.06] text-xs font-mono text-slate-300 light:text-slate-700 truncate">
              &ldquo;{sessionToDelete.title}&rdquo;
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 light:text-slate-700 hover:bg-white/[0.06] light:hover:bg-black/[0.05] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteSession}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Project</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
