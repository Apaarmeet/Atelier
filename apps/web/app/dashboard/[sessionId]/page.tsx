"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ORCHESTRATOR_URL } from "@/lib/config";

const QUICK_ITERATIONS = [
  "Add dark mode support",
  "Make responsive on mobile",
  "Add realistic mock data",
  "Add interactive animations"
];

export default function ChatDashboardPage() {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [podName, setPodName] = useState<string>("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
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
    const minWidth = 320;
    const maxWidth = Math.min(containerRect.width - 340, 900);
    
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
      setTimeout(() => setPreviewUrl(storedUrl), 2000);
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
        if (isAtBottomRef.current) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
        return newMsgs;
      });
    } catch (err) {
      // transient network poll
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = textToSend || prompt;
    if (!messageContent.trim() || !podName) return;
    setLoading(true);
    setPrompt("");
    
    setMessages(prev => [...prev, { role: "user", content: messageContent }]);
    isAtBottomRef.current = true;
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      await fetch(`${ORCHESTRATOR_URL}/api/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent, podName }),
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

  const copyToolContent = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div ref={containerRef} className="flex h-full w-full relative select-none bg-[#090a0e] light:bg-[#fbfbfa] text-slate-100 light:text-slate-900 font-sans transition-colors duration-200">
      {/* Drag overlay */}
      {isDragging && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}

      {/* Left Chat Pane */}
      <div 
        style={{ width: `${chatWidth}px` }} 
        className="flex flex-col bg-[#0c0d12] light:bg-[#ffffff] border-r border-white/[0.08] light:border-black/[0.07] h-full relative z-10 flex-shrink-0"
      >
        {/* Workspace Toolbar Header */}
        <div className="h-14 px-4 border-b border-white/[0.08] light:border-black/[0.07] bg-[#0f1117]/80 light:bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 light:bg-emerald-600 animate-pulse" />
            <span className="font-semibold text-xs text-white light:text-slate-900">Atelier Agent</span>
            <span className="text-[10px] font-mono text-slate-400 light:text-slate-500 px-1.5 py-0.5 rounded bg-white/[0.05] light:bg-black/[0.05] border border-white/[0.06] light:border-black/[0.06]">
              Live Loop
            </span>
          </div>
          <span className="text-[11px] text-slate-400 light:text-slate-500 font-mono">
            {chatWidth}px
          </span>
        </div>
        
        {/* Messages Stream */}
        <div 
          ref={chatScrollRef} 
          onScroll={handleChatScroll}
          className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-36 text-xs"
        >
          {messages.map((msg, idx) => {
            if (msg.role === "tool") return null;
            
            const isUser = msg.role === "user";
            const toolCalls = msg.toolCalls;
            
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                
                {/* Role Eyebrow */}
                <div className="text-[10px] font-mono text-slate-400 light:text-slate-500 uppercase tracking-wider mb-1 px-1">
                  {isUser ? "Engineer" : "Atelier Synthesizer"}
                </div>

                {msg.content && (
                  <div className={`max-w-[92%] p-3.5 text-xs leading-relaxed rounded-xl shadow-sm ${
                    isUser 
                    ? "bg-blue-600 light:bg-blue-700 text-white font-medium shadow-blue-600/10" 
                    : "bg-[#161922] light:bg-white text-slate-200 light:text-slate-800 border border-white/[0.08] light:border-black/[0.07]"
                  }`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-invert light:prose-slate prose-xs max-w-none prose-p:leading-relaxed prose-pre:bg-[#090a0e] prose-pre:border prose-pre:border-white/[0.08]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Agent Tool Execution Badges */}
                {!isUser && toolCalls && Array.isArray(toolCalls) && toolCalls.map((tc: any, i: number) => {
                  const fnName = tc.function?.name || "tool";
                  const args = tc.function?.arguments || "";
                  const toolKey = idx * 100 + i;
                  
                  return (
                    <div key={i} className="mt-2 w-full max-w-[92%] bg-[#090a0e] light:bg-slate-900 border border-white/[0.08] rounded-lg p-2.5 font-mono text-[11px] text-slate-300 shadow-inner">
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.06]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span className="font-semibold text-[10px] uppercase text-amber-400">Tool: {fnName}</span>
                        </div>
                        <button
                          onClick={() => copyToolContent(args, toolKey)}
                          className="text-[9px] text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedIndex === toolKey ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="text-slate-400 overflow-x-auto whitespace-pre-wrap break-all text-[10px] max-h-24 overflow-y-auto font-mono">
                        {args}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Quick Iteration Suggestion Chips */}
          {messages.length > 0 && !loading && (
            <div className="pt-2">
              <div className="text-[10px] font-mono text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                Quick Iterations
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ITERATIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-[#161922] light:bg-white hover:bg-[#1e222e] light:hover:bg-slate-100 text-slate-300 light:text-slate-700 border border-white/[0.06] light:border-black/[0.07] shadow-sm transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 light:text-slate-600 p-2.5 bg-[#161922] light:bg-white rounded-lg border border-white/[0.08] light:border-black/[0.07] w-fit shadow-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span>Agent inspecting files & compiling code...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <div className="absolute bottom-0 w-full p-3 bg-gradient-to-t from-[#0c0d12] via-[#0c0d12]/90 to-transparent light:from-white light:via-white/90">
          <div className="relative bg-[#161922] light:bg-slate-50 border border-white/[0.08] light:border-black/[0.08] rounded-xl overflow-hidden shadow-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <textarea
              placeholder="Direct the synthesizer (e.g. Add dark theme switcher, add charts...)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full bg-transparent text-white light:text-slate-900 p-3 pr-10 resize-none focus:outline-none max-h-28 text-xs placeholder-slate-500 light:placeholder-slate-400"
              rows={2}
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={loading || !prompt.trim()}
              className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-500 light:bg-blue-700 light:hover:bg-blue-800 text-white rounded-lg disabled:opacity-40 transition-colors shadow-sm"
              title="Send instructions (Enter)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Draggable Divider Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className={`w-1.5 hover:w-2 bg-[#090a0e] light:bg-slate-200 hover:bg-blue-600 light:hover:bg-blue-600 cursor-col-resize flex-shrink-0 transition-all group z-30 flex items-center justify-center border-r border-white/[0.08] light:border-black/[0.07] ${
          isDragging ? "bg-blue-600" : ""
        }`}
        title="Drag to resize split pane"
      >
        <div className={`w-0.5 h-8 rounded-full transition-colors ${isDragging ? "bg-white" : "bg-slate-600 light:bg-slate-400 group-hover:bg-white"}`} />
      </div>

      {/* Right Live Preview Pane */}
      <div className="flex-1 bg-[#090a0e] light:bg-[#fbfbfa] flex flex-col overflow-hidden relative">
        {/* Preview Control Toolbar */}
        <div className="h-14 px-4 bg-[#0c0d12] light:bg-[#ffffff] border-b border-white/[0.08] light:border-black/[0.07] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {/* Status Beacon */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 light:text-emerald-700 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 light:bg-emerald-600 animate-pulse" />
              <span>Sandbox Live</span>
            </div>

            <div className="h-4 w-px bg-white/[0.08] light:border-black/[0.07] hidden sm:block" />

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-[#161922] light:bg-slate-100 p-0.5 rounded-lg border border-white/[0.06] light:border-black/[0.06] text-xs font-medium">
              <button
                onClick={() => setDeviceMode("responsive")}
                className={`px-2.5 py-1 rounded-md transition-colors text-xs ${
                  deviceMode === "responsive" 
                  ? "bg-[#222836] light:bg-white text-white light:text-slate-900 shadow-sm border border-white/[0.08] light:border-black/[0.06]" 
                  : "text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
                }`}
              >
                Responsive
              </button>
              <button
                onClick={() => setDeviceMode("tablet")}
                className={`px-2.5 py-1 rounded-md transition-colors text-xs ${
                  deviceMode === "tablet" 
                  ? "bg-[#222836] light:bg-white text-white light:text-slate-900 shadow-sm border border-white/[0.08] light:border-black/[0.06]" 
                  : "text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
                }`}
              >
                Tablet (768px)
              </button>
              <button
                onClick={() => setDeviceMode("mobile")}
                className={`px-2.5 py-1 rounded-md transition-colors text-xs ${
                  deviceMode === "mobile" 
                  ? "bg-[#222836] light:bg-white text-white light:text-slate-900 shadow-sm border border-white/[0.08] light:border-black/[0.06]" 
                  : "text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
                }`}
              >
                Mobile (375px)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={refreshPreview}
              className="p-1.5 text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.06] light:hover:bg-black/[0.05] rounded-md transition-colors"
              title="Refresh live preview"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 0.57-8.38l5.67-5.67" />
              </svg>
            </button>

            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 light:bg-blue-700 light:hover:bg-blue-800 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                title="Open Preview in New Tab"
              >
                <span>Pop Out</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Viewport Frame with Simulated Browser Chrome */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 bg-[#090a0e] light:bg-[#fbfbfa] overflow-auto">
          {previewUrl ? (
            <div className={`h-full flex flex-col transition-all duration-200 rounded-xl overflow-hidden border border-white/[0.08] light:border-black/[0.08] bg-white shadow-2xl ${
              deviceMode === "mobile"
              ? "w-[375px] h-[667px] max-h-full ring-1 ring-white/10"
              : deviceMode === "tablet"
              ? "w-[768px] max-h-full ring-1 ring-white/10"
              : "w-full"
            }`}>
              {/* Simulated Browser URL Bar */}
              <div className="h-8 bg-[#11141a] light:bg-slate-100 border-b border-white/[0.08] light:border-black/[0.07] px-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-emerald-400">🔒</span>
                  <span className="text-slate-300 light:text-slate-700 truncate">localhost:5173</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    {deviceMode === "mobile" ? "375 × 667" : deviceMode === "tablet" ? "768 × 1024" : "100%"}
                  </span>
                </div>
              </div>

              <iframe 
                src={previewUrl}
                className="w-full flex-1 border-none bg-white"
                title="Live Application Preview"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 light:text-slate-600 p-6 text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="font-medium text-white light:text-slate-900 text-sm">Initializing E2B MicroVM Sandbox...</p>
              <p className="text-xs mt-1 text-slate-400 light:text-slate-500 font-mono">Starting Vite dev server on port 5173...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
