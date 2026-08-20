"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ORCHESTRATOR_URL } from "@/lib/config";
import ClaudeThinkingLoader from "@/lib/ClaudeThinkingLoader";

const QUICK_ITERATIONS = [
  "Add dark mode support",
  "Make responsive on mobile",
  "Add realistic mock data",
  "Add interactive animations"
];

interface ToolCallData {
  name: string;
  actionType: "create" | "modify" | "command" | "generic";
  target: string;
  lineCount?: number;
  contentPreview?: string;
  rawArgs: string;
}

interface TerminalLog {
  id: string;
  command: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

function parseToolCall(tc: any): ToolCallData {
  const name = tc.function?.name || tc.name || "tool";
  const rawArgs = tc.function?.arguments || tc.arguments || "";
  let parsed: any = {};
  try {
    parsed = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
  } catch {
    parsed = {};
  }

  const target = parsed.path || parsed.target || parsed.file || parsed.command || parsed.name || "";
  let actionType: ToolCallData["actionType"] = "generic";
  if (name.includes("create") || name.includes("write") || name.includes("add")) actionType = "create";
  else if (name.includes("edit") || name.includes("patch") || name.includes("update")) actionType = "modify";
  else if (name.includes("cmd") || name.includes("command") || name.includes("exec") || name.includes("install")) actionType = "command";

  const codeContent = parsed.content || parsed.code || parsed.replacement || "";
  const lineCount = codeContent ? codeContent.split("\n").length : undefined;

  return {
    name,
    actionType,
    target: target || name,
    lineCount,
    contentPreview: codeContent || (typeof parsed === "object" && Object.keys(parsed).length > 0 ? JSON.stringify(parsed, null, 2) : rawArgs),
    rawArgs: typeof rawArgs === "string" ? rawArgs : JSON.stringify(rawArgs, null, 2)
  };
}

export default function ChatDashboardPage() {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [podName, setPodName] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  
  // Right Pane Tab: "preview" | "code"
  const [activePaneTab, setActivePaneTab] = useState<"preview" | "code">("preview");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContentCache, setFileContentCache] = useState<Record<string, string>>({});
  const [liveSandboxFiles, setLiveSandboxFiles] = useState<string[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  // Retractable Integrated Terminal State (Inside Code & Files tab)
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(true);
  const [terminalHeight, setTerminalHeight] = useState<number>(200);
  const [isTerminalDragging, setIsTerminalDragging] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: "init",
      command: "",
      stdout: "Atelier Terminal — Connected to E2B Sandbox (/home/user/app)\nType any bash command (e.g. `ls -la`, `npm list`, `cat package.json`)\n"
    }
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [isExecutingCmd, setIsExecutingCmd] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  // Resizable split pane state (Chat width)
  const [chatWidth, setChatWidth] = useState<number>(440);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<"responsive" | "tablet" | "mobile">("responsive");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);

  // Combine touched files from tool calls with live sandbox files
  const allFilesList = useMemo(() => {
    const set = new Set<string>();
    liveSandboxFiles.forEach(f => set.add(f));
    messages.forEach(msg => {
      if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
        msg.toolCalls.forEach((tc: any) => {
          const parsed = parseToolCall(tc);
          if (parsed.target && (parsed.target.includes("/") || parsed.target.includes("."))) {
            set.add(parsed.target.replace(/^\/home\/user\/app\//, ''));
          }
        });
      }
    });
    return Array.from(set).sort();
  }, [liveSandboxFiles, messages]);

  // Fetch real file list from sandbox
  const fetchSandboxFiles = useCallback(async () => {
    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/api/sessions/${sessionId}/files`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.files)) {
        setLiveSandboxFiles(data.files);
      }
    } catch {
      // transient
    }
  }, [sessionId]);

  // Load single file content directly from sandbox
  const loadFileContent = useCallback(async (filePath: string) => {
    setSelectedFile(filePath);
    if (fileContentCache[filePath]) return;

    setIsLoadingFile(true);
    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/api/sessions/${sessionId}/files/content?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContentCache(prev => ({ ...prev, [filePath]: data.content || "" }));
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingFile(false);
    }
  }, [sessionId, fileContentCache]);

  // Default selection when files arrive
  useEffect(() => {
    if (allFilesList.length > 0 && !selectedFile) {
      const defaultFile = allFilesList.find(f => f.includes("App.") || f.includes("main.")) || allFilesList[0];
      if (defaultFile) {
        loadFileContent(defaultFile);
      }
    }
  }, [allFilesList, selectedFile, loadFileContent]);

  // Auto-fetch sandbox files when opening code tab
  useEffect(() => {
    if (activePaneTab === "code") {
      fetchSandboxFiles();
    }
  }, [activePaneTab, fetchSandboxFiles]);

  // Track scroll position
  const handleChatScroll = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  // Dragging logic for left/right split pane
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const minWidth = 320;
      const maxWidth = Math.min(containerRect.width - 340, 900);
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setChatWidth(newWidth);
      }
    }

    if (isTerminalDragging) {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight >= 80 && newHeight <= 450) {
        setTerminalHeight(newHeight);
      }
    }
  }, [isDragging, isTerminalDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsTerminalDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging || isTerminalDragging) {
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
  }, [isDragging, isTerminalDragging, handleMouseMove, handleMouseUp]);

  // Divider keyboard resize
  const handleDividerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setChatWidth(prev => Math.max(320, prev - 20));
    } else if (e.key === "ArrowRight") {
      setChatWidth(prev => Math.min(900, prev + 20));
    }
  };

  // Fetch messages and preview url
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/api/sessions/${sessionId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      const newMsgs: any[] = data.messages || [];

      // Determine running state directly from backend flag with fallback to last message role
      let isRunning = false;
      if (typeof data.isRunning === "boolean") {
        isRunning = data.isRunning;
      } else if (newMsgs.length > 0) {
        const lastMsg = newMsgs[newMsgs.length - 1];
        // If last message is from user or tool, agent is still working
        if (lastMsg.role === "user" || lastMsg.role === "tool") {
          isRunning = true;
        } else if (lastMsg.role === "assistant" && lastMsg.content && !lastMsg.toolCalls) {
          isRunning = false;
        }
      }

      // If backend reports agent has finished, clear all loading and active flags
      if (!isRunning) {
        setIsAgentRunning(false);
        setLoading(false);
      } else {
        setIsAgentRunning(true);
      }

      setMessages(prev => {
        const pendingErrors = prev.filter(m => m.status === "error");
        if (isAtBottomRef.current) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
        return [...newMsgs, ...pendingErrors.filter(pe => !newMsgs.some((nm: any) => nm.id === pe.id))];
      });
    } catch {
      // transient network poll
    }
  }, [sessionId]);

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
    // Fast polling (1.5s) while agent is running, standard (3s) when idle
    const pollInterval = (isAgentRunning || loading) ? 1500 : 3000;
    const interval = setInterval(fetchMessages, pollInterval);
    return () => clearInterval(interval);
  }, [sessionId, fetchMessages, isAgentRunning, loading]);

  const handleSendMessage = async (textToSend?: string, retryId?: string) => {
    const messageContent = textToSend || prompt;
    if (!messageContent.trim()) return;
    
    const msgId = retryId || `temp-${Date.now()}`;
    setLoading(true);
    setIsAgentRunning(true);
    if (!retryId) setPrompt("");
    
    setMessages(prev => {
      const filtered = prev.filter(m => m.id !== msgId);
      return [...filtered, { id: msgId, role: "user", content: messageContent, status: "sending" }];
    });

    isAtBottomRef.current = true;
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/api/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent, podName: podName || "default" }),
      });

      if (!res.ok) {
        throw new Error("Failed to deliver message to orchestrator");
      }

      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "sent" } : m));
      setTimeout(fetchSandboxFiles, 2000);
      // Immediately trigger a message poll to catch early tool output
      setTimeout(fetchMessages, 800);
    } catch (err) {
      console.error("Error sending message", err);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: "error" } : m));
      setLoading(false);
      setIsAgentRunning(false);
    }
  };



  // Run terminal command
  const handleExecuteTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim() || isExecutingCmd) return;

    const cmd = terminalInput.trim();
    setTerminalInput("");
    setIsExecutingCmd(true);
    setCmdHistory(prev => [...prev, cmd]);
    setHistoryIndex(null);

    const logId = `cmd-${Date.now()}`;
    setTerminalLogs(prev => [...prev, { id: logId, command: cmd }]);

    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/api/sessions/${sessionId}/terminal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      
      setTerminalLogs(prev => prev.map(log => {
        if (log.id === logId) {
          return {
            ...log,
            stdout: data.stdout,
            stderr: data.stderr,
            exitCode: data.exitCode
          };
        }
        return log;
      }));

      // Refresh files in case the command added/removed files
      fetchSandboxFiles();
    } catch (err: any) {
      setTerminalLogs(prev => prev.map(log => {
        if (log.id === logId) {
          return { ...log, stderr: `Execution failed: ${err.message}`, exitCode: 1 };
        }
        return log;
      }));
    } finally {
      setIsExecutingCmd(false);
      setTimeout(() => {
        if (terminalScrollRef.current) {
          terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      const nextIdx = historyIndex === null ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setTerminalInput(cmdHistory[nextIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= cmdHistory.length) {
        setHistoryIndex(null);
        setTerminalInput("");
      } else {
        setHistoryIndex(nextIdx);
        setTerminalInput(cmdHistory[nextIdx] || "");
      }
    }
  };

  const refreshPreview = () => {
    if (previewUrl) {
      const currentUrl = previewUrl;
      setPreviewUrl("");
      setTimeout(() => setPreviewUrl(currentUrl), 300);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const toggleToolExpand = (key: string) => {
    setExpandedTools(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentDisplayedContent = selectedFile 
    ? (fileContentCache[selectedFile] || "Loading file contents from sandbox...")
    : "Select a file to inspect code";

  return (
    <div ref={containerRef} className="flex h-full w-full relative select-none bg-[#090a0e] light:bg-[#fbfbfa] text-slate-100 light:text-slate-900 font-sans transition-colors duration-200">
      {/* Drag overlay */}
      {(isDragging || isTerminalDragging) && <div className="fixed inset-0 z-50 cursor-col-resize select-none" />}

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
            const isError = msg.status === "error";
            
            return (
              <div key={msg.id || idx} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                
                {/* Role Eyebrow */}
                <div className="text-[10px] font-mono text-slate-400 light:text-slate-500 uppercase tracking-wider mb-1 px-1 flex items-center gap-2">
                  <span>{isUser ? "Engineer" : "Atelier Synthesizer"}</span>
                  {isError && (
                    <span className="text-rose-400 text-[9px] lowercase font-sans font-medium flex items-center gap-1">
                      ⚠️ failed to send
                    </span>
                  )}
                </div>

                {msg.content && (
                  <div className={`max-w-[92%] p-3.5 text-xs leading-relaxed rounded-xl shadow-sm ${
                    isUser 
                    ? isError
                      ? "bg-rose-500/15 border border-rose-500/30 text-rose-200 light:text-rose-800"
                      : "bg-blue-600 light:bg-blue-700 text-white font-medium shadow-blue-600/10" 
                    : "bg-[#161922] light:bg-white text-slate-200 light:text-slate-800 border border-white/[0.08] light:border-black/[0.07]"
                  }`}>
                    {isUser ? (
                      <div className="flex flex-col gap-1.5">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {isError && (
                          <div className="pt-1.5 border-t border-rose-500/20 flex items-center justify-between text-[11px]">
                            <span className="text-rose-400 font-mono text-[10px]">Network timeout</span>
                            <button
                              onClick={() => handleSendMessage(msg.content, msg.id)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium text-[10px] transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="prose prose-invert light:prose-slate prose-xs max-w-none prose-p:leading-relaxed prose-pre:bg-[#090a0e] prose-pre:border prose-pre:border-white/[0.08]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Agent Tool Execution Badges (Parsed & Expandable) */}
                {!isUser && toolCalls && Array.isArray(toolCalls) && toolCalls.map((tc: any, i: number) => {
                  const toolKey = `tc-${idx}-${i}`;
                  const parsed = parseToolCall(tc);
                  const isExpanded = expandedTools[toolKey] || false;
                  
                  return (
                    <div key={i} className="mt-2 w-full max-w-[92%] bg-[#0f1117] light:bg-slate-50 border border-white/[0.08] light:border-black/[0.08] rounded-lg p-2.5 font-mono text-[11px] shadow-sm transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            parsed.actionType === "create" ? "bg-emerald-400" :
                            parsed.actionType === "modify" ? "bg-amber-400" : "bg-blue-400"
                          }`} />
                          <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold tracking-wider ${
                            parsed.actionType === "create" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            parsed.actionType === "modify" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {parsed.actionType === "create" ? "CREATED" : parsed.actionType === "modify" ? "MODIFIED" : "COMMAND"}
                          </span>
                          <span className="text-slate-300 light:text-slate-700 truncate font-semibold">
                            {parsed.target}
                          </span>
                          {parsed.lineCount && (
                            <span className="text-[10px] text-slate-500 hidden sm:inline">
                              +{parsed.lineCount} lines
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => copyToClipboard(parsed.contentPreview || parsed.rawArgs, toolKey)}
                            className="text-[9px] text-slate-400 hover:text-white light:hover:text-slate-900 transition-colors px-1 cursor-pointer"
                            title="Copy code"
                          >
                            {copiedKey === toolKey ? "✓ Copied" : "Copy"}
                          </button>
                          <button
                            onClick={() => toggleToolExpand(toolKey)}
                            className="p-0.5 text-slate-400 hover:text-white light:hover:text-slate-900 rounded transition-colors cursor-pointer"
                            title={isExpanded ? "Collapse code" : "Expand code"}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}>
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expandable Code Content */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-white/[0.06] light:border-black/[0.06]">
                          <pre className="text-[10px] text-slate-400 light:text-slate-600 max-h-48 overflow-y-auto whitespace-pre-wrap break-all bg-[#090a0e] light:bg-slate-100 p-2 rounded border border-white/[0.04] light:border-black/[0.04] select-text">
                            {parsed.contentPreview}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Quick Iteration Suggestion Chips */}
          {messages.length > 0 && !loading && !isAgentRunning && (
            <div className="pt-2">
              <div className="text-[10px] font-mono text-slate-400 light:text-slate-500 uppercase tracking-wider mb-2">
                Quick Iterations
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ITERATIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-2.5 py-1 rounded-md text-[11px] bg-[#161922] light:bg-white hover:bg-[#1e222e] light:hover:bg-slate-100 text-slate-300 light:text-slate-700 border border-white/[0.06] light:border-black/[0.07] shadow-sm transition-colors cursor-pointer"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Claude Code Style Dynamic Thinking Loader */}
          {(loading || isAgentRunning) && (
            <ClaudeThinkingLoader 
              activeTool={
                messages.length > 0 && messages[messages.length - 1]?.toolCalls?.[0]?.function?.name
                  ? messages[messages.length - 1].toolCalls[0].function.name
                  : undefined
              }
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <div className="absolute bottom-0 w-full p-3 bg-gradient-to-t from-[#0c0d12] via-[#0c0d12]/90 to-transparent light:from-white light:via-white/90">
          <div className={`relative bg-[#161922] light:bg-slate-50 border ${
            isAgentRunning || loading ? "border-blue-500/40 ring-1 ring-blue-500/20" : "border-white/[0.08] light:border-black/[0.08]"
          } rounded-xl overflow-hidden shadow-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all`}>
            <textarea
              placeholder={isAgentRunning || loading ? "Agent is currently synthesizing code..." : "Direct the synthesizer (e.g. Add dark theme switcher, add charts...)"}
              value={prompt}
              disabled={isAgentRunning || loading}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (!e.shiftKey || e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  if (!isAgentRunning && !loading) {
                    handleSendMessage();
                  }
                }
              }}
              className="w-full bg-transparent text-white light:text-slate-900 p-3 pr-10 resize-none focus:outline-none max-h-28 text-xs placeholder-slate-500 light:placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
              rows={2}
            />
            <button 
              onClick={() => handleSendMessage()}
              disabled={loading || isAgentRunning || !prompt.trim()}
              className="absolute right-2 bottom-2 p-1.5 bg-blue-600 hover:bg-blue-500 light:bg-blue-700 light:hover:bg-blue-800 text-white rounded-lg disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
              title="Send instructions (Enter)"
            >
              {isAgentRunning || loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* Accessible Draggable Divider Handle */}
      <div 
        role="separator"
        tabIndex={0}
        aria-valuenow={chatWidth}
        aria-valuemin={320}
        aria-valuemax={900}
        aria-orientation="vertical"
        aria-label="Resize chat and preview panels"
        onMouseDown={handleMouseDown}
        onKeyDown={handleDividerKeyDown}
        className={`w-1.5 hover:w-2 bg-[#090a0e] light:bg-slate-200 hover:bg-blue-600 light:hover:bg-blue-600 cursor-col-resize flex-shrink-0 transition-all group z-30 flex items-center justify-center border-r border-white/[0.08] light:border-black/[0.07] outline-none focus:ring-1 focus:ring-blue-500 ${
          isDragging ? "bg-blue-600" : ""
        }`}
        title="Drag or use Left/Right arrows to resize"
      >
        <div className={`w-0.5 h-8 rounded-full transition-colors ${isDragging ? "bg-white" : "bg-slate-600 light:bg-slate-400 group-hover:bg-white"}`} />
      </div>

      {/* Right Studio Workspace (Live Preview OR Code & Files with Retractable Terminal) */}
      <div className="flex-1 bg-[#090a0e] light:bg-[#fbfbfa] flex flex-col overflow-hidden relative">
        {/* Workspace Mode Switcher Toolbar */}
        <div className="h-14 px-4 bg-[#0c0d12] light:bg-[#ffffff] border-b border-white/[0.08] light:border-black/[0.07] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {/* View Mode Toggle: Preview vs Code */}
            <div className="flex items-center gap-1 bg-[#161922] light:bg-slate-100 p-0.5 rounded-lg border border-white/[0.06] light:border-black/[0.06] text-xs font-medium">
              <button
                onClick={() => setActivePaneTab("preview")}
                className={`px-3 py-1 rounded-md transition-colors text-xs flex items-center gap-1.5 cursor-pointer ${
                  activePaneTab === "preview" 
                  ? "bg-[#222836] light:bg-white text-white light:text-slate-900 shadow-sm border border-white/[0.08] light:border-black/[0.06]" 
                  : "text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
                }`}
              >
                <span>Live Preview</span>
              </button>
              <button
                onClick={() => setActivePaneTab("code")}
                className={`px-3 py-1 rounded-md transition-colors text-xs flex items-center gap-1.5 cursor-pointer ${
                  activePaneTab === "code" 
                  ? "bg-[#222836] light:bg-white text-white light:text-slate-900 shadow-sm border border-white/[0.08] light:border-black/[0.06]" 
                  : "text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900"
                }`}
              >
                <span>Code & Files</span>
                {allFilesList.length > 0 && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded-full font-mono">
                    {allFilesList.length}
                  </span>
                )}
              </button>
            </div>

            <div className="h-4 w-px bg-white/[0.08] light:border-black/[0.07] hidden sm:block" />

            {/* Device Switcher (when in preview tab) */}
            {activePaneTab === "preview" && (
              <div className="hidden md:flex items-center gap-1 bg-[#161922] light:bg-slate-100 p-0.5 rounded-lg border border-white/[0.06] light:border-black/[0.06] text-xs font-medium">
                <button
                  onClick={() => setDeviceMode("responsive")}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    deviceMode === "responsive" 
                    ? "bg-[#222836] light:bg-white text-white light:text-slate-900 shadow-sm" 
                    : "text-slate-400 hover:text-white light:hover:text-slate-900"
                  }`}
                >
                  Fluid
                </button>
                <button
                  onClick={() => setDeviceMode("tablet")}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    deviceMode === "tablet" 
                    ? "bg-[#222836] light:bg-white text-white light:text-slate-900 shadow-sm" 
                    : "text-slate-400 hover:text-white light:hover:text-slate-900"
                  }`}
                >
                  768px
                </button>
                <button
                  onClick={() => setDeviceMode("mobile")}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                    deviceMode === "mobile" 
                    ? "bg-[#222836] light:bg-white text-white light:text-slate-900 shadow-sm" 
                    : "text-slate-400 hover:text-white light:hover:text-slate-900"
                  }`}
                >
                  375px
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {activePaneTab === "code" && (
              <>
                <button
                  onClick={fetchSandboxFiles}
                  className="px-2.5 py-1 text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.06] light:hover:bg-black/[0.05] rounded-md transition-colors text-xs font-mono flex items-center gap-1 cursor-pointer"
                  title="Rescan sandbox disk"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 0.57-8.38l5.67-5.67" />
                  </svg>
                  <span>Sync</span>
                </button>

                <button
                  onClick={() => setIsTerminalOpen(prev => !prev)}
                  className={`px-2.5 py-1 rounded-md transition-colors text-xs font-mono flex items-center gap-1.5 cursor-pointer ${
                    isTerminalOpen 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                  }`}
                  title="Toggle integrated terminal (⌘`)"
                >
                  <span>&gt;_ Terminal</span>
                </button>
              </>
            )}

            {activePaneTab === "preview" && (
              <button
                onClick={refreshPreview}
                className="p-1.5 text-slate-400 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.06] light:hover:bg-black/[0.05] rounded-md transition-colors cursor-pointer"
                title="Refresh live preview"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 0.57-8.38l5.67-5.67" />
                </svg>
              </button>
            )}

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

        {/* Workspace Body: Preview OR VS Code Dual Studio (Code + Bottom Terminal) */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 bg-[#090a0e] light:bg-[#fbfbfa] overflow-hidden">
          {activePaneTab === "preview" ? (
            previewUrl ? (
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
              /* Progressive Sandbox Initialization Stages */
              <div className="flex flex-col items-center justify-center h-full max-w-sm text-slate-400 light:text-slate-600 p-6 text-center">
                <div className="w-9 h-9 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <h3 className="font-semibold text-white light:text-slate-900 text-sm mb-1">
                  Provisioning Sandbox Runtime
                </h3>
                <p className="text-xs text-slate-400 light:text-slate-500 mb-6">
                  Setting up isolated E2B microVM and Vite compiler...
                </p>

                {/* Progress Stages */}
                <div className="w-full space-y-2 text-left font-mono text-xs bg-[#0f1117] light:bg-white p-3.5 rounded-xl border border-white/[0.08] light:border-black/[0.08] shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <span>✓</span>
                    <span>Allocating MicroVM pod</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>Booting Vite & React 19 server</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>○</span>
                    <span>Mounting live iframe bridge</span>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* VS Code-style IDE Layout: File Tree + Code Editor + Retractable Terminal */
            <div className="w-full h-full flex rounded-xl overflow-hidden border border-white/[0.08] light:border-black/[0.08] bg-[#0c0d12] light:bg-white shadow-xl">
              {/* File Tree Sidebar */}
              <div className="w-56 bg-[#0f1117] light:bg-slate-50 border-r border-white/[0.08] light:border-black/[0.08] flex flex-col flex-shrink-0">
                <div className="p-3 border-b border-white/[0.08] light:border-black/[0.08] text-[10px] font-mono uppercase tracking-wider text-slate-400 light:text-slate-500 flex items-center justify-between">
                  <span>Workspace Files</span>
                  <span className="px-1.5 py-0.2 rounded bg-white/[0.06] light:bg-slate-200 text-slate-300 light:text-slate-700">
                    {allFilesList.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                  {allFilesList.map((filePath, idx) => (
                    <button
                      key={idx}
                      onClick={() => loadFileContent(filePath)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono truncate flex items-center gap-2 transition-colors cursor-pointer ${
                        selectedFile === filePath
                        ? "bg-blue-600 text-white font-medium shadow-sm"
                        : "text-slate-400 light:text-slate-600 hover:bg-white/[0.04] light:hover:bg-slate-100 hover:text-white"
                      }`}
                    >
                      <span className="text-[10px] opacity-70">
                        {filePath.endsWith(".jsx") || filePath.endsWith(".tsx") ? "⚛️" :
                         filePath.endsWith(".json") ? "📋" :
                         filePath.endsWith(".css") ? "🎨" : "📄"}
                      </span>
                      <span className="truncate">{filePath}</span>
                    </button>
                  ))}

                  {allFilesList.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Loading files...
                    </div>
                  )}
                </div>
              </div>

              {/* Right Work Area (Editor on Top + Collapsible Terminal on Bottom) */}
              <div className="flex-1 flex flex-col bg-[#090a0e] light:bg-slate-900 overflow-hidden relative">
                
                {/* Code Viewer (Top Flex Area) */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  {selectedFile ? (
                    <>
                      <div className="h-10 px-4 bg-[#11141a] light:bg-slate-950 border-b border-white/[0.08] flex items-center justify-between text-xs font-mono text-slate-300 flex-shrink-0">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-blue-400">⚡</span>
                          <span className="truncate font-semibold">{selectedFile}</span>
                          {isLoadingFile && <span className="text-slate-500 text-[10px] animate-pulse">(fetching...)</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(currentDisplayedContent, "viewer")}
                            className="px-2 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white rounded text-[10px] transition-colors cursor-pointer"
                          >
                            {copiedKey === "viewer" ? "✓ Copied" : "Copy Code"}
                          </button>
                        </div>
                      </div>
                      <pre className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-200 select-text bg-[#090a0e] light:bg-slate-900">
                        <code>{currentDisplayedContent}</code>
                      </pre>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-mono">
                      Select a file to inspect code
                    </div>
                  )}
                </div>

                {/* Retractable Terminal (Bottom Panel) */}
                {isTerminalOpen && (
                  <div 
                    style={{ height: `${terminalHeight}px` }} 
                    className="flex flex-col bg-[#0b0d13] border-t border-white/[0.1] relative z-20 flex-shrink-0 shadow-2xl"
                  >
                    {/* Draggable Terminal Resizer Handle */}
                    <div 
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsTerminalDragging(true);
                      }}
                      className="h-1.5 hover:h-2 bg-transparent hover:bg-blue-600/50 cursor-row-resize flex items-center justify-center transition-all group"
                      title="Drag to resize terminal"
                    >
                      <div className="w-8 h-0.5 rounded-full bg-slate-600 group-hover:bg-white transition-colors" />
                    </div>

                    {/* Terminal Header Bar */}
                    <div className="h-8 px-3 bg-[#0f1118] border-b border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Terminal</span>
                        <span className="text-[10px] text-slate-500">bash (/home/user/app)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTerminalLogs([])}
                          className="hover:text-white px-1.5 py-0.5 rounded hover:bg-white/[0.06] transition-colors text-[10px]"
                          title="Clear terminal output"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setIsTerminalOpen(false)}
                          className="hover:text-white p-1 rounded hover:bg-white/[0.06] transition-colors"
                          title="Minimize terminal"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Terminal Log Stream */}
                    <div 
                      ref={terminalScrollRef}
                      className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-200 space-y-1.5 select-text"
                    >
                      {terminalLogs.map(log => (
                        <div key={log.id} className="space-y-0.5">
                          {log.command && (
                            <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                              <span>user@sandbox:~/app$</span>
                              <span className="text-white">{log.command}</span>
                            </div>
                          )}
                          {log.stdout && (
                            <pre className="text-slate-300 whitespace-pre-wrap text-[11px] leading-relaxed">
                              {log.stdout}
                            </pre>
                          )}
                          {log.stderr && (
                            <pre className="text-rose-400 whitespace-pre-wrap text-[11px] leading-relaxed">
                              {log.stderr}
                            </pre>
                          )}
                        </div>
                      ))}
                      {isExecutingCmd && (
                        <div className="flex items-center gap-2 text-amber-400 text-[11px] animate-pulse">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span>Running command in sandbox...</span>
                        </div>
                      )}
                    </div>

                    {/* Terminal Input Prompt */}
                    <form 
                      onSubmit={handleExecuteTerminalCommand}
                      className="h-9 px-3 border-t border-white/[0.08] bg-[#090a0e] flex items-center gap-2 text-xs font-mono"
                    >
                      <span className="text-emerald-400 font-bold flex-shrink-0">user@sandbox:~/app$</span>
                      <input 
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        onKeyDown={handleTerminalKeyDown}
                        placeholder="Type bash command (e.g. ls -la, npm list, cat vite.config.js)..."
                        className="flex-1 bg-transparent text-white focus:outline-none placeholder-slate-600 text-xs"
                      />
                    </form>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

