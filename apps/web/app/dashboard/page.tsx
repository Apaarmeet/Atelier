"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewDashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleStartSession = async () => {
    if (!prompt) return;
    setLoading(true);
    setError("");
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return router.push("/");
      const user = JSON.parse(userStr);

      const res = await fetch("http://localhost:3001/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialPrompt: prompt, userId: user.id }),
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
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-neutral-950">
      <div className="max-w-2xl w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-4 text-center">What do you want to build?</h1>
        <p className="text-neutral-400 text-center mb-8">
          Describe your application in detail, and the Lovable agent will generate a complete React app in a Kubernetes Sandbox.
        </p>

        {error && <div className="mb-4 w-full p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg text-sm whitespace-pre-wrap">{error}</div>}

        <div className="w-full relative shadow-2xl rounded-2xl bg-neutral-900 border border-neutral-700 focus-within:border-blue-500 transition-colors p-2">
          <textarea 
            placeholder="Build a modern SaaS landing page with dark mode, a pricing table, and glassmorphic cards..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-40 bg-transparent text-white p-4 focus:outline-none resize-none"
            autoFocus
          />
          <div className="flex justify-between items-center p-2 border-t border-neutral-800">
            <div className="text-xs text-neutral-500 flex gap-2">
              <span className="bg-neutral-800 px-2 py-1 rounded">React</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Vite</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Tailwind</span>
            </div>
            <button 
              onClick={handleStartSession} 
              disabled={loading || !prompt}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                loading || !prompt 
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                : "bg-white text-black hover:bg-neutral-200 hover:scale-105"
              }`}
            >
              {loading ? "Spinning up K8s Pod..." : "Generate"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
