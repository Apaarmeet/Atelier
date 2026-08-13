"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  
  // Resizable split pane state
  const [chatWidth, setChatWidth] = useState<number>(440);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<"responsive" | "tablet" | "mobile">("responsive");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);

  // Track if user is scrolled near bottom
  const handleChatScroll = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  // Dragging logic for split pane
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = e.clientX - containerRect.left;
    const minWidth = 300;
    const maxWidth = Math.min(containerRect.width - 320, 850);
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setChatWidth(newWidth);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Fetch messages and preview url
  useEffect(() => {
    const storedUrl = sessionStorage.getItem(`preview-${sessionId}`);
    const storedPod = sessionStorage.getItem(`podName-${sessionId}`);
    
    if (storedUrl && storedPod) {
      setTimeout(() => setPreviewUrl(storedUrl), 3000);
      setPodName(storedPod);
    } else {
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
      if (!res.ok) return;
      const data = await res.json();
      const newMsgs = data.messages || [];

      setMessages(prev => {
        // Only auto-scroll to bottom if user is already near bottom or messages updated
        if (isAtBottomRef.current) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
        return newMsgs;
      });
    } catch (err) {
      // Silently catch transient network polling errors
    }
  };

  const handleSendMessage = async () => {
    if (!prompt.trim() || !podName) return;
    setLoading(true);
    const content = prompt;
    setPrompt("");
    
    setMessages(prev => [...prev, { role: "user", content }]);
    isAtBottomRef.current = true;
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

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

  const refreshPreview = () => {
    if (previewUrl) {
      const currentUrl = previewUrl;
      setPreviewUrl("");
      setTimeout(() => setPreviewUrl(currentUrl), 300);
    }
  };

  return (
    <div ref={containerRef} className="flex h-full w-full relative select-none bg-neutral-950 text-white font-sans">
      {/* Invisible overlay while dragging to prevent iframe from intercepting mouse movements */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}

      {/* Chat Pane (Left / Middle) */}
      <div 
        style={{ width: `${chatWidth}px` }} 
        className="flex flex-col bg-neutral-950 border-r border-white/5 h-full relative z-10 shadow-[10px_0_30px_rgba(0,0,0,0.8)] flex-shrink-0"
      >
        {/* Workspace Header */}
        <div className="p-4 border-b border-white/5 bg-neutral-900/60 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="font-bold text-sm tracking-tight text-white">Agent Workspace</h2>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-white/5">
            {chatWidth}px
          </span>
        </div>
        
        {/* Messages Stream */}
        <div 
          ref={chatScrollRef} 
          onScroll={handleChatScroll}
          className="flex-1 overflow-y-auto p-4 space-y-4 pb-28"
        >
          {messages.map((msg, idx) => {
            if (msg.role === "tool") return null;
            
            const isUser = msg.role === "user";
            const toolCalls = msg.toolCalls;
            
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                {msg.content && (
                  <div className={`max-w-[88%] p-3.5 text-xs md:text-sm leading-relaxed ${
                    isUser 
                    ? "bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 text-white rounded-2xl rounded-br-none shadow-lg shadow-rose-500/15" 
                    : "bg-neutral-900/90 text-neutral-200 border border-white/10 rounded-2xl rounded-bl-none shadow-md backdrop-blur-md prose prose-invert prose-sm max-w-none"
                  }`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                )}
                
                {/* Agent Action Log Cards */}
                {!isUser && toolCalls && Array.isArray(toolCalls) && toolCalls.map((tc: any, i: number) => (
                  <div key={i} className="mt-2 w-full max-w-[88%] bg-neutral-950 border border-emerald-500/20 rounded-xl p-3 font-mono text-[11px] text-emerald-400 shadow-inner">
                    <div className="flex items-center gap-2 mb-1 opacity-80">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-semibold text-[10px] uppercase tracking-wider text-emerald-300">Tool Execution</span>
                    </div>
                    <div className="text-neutral-300 overflow-x-auto whitespace-nowrap">
                      $ {tc.function?.name}( {tc.function?.arguments?.length > 45 ? tc.function?.arguments?.substring(0, 45) + "..." : tc.function?.arguments} )
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-neutral-400 p-2.5 bg-neutral-900/40 rounded-2xl border border-white/5 w-fit">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Forge AI is analyzing code & writing files...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent pt-8">
          <div className="relative bg-neutral-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl focus-within:border-rose-500/60 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all">
            <textarea
              placeholder="Ask for changes or new features..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full bg-transparent text-white p-3.5 pr-12 resize-none focus:outline-none max-h-32 text-xs md:text-sm placeholder-neutral-500"
              rows={2}
            />
            <button 
              onClick={handleSendMessage}
              disabled={loading || !prompt.trim()}
              className="absolute right-2.5 bottom-2.5 p-2 bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 text-white rounded-xl hover:scale-105 active:scale-95 disabled:opacity-40 transition-all shadow-md"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Draggable Split Handle Bar */}
      <div 
        onMouseDown={handleMouseDown}
        className={`w-2 hover:w-2.5 bg-neutral-900 hover:bg-rose-500 cursor-col-resize flex-shrink-0 transition-all group z-30 flex items-center justify-center border-r border-white/5 ${
          isDragging ? "bg-rose-500" : ""
        }`}
        title="Drag to resize pane width"
      >
        <div className={`w-0.5 h-12 rounded-full transition-colors ${isDragging ? "bg-white" : "bg-neutral-600 group-hover:bg-white"}`} />
      </div>

      {/* Preview Pane (Right) */}
      <div className="flex-1 bg-neutral-950 flex flex-col overflow-hidden relative">
        {/* Preview Control Bar */}
        <div className="p-3 bg-neutral-900/80 border-b border-white/5 flex items-center justify-between z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sandbox Connected</span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-1 bg-neutral-950/80 p-0.5 rounded-full border border-white/5 text-xs">
              <button
                onClick={() => setDeviceMode("responsive")}
                className={`px-3 py-1 rounded-full transition-all text-xs font-semibold ${
                  deviceMode === "responsive" 
                  ? "bg-white text-neutral-950 shadow-sm" 
                  : "text-neutral-400 hover:text-white"
                }`}
              >
                Responsive
              </button>
              <button
                onClick={() => setDeviceMode("tablet")}
                className={`px-3 py-1 rounded-full transition-all text-xs font-semibold ${
                  deviceMode === "tablet" 
                  ? "bg-white text-neutral-950 shadow-sm" 
                  : "text-neutral-400 hover:text-white"
                }`}
              >
                Tablet (768px)
              </button>
              <button
                onClick={() => setDeviceMode("mobile")}
                className={`px-3 py-1 rounded-full transition-all text-xs font-semibold ${
                  deviceMode === "mobile" 
                  ? "bg-white text-neutral-950 shadow-sm" 
                  : "text-neutral-400 hover:text-white"
                }`}
              >
                Mobile (375px)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={refreshPreview}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              title="Refresh Preview"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 0.57-8.38l5.67-5.67" />
              </svg>
            </button>

            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500 text-white text-xs font-semibold rounded-full shadow-md hover:shadow-rose-500/25 hover:scale-105 active:scale-95 transition-all"
                title="Open Preview in New Tab"
              >
                <span>Pop Out</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="flex-1 flex items-center justify-center p-4 bg-neutral-950 overflow-auto">
          {previewUrl ? (
            <div className={`h-full transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.9)] rounded-2xl overflow-hidden border border-white/10 ${
              deviceMode === "mobile"
              ? "w-[375px] h-[667px] max-h-full"
              : deviceMode === "tablet"
              ? "w-[768px] max-h-full"
              : "w-full"
            }`}>
              <iframe 
                src={previewUrl}
                className="w-full h-full border-none bg-white"
                title="Live Preview"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400">
              <div className="w-12 h-12 border-3 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mb-4" />
              <p className="font-semibold text-neutral-200 text-base">Initializing E2B Sandbox MicroVM...</p>
              <p className="text-xs mt-1 text-neutral-500">Starting Vite dev server on port 5173...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
