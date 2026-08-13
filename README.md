# ⚡ Lovable AI — Fullstack Web Application Builder & Cloud Sandbox Engine

> **Turn plain language descriptions into fully working, interactive React applications running live in isolated cloud sandbox microVMs.**

---

## 📖 Table of Contents
- [Overview](#-overview)
- [System Architecture & Request Flow](#-system-architecture--request-flow)
- [Cloud Sandboxing & MicroVM Architecture](#-cloud-sandboxing--microvm-architecture)
  - [E2B MicroVM Isolation](#1-e2b-microvm-isolation)
  - [Persistent Vite Auto-Restart Daemon](#2-persistent-vite-auto-restart-daemon)
  - [App Path Resolution Engine](#3-app-path-resolution-engine)
- [Monorepo Architecture](#-monorepo-architecture)
- [AI Tool Execution Engine](#-ai-tool-execution-engine)
- [Pinterest-Inspired Design & UI Features](#-pinterest-inspired-design--ui-features)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Production Deployment Guide](#-production-deployment-guide)

---

## 🌟 Overview

**Lovable AI** is an end-to-end fullstack AI software engineer platform built with **Next.js 16**, **Express**, **TypeScript**, **DeepSeek/OpenRouter AI**, **Prisma**, and **E2B Cloud Sandboxes**. 

When a user prompts *"Build a modern todo app with dark mode"*, Lovable:
1. Provisions a dedicated Linux MicroVM sandbox in the cloud.
2. Invokes an autonomous AI agent loop equipped with sandbox tools.
3. Generates complete React, Vite, Tailwind CSS, and Lucide Icon code.
4. Exposes an interactive, real-time live preview URL directly inside the browser.

---

## 🏗️ System Architecture & Request Flow

Below is the complete end-to-end architecture flow from user input to live container preview:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js Web App
    participant DB as PostgreSQL DB
    participant Orch as Orchestrator API
    participant AI as DeepSeek AI
    participant E2B as E2B MicroVM Sandbox
    participant Vite as Vite Dev Server

    User->>Web: Submits Prompt ("Build a Todo App")
    Web->>Orch: POST /api/session
    Orch->>DB: Create Session & Persist Message
    Orch->>E2B: Provision Sandbox MicroVM
    E2B-->>Orch: Returns sandboxId
    Orch->>DB: Save sandboxId to Session Record
    Orch->>E2B: Launch Persistent Vite Supervisor Daemon
    Orch->>E2B: Forward Port 5173 to Preview URL
    Orch-->>Web: Return previewUrl and podName
    Web-->>User: Render Split Pane and Live Iframe Preview

    par Background AI Agent Loop
        Orch->>AI: Send Chat History + System Prompt + Tools
        AI-->>Orch: Request Tool Call: write_file
        Orch->>Orch: resolveAppPath to /home/user/app
        Orch->>E2B: Write file to /home/user/app/src/App.tsx
        E2B->>Vite: HMR Triggered
        Vite-->>User: Live Preview Updates Instantly
    end
```

---

## ⚡ Cloud Sandboxing & MicroVM Architecture

### 1. E2B MicroVM Isolation
Every project runs inside a dedicated **E2B Cloud Sandbox**: a secure, ephemeral Linux MicroVM (`amd64`). 
- Offloads all heavy compilation, Node.js execution, and `npm install` tasks from your backend servers to distributed edge microVMs.
- Supports persistent execution across multi-step conversations.

### 2. Persistent Vite Auto-Restart Daemon
During rapid AI code modifications, broken syntax or temporary unresolved imports can crash single-instance dev servers. Lovable solves this by running an infinite supervisor daemon loop inside the container:

```bash
nohup sh -c 'while true; do npx vite --host 0.0.0.0 --port 5173; sleep 1; done' > /home/user/vite.log 2>&1 &
```

- **Zero Connection Drops**: If a file edit breaks Vite for a second, the supervisor daemon automatically restarts Vite 1 second later. As soon as the AI agent completes the code edit, Vite hot-reloads instantly without dropping port `5173`.

### 3. App Path Resolution Engine
AI models often generate relative or varied file paths (e.g., `./src/App.tsx`, `src/App.tsx`, or `App.tsx`). The orchestrator incorporates a path resolution engine (`resolveAppPath`) in [`apps/orchestrator/agent/e2b.ts`](file:///Users/apaarmeetsingh/Developer/lovable/apps/orchestrator/agent/e2b.ts):

```typescript
function resolveAppPath(filePath: string): string {
  if (filePath.startsWith('/home/user/app')) return filePath;
  const cleanPath = filePath.replace(/^(\.\/|\/)/, '');
  return `/home/user/app/${cleanPath}`;
}
```

- Guarantees every `read_file`, `write_file`, `edit_file`, and `bash` command resolves directly inside Vite's root directory `/home/user/app/`.
- If an agent writes `/home/user/app/src/App.tsx`, old template files (like `App.jsx`) are automatically cleaned up to eliminate Vite resolution ambiguity.

---

## 📁 Monorepo Architecture

This monorepo is managed with **Turborepo** and **Bun**:

```
.
├── apps/
│   ├── web/                         # Next.js 16 App Router Frontend
│   │   ├── app/
│   │   │   ├── page.tsx             # Pinterest Glass Auth Page (Sign In / Sign Up)
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx       # Collapsible Glass Sidebar + User Profile + Theme Toggle
│   │   │   │   ├── page.tsx         # Main Prompt Studio + Inspiration Preset Chips
│   │   │   │   └── [sessionId]/     # Workspace with Resizable Split Pane & Live Preview
│   │   │   └── globals.css          # Pinterest Animations & Light/Dark Theme Overrides
│   │   └── middleware.ts            # Route Protection Middleware
│   │
│   └── orchestrator/                # Express API & AI Agent Controller
│       ├── agent/
│       │   ├── e2b.ts               # E2B Sandbox lifecycle, port forwarding, resolveAppPath
│       │   ├── loop.ts              # Agent execution loop, OpenAI/OpenRouter client
│       │   ├── soul.md              # System prompt defining AI agent behavior & ground rules
│       │   ├── toolsRef.ts          # Function calling tool schema definitions
│       │   └── tools/               # Implementations for read_file, write_file, edit_file, bash
│       ├── base-template/           # React 18 + Vite + Tailwind CSS base starter template
│       └── index.ts                 # Express REST endpoints (/api/session, /api/auth, etc.)
│
└── packages/
    └── db/                          # Prisma ORM & Database Layer
        └── prisma/
            └── schema.prisma        # PostgreSQL Schema (User, Session, Message models)
```

---

## 🛠️ AI Tool Execution Engine

The autonomous agent interacts with the sandbox exclusively through registered function calls:

| Tool Name | Aliases | Description |
| :--- | :--- | :--- |
| `write_file` | `write` | Creates or completely overwrites a target file in `/home/user/app/`. |
| `read_file` | `read` | Reads full content of any file inside the sandbox. |
| `edit_file` | `edit` | Performs exact string replacements (`old_string` ➔ `new_string`). |
| `bash` | `bash` | Executes terminal commands (`npm install <pkg>`, `ls`, `grep`). Prevents duplicate long-running dev servers. |

---

## 🎨 Pinterest-Inspired Design & UI Features

- **Pinterest Staggered Moodboard Grid**: Background visual grid featuring animated floating app cards (`animate-float-slow` & `animate-float-reverse`).
- **Glassmorphism & Radial Glows**: Deep dark glass surfaces with border strokes (`border-white/10`) and glowing backdrops.
- **Collapsible Session Sidebar**: Expandable/collapsible sidebar with smooth 300ms CSS transitions, project counts, and 1-click project deletion.
- **Draggable & Resizable Split Pane**: Drag handle allowing users to resize the chat vs. preview panes dynamically from `300px` to `850px`.
- **1-Click Responsive Viewports**: Toggle live preview dimensions between **Responsive (100%)**, **Tablet (768px)**, and **Mobile (375px)**.
- **Pop Out New Tab**: 1-click button (`Pop Out ↗`) to view the live container app in a dedicated full browser tab.
- **Light & Dark Theme Engine**: Instant theme switcher (🌙 / ☀️) with persistent `localStorage` preference and full CSS variable overrides.
- **Dual-Layer Route Protection**: Protected `/dashboard` routes enforced by client-side layout guards and Next.js middleware.

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js** (v18+) & **Bun** (`npm i -g bun`)
- **Docker Desktop** (if building custom base template containers)
- **PostgreSQL Database** (local or cloud instance like Neon/Supabase)
- **E2B API Key** ([e2b.dev](https://e2b.dev)) & **OpenRouter / OpenAI API Key**

### 1. Environment Setup
Create an `.env` file inside `apps/orchestrator/.env`:

```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/lovable"
E2B_API_KEY="e2b_..."
OPENROUTER_API_KEY="sk-or-v1-..."
MODEL_NAME="deepseek/deepseek-chat"
```

### 2. Database Migration & Code Generation
```bash
# Push Prisma schema to PostgreSQL & generate client
bun --cwd packages/db prisma db push
bun prisma generate
```

### 3. Run Development Monorepo
```bash
bun run dev
```
- **Web App**: `http://localhost:3000`
- **Orchestrator Backend**: `http://localhost:3001`

---

## 📦 Production Deployment Guide

### 1. Database
Push your Prisma schema to your cloud PostgreSQL instance (Neon / Supabase / AWS RDS):
```bash
bun --cwd packages/db prisma db push
```

### 2. Orchestrator Backend (`apps/orchestrator`)
Deploy to **Railway**, **Render**, **Fly.io**, or **AWS ECS**:
- **Build Command**: `bun install && bun run build`
- **Start Command**: `bun --cwd apps/orchestrator run start`
- **Environment Variables**: Set `DATABASE_URL`, `E2B_API_KEY`, `OPENROUTER_API_KEY`, `PORT`.

### 3. Frontend Web App (`apps/web`)
Deploy to **Vercel** or **Cloudflare Pages**:
- **Framework**: Next.js App Router
- **Root Directory**: `apps/web`
- **Environment Variable**: `NEXT_PUBLIC_ORCHESTRATOR_URL=https://your-orchestrator-backend.up.railway.app`

---

## 📜 License
MIT License. Built for high-scale, production-ready AI application creation.
