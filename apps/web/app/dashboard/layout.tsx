"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ORCHESTRATOR_URL } from "@/lib/config";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

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

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setSessions(prev => prev.filter(s => s.id !== sessionId));

    try {
      await fetch(`${ORCHESTRATOR_URL}/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (window.location.pathname.includes(sessionId)) {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-neutral-400">Loading Lovable AI...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      {/* Pinterest-Style Collapsible Sidebar */}
      <div className={`${
        isCollapsed ? "w-20" : "w-72"
      } flex-shrink-0 bg-neutral-900/60 border-r border-white/5 flex flex-col backdrop-blur-xl relative z-20 transition-all duration-300 ease-in-out`}>
        
        {/* Brand Header & Toggle */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group truncate">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-500 to-blue-500 p-0.5 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <span className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-blue-400">
                  L
                </span>
              </div>
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h2 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5 truncate">
                  Lovable <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">AI</span>
                </h2>
                <p className="text-[11px] text-neutral-400 truncate">Application Studio</p>
              </div>
            )}
          </Link>

          {/* Theme & Collapse Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex-shrink-0"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
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

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all flex-shrink-0"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
          </div>
        </div>

        {/* Create New App Button */}
        <div className="p-3">
          <Link 
            href="/dashboard" 
            className={`flex items-center justify-center gap-2 w-full ${
              isCollapsed ? "py-3 px-0 rounded-2xl" : "py-3 px-4 rounded-full"
            } bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 text-white font-semibold text-xs shadow-lg shadow-rose-500/20 hover:shadow-rose-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all`}
            title="Create New App"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {!isCollapsed && <span>Create New App</span>}
          </Link>
        </div>
        
        {/* Session / Project List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1.5">
          {!isCollapsed ? (
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest px-3 py-1.5 flex justify-between items-center">
              <span>Your Projects</span>
              <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full text-[9px]">{sessions.length}</span>
            </div>
          ) : (
            <div className="h-px bg-white/5 my-2" />
          )}

          {sessions.map(session => (
            <div key={session.id} className="group relative flex items-center">
              <Link 
                href={`/dashboard/${session.id}`}
                className={`flex-1 ${
                  isCollapsed ? "p-3 justify-center" : "p-3 pr-9"
                } rounded-2xl hover:bg-white/5 transition-all text-xs font-medium text-neutral-300 hover:text-white truncate border border-transparent hover:border-white/10 flex items-center gap-2.5`}
                title={session.messages?.[0]?.content || "Workspace"}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">{session.messages?.[0]?.content || "Untitled Workspace"}</span>
                )}
              </Link>

              {!isCollapsed && (
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="absolute right-2 p-1.5 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Delete Project"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {sessions.length === 0 && !isCollapsed && (
            <div className="px-3 py-6 text-center text-xs text-neutral-400 bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-800">
              <p className="font-medium text-neutral-400">No active projects</p>
              <p className="text-[11px] text-neutral-500 mt-1">Start by describing your app!</p>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-white/5 bg-neutral-950/40">
          <div className={`p-2 bg-neutral-900/80 border border-white/5 rounded-2xl flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}>
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
                {user.name.charAt(0)}
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <div className="truncate text-xs font-semibold text-white">{user.name}</div>
                  <div className="truncate text-[10px] text-neutral-400">{user.email}</div>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex-shrink-0"
                title="Log Out"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
