"use client";

import { useEffect, useState, useRef } from "react";

const CLAUDE_THINKING_PHRASES = [
  "Reticulating splines...",
  "Synthesizing React component tree...",
  "Constructing state machines & hooks...",
  "Evaluating Tailwind utility AST...",
  "Compiling TypeScript definitions...",
  "Resolving ESModule dependency graph...",
  "Provisioning MicroVM sandbox bridge...",
  "Traversing AST sub-nodes...",
  "Refactoring responsive layout constraints...",
  "Injecting reactive event listeners...",
  "Harmonizing color tokens & contrast...",
  "Optimizing bundle chunks & assets...",
  "Verifying Vite hot-module reload...",
  "Calibrating polymorphic interfaces...",
  "Checking deterministic rendering passes...",
  "Assembling UI component primitives...",
  "Transpiling modern ECMAScript...",
  "Polishing micro-interactions & transitions...",
  "Reticulating quantum subroutines...",
  "Generating clean modular source code..."
];

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

interface ClaudeThinkingLoaderProps {
  startTime?: number;
  activeTool?: string;
  variant?: "chat" | "modal" | "inline";
}

export default function ClaudeThinkingLoader({
  startTime,
  activeTool,
  variant = "chat"
}: ClaudeThinkingLoaderProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const mountTimeRef = useRef(startTime || Date.now());

  // Update elapsed seconds
  useEffect(() => {
    const start = mountTimeRef.current;
    const timerInterval = setInterval(() => {
      setElapsed(Number(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(timerInterval);
  }, []);

  // Animate braille spinner frames
  useEffect(() => {
    const spinnerInterval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(spinnerInterval);
  }, []);

  // Cycle through Claude Code style thinking phrases
  useEffect(() => {
    const phraseInterval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setPhraseIndex(prev => (prev + 1) % CLAUDE_THINKING_PHRASES.length);
        setIsFlipping(false);
      }, 150);
    }, 1400);
    return () => clearInterval(phraseInterval);
  }, []);

  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-2 font-mono text-xs text-blue-400">
        <span className="font-bold text-blue-400">{SPINNER_FRAMES[frameIndex]}</span>
        <span className="transition-opacity duration-150">{CLAUDE_THINKING_PHRASES[phraseIndex]}</span>
        <span className="text-[10px] text-slate-500 font-mono">({elapsed}s)</span>
      </div>
    );
  }

  return (
    <div className="w-fit max-w-[94%] my-2 select-none animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-[#0f131d] light:bg-slate-50 p-3 shadow-lg shadow-blue-500/5">
        
        {/* Animated Background Shimmer Glow */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-blue-500/10 light:via-blue-500/5 to-transparent pointer-events-none" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 pb-2 mb-2 border-b border-white/[0.06] light:border-black/[0.06] font-mono text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold text-sm leading-none">
              {SPINNER_FRAMES[frameIndex]}
            </span>
            <span className="font-semibold text-slate-200 light:text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Agent Thinking</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeTool && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase font-bold tracking-wider">
                {activeTool}
              </span>
            )}
            <span className="text-slate-400 light:text-slate-500 text-[11px] font-mono bg-white/[0.04] light:bg-black/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] light:border-black/[0.06]">
              {elapsed.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Dynamic Cycling Verb Text (Claude Code Style) */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 light:text-slate-700 py-0.5">
          <span className="text-blue-400 select-none">✦</span>
          <span className={`transition-all duration-150 transform ${
            isFlipping ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"
          }`}>
            {CLAUDE_THINKING_PHRASES[phraseIndex]}
          </span>
        </div>

        {/* Subtle Bottom Progress Dots */}
        <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-white/[0.04] light:border-black/[0.04] text-[10px] text-slate-500 font-mono">
          <span>Synthesizing codebase</span>
          <span className="animate-pulse">...</span>
          <span className="ml-auto text-[9px] text-slate-600 light:text-slate-400">MicroVM Live</span>
        </div>

      </div>
    </div>
  );
}
