"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch session count on mount
    fetch("http://localhost:3001/api/sessions/count")
      .then((res) => res.json())
      .then((data) => setSessionCount(data.count || 0))
      .catch((err) => console.error("Error fetching session count", err));
  }, []);

  const handleStartSession = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialPrompt: prompt }),
      });
      const data = await res.json();
      
      if (data.previewUrl) {
        // Wait a few seconds for the Vite server to boot up before showing iframe
        setTimeout(() => {
          setPreviewUrl(data.previewUrl);
        }, 4000);
      }
      setSessionCount(prev => prev + 1);
    } catch (err) {
      console.error("Error starting session:", err);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* Left Panel */}
      <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", borderRight: "1px solid #eaeaea", backgroundColor: "#fff", zIndex: 10 }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>Lovable Agent</h1>
        
        {/* Simple Chart / Stat */}
        <div style={{ margin: "10px 0 30px", padding: "20px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #eaeaea" }}>
          <h3 style={{ margin: "0 0 15px 0", fontSize: "16px", color: "#333" }}>Usage Stats</h3>
          
          <div style={{ display: "flex", alignItems: "flex-end", height: "100px", gap: "12px", borderBottom: "1px solid #ccc", paddingBottom: "5px" }}>
            <div style={{ 
              width: "40px", 
              background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)", 
              height: `${Math.min(sessionCount * 10, 100)}%`, 
              minHeight: "5px",
              transition: "height 0.5s ease-out",
              borderRadius: "4px 4px 0 0"
            }}></div>
            <div style={{ 
              width: "40px", 
              background: "#e5e7eb", 
              height: "100%",
              borderRadius: "4px 4px 0 0"
            }}></div>
          </div>
          <p style={{ marginTop: "15px", fontSize: "14px" }}>Total Sessions Created: <strong>{sessionCount}</strong></p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flexGrow: 1 }}>
          <label style={{ fontWeight: "600", fontSize: "14px" }}>Describe your React App:</label>
          <textarea 
            placeholder="Build a modern frontend web application with a responsive hero section, features grid, and dark mode UI..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ 
              width: "100%", 
              height: "200px", 
              padding: "15px", 
              borderRadius: "8px",
              border: "1px solid #ccc",
              resize: "none",
              fontSize: "14px",
              fontFamily: "inherit"
            }}
          />
          <button 
            onClick={handleStartSession} 
            disabled={loading || !prompt}
            style={{ 
              padding: "12px 20px", 
              background: loading || !prompt ? "#ccc" : "#000", 
              color: "#fff", 
              cursor: loading || !prompt ? "not-allowed" : "pointer",
              borderRadius: "8px",
              fontWeight: "bold",
              marginTop: "10px",
              border: "none"
            }}
          >
            {loading ? "Initializing Workspace..." : "Generate Application"}
          </button>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div style={{ flex: 2, background: "#f0f0f0", position: "relative" }}>
        {previewUrl ? (
           <iframe 
             src={previewUrl} 
             style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#fff" }} 
             title="App Preview" 
           />
        ) : (
           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#888" }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "20px", opacity: 0.5 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <p>Generated application preview will appear here.</p>
           </div>
        )}
      </div>
    </div>
  );
}
