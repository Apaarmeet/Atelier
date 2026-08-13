"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ORCHESTRATOR_URL } from "@/lib/config";

export default function ChatDashboardPage() {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [podName, setPodName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages and preview url
  useEffect(() => {
    // Check if we have previewUrl saved from creation
    const storedUrl = sessionStorage.getItem(`preview-${sessionId}`);
    const storedPod = sessionStorage.getItem(`podName-${sessionId}`);
    
    if (storedUrl && storedPod) {
      // Delay iframe load to allow Vite to boot
      setTimeout(() => setPreviewUrl(storedUrl), 3000);
      setPodName(storedPod);
    } else {
      // Fetch it from the backend for existing sessions
      fetch(`${ORCHESTRATOR_URL}/api/sessions/${sessionId}/preview`)
        .then(res => res.json())
        .then(data => {
          if (data.previewUrl) {
            setPreviewUrl(data.previewUrl);
            setPodName(data.podName);
          }
        })
        .catch(err => console.error("Error fetching preview URL", err));
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/api/sessions/${sessionId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  };

  const handleSendMessage = async () => {
    if (!prompt.trim() || !podName) return;
    setLoading(true);
    const content = prompt;
    setPrompt("");
    
    // Optimistic update
    setMessages(prev => [...prev, { role: "user", content }]);

    try {
      await fetch(`${ORCHESTRATOR_URL}/api/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, podName }),
      });
    } catch (err) {
      console.error("Error sending message", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Chat Pane (Middle) */}
      <div className="w-1/3 flex flex-col bg-neutral-950 border-r border-neutral-800 h-full relative z-10 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur">
          <h2 className="font-bold text-white">Chat with Agent</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {messages.map((msg, idx) => {
            if (msg.role === "tool") return null; // Hide raw tool outputs for cleaner UI
            
            const isUser = msg.role === "user";
            const toolCalls = msg.toolCalls;
            
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                {msg.content && (
                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                    isUser 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none prose prose-invert prose-sm max-w-none"
                  }`}>
                    {isUser ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                )}
                
                {/* Render Agent Action Logs */}
                {!isUser && toolCalls && Array.isArray(toolCalls) && toolCalls.map((tc: any, i: number) => (
                  <div key={i} className="mt-2 w-full max-w-[85%] bg-black border border-neutral-800 rounded-lg p-3 font-mono text-xs text-green-400">
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span>Agent executing tool...</span>
                    </div>
                    <div className="text-neutral-300 overflow-x-auto whitespace-nowrap">
                      $ {tc.function?.name}( {tc.function?.arguments?.length > 50 ? tc.function?.arguments?.substring(0, 50) + "..." : tc.function?.arguments} )
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-neutral-950 via-neutral-950 to-transparent pt-10">
          <div className="relative bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl focus-within:border-blue-500 transition-colors">
            <textarea
              placeholder="Ask for changes..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full bg-transparent text-white p-3 pr-12 resize-none focus:outline-none max-h-32"
              rows={2}
            />
            <button 
              onClick={handleSendMessage}
              disabled={loading || !prompt.trim()}
              className="absolute right-2 bottom-2 p-2 bg-white text-black rounded-lg hover:bg-neutral-200 disabled:opacity-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Pane (Right) */}
      <div className="flex-1 bg-white relative">
        {previewUrl ? (
          <iframe 
            src={previewUrl}
            className="w-full h-full border-none"
            title="Live Preview"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400 bg-neutral-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="font-semibold text-neutral-600">Booting Kubernetes Sandbox...</p>
            <p className="text-sm mt-2">Starting dev server...</p>
          </div>
        )}
      </div>
    </div>
  );
}
