"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/");
      return;
    }
    const u = JSON.parse(storedUser);
    setUser(u);

    // Fetch history
    fetch(`http://localhost:3001/api/users/${u.id}/sessions`)
      .then(res => res.json())
      .then(data => setSessions(data.sessions || []))
      .catch(err => console.error("Error fetching sessions", err));
  }, [router]);

  if (!user) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Lovable
          </h2>
          <Link href="/dashboard" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors" title="New Chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 px-2">Your Projects</div>
          {sessions.map(session => (
            <Link 
              key={session.id} 
              href={`/dashboard/${session.id}`}
              className="block p-3 rounded-xl hover:bg-neutral-800 transition-colors text-sm truncate border border-transparent hover:border-neutral-700"
            >
              {session.messages?.[0]?.content || "New Workspace"}
            </Link>
          ))}
          {sessions.length === 0 && (
            <div className="px-2 text-sm text-neutral-600">No projects yet.</div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-800 text-sm text-neutral-400 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {user.name.charAt(0)}
          </div>
          <div className="truncate">{user.name}</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}
