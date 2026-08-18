# ✦ Atelier — The Precision AI Software Studio

> **Synthesize, run, and iterate on full-stack React applications in dedicated cloud microVM sandboxes through natural dialogue.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg?style=flat-square)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?style=flat-square)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg?style=flat-square)](https://tailwindcss.com/)
[![E2B](https://img.shields.io/badge/E2B_Sandboxes-<1.2s_cold_start-emerald.svg?style=flat-square)](https://e2b.dev/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-ef4444.svg?style=flat-square)](https://turbo.build/)

---

## 📖 Table of Contents
- [Overview](#-overview)
- [Design Philosophy: Haute Horlogerie of Code](#-design-philosophy-haute-horlogerie-of-code)
  - [Dual-World Theming: Light & Dark](#dual-world-theming-light--dark)
- [System Architecture & Engineering Topology](#️-system-architecture--engineering-topology)
- [End-to-End Execution Sequence Flow](#-end-to-end-execution-sequence-flow)
- [Core Architectural Subsystems](#️-core-architectural-subsystems)
- [Database Entity-Relationship Model](#️-database-entity-relationship-model)
- [Cloud Sandboxing & MicroVM Architecture](#-cloud-sandboxing--microvm-architecture)
  - [1. Ephemeral MicroVM Isolation (E2B)](#1-ephemeral-microvm-isolation-e2b)
  - [2. Infinite Vite Supervisor Daemon](#2-infinite-vite-supervisor-daemon)
  - [3. Deterministic Path Resolution Engine](#3-deterministic-path-resolution-engine)
- [Studio Capabilities & UX Highlights](#-studio-capabilities--ux-highlights)
- [Monorepo Structure](#-monorepo-structure)
- [Agent Function Calling Tool Engine](#-agent-function-calling-tool-engine)
- [Getting Started & Local Development](#-getting-started--local-development)
- [Production Deployment](#-production-deployment)


---

## 🌟 Overview

**Atelier** is an end-to-end full-stack AI software workshop built with **Next.js 16**, **Express**, **TypeScript**, **DeepSeek/OpenRouter AI**, **Prisma**, and **E2B Cloud Sandboxes**.

When an engineer directs Atelier:
1. **MicroVM Provisioning:** Allocates an isolated Linux microVM in under 1.2 seconds.
2. **Autonomous Tool Loop:** An agent inspects files, runs bash commands, writes code, and refactors components.
3. **Instant Compilation:** Boots a live Vite 6 + React 19 development server with hot-module reload.
4. **Live Split-Pane Studio:** Streams AI reasoning alongside an interactive browser preview with viewport toggles.

---

## 🎨 Design Philosophy: Haute Horlogerie of Code

Atelier rejects generic, vibe-coded aesthetics in favor of understated luxury engineering. Inspired by Swiss typography, bespoke watchmaking instruments, and tactile industrial hardware (Dieter Rams, Teenage Engineering, Apple, Linear).

### Dual-World Theming: Light & Dark

| Attribute | Ivory Parchment (Light) | Obsidian Titanium (Dark) |
| :--- | :--- | :--- |
| **Canvas** | `#FBFBFA` (Museum-grade warm alabaster) | `#090A0E` (Deep cosmic carbon) |
| **Surfaces** | `#FFFFFF` (Milk white cards) | `#0F1117` & `#161922` (Recessed graphite) |
| **Dividers** | `rgba(0, 0, 0, 0.08)` hairline borders | `rgba(255, 255, 255, 0.08)` luminescent rules |
| **Typography** | `#111827` (Deep obsidian ink) | `#F8FAFC` (Crisp starlight) |
| **Accents** | `#1D4ED8` (Royal Prussian Blue) & `#B45309` (Warm Bronze) | `#3B82F6` (Electric Sapphire) & `#10B981` (Emerald) |

---

---

## 🏗️ System Architecture & Engineering Topology

Atelier is structured as a decoupled, multi-tier distributed system combining client-side rendering, asynchronous agent orchestration, isolated Linux microVM edge execution, and relational persistence.

```mermaid
graph TB
    subgraph Client["🖥️ Frontend Studio Layer (apps/web)"]
        UI["Next.js 16 App Router\n(React 19 + Tailwind v4)"]
        Split["Split-Pane Layout & Resize Handle"]
        Chat["Message Stream & Markdown Renderer"]
        Chrome["Simulated Browser Chrome\n(Viewport Switcher: 100% / 768px / 375px)"]
        ThemeEng["Bi-Modal Theme Engine\n(Ivory / Obsidian)"]
        Iframe["Live Preview Iframe\n(localhost:5173)"]
    end

    subgraph Orchestrator["⚙️ Backend Orchestration Layer (apps/orchestrator)"]
        Express["Express.js API Server\n(Port 3001)"]
        AuthRoute["Auth Handler\n(/api/auth/login, /signup)"]
        SessionRoute["Session Controller\n(/api/session, /api/sessions/:id)"]
        AgentLoop["Autonomous Agent Loop\n(Multi-Turn ReAct Pattern)"]
        ToolRouter["Tool Dispatcher Engine\n(write, read, edit, bash)"]
        PathResolver["Deterministic Path Resolver\n(resolveAppPath)"]
    end

    subgraph Intelligence["🧠 AI Reasoning Layer"]
        Model["DeepSeek Chat / OpenRouter AI\n(Structured Function Calling API)"]
        SoulPrompt["Atelier Soul Protocol\n(Engineering Ground Rules)"]
    end

    subgraph CloudSandbox["⚡ Edge MicroVM Sandbox Layer (E2B)"]
        VM["Dedicated Linux MicroVM (amd64)\n(< 1.2s cold start)"]
        Supervisor["Infinite Vite Supervisor Daemon\n(Auto-Restart Loop)"]
        ViteServer["Vite 6 Dev Server\n(Port 5173 + Hot Module Reload)"]
        AppFS["Application Filesystem\n(/home/user/app/src/...)"]
        EdgeProxy["E2B Edge Port Forwarding\n(Public Preview HTTPS URL)"]
    end

    subgraph Database["🗄️ Persistence Layer (packages/db)"]
        Prisma["Prisma ORM Client"]
        Postgres[("PostgreSQL Database\n(Users, Sessions, Messages)")]
    end

    %% Client to Backend
    UI -->|REST: Submit Prompt| SessionRoute
    UI -->|Heartbeat Poll: 3s| SessionRoute
    SessionRoute -->|CRUD Operations| Prisma
    AuthRoute -->|Verify Credentials| Prisma
    Prisma --> Postgres

    %% Backend to AI
    SessionRoute --> AgentLoop
    AgentLoop -->|History + Soul Prompt + Tools| Model
    Model -->|Tool Calls: write_file, edit_file, bash| ToolRouter

    %% Backend to Cloud Sandbox
    SessionRoute -->|1. Provision VM Pod| VM
    ToolRouter -->|2. Path Normalize| PathResolver
    PathResolver -->|3. File I/O & Shell Commands| AppFS
    VM -->|Launches on Port 5173| Supervisor
    Supervisor -->|Watches & Serves| ViteServer
    ViteServer -->|HMR on File Change| AppFS
    ViteServer -->|Exposes Port 5173| EdgeProxy

    %% Sandbox back to Client
    EdgeProxy -.->|Live HTTPS Stream| Iframe
```

---

## 🔄 End-to-End Execution Sequence Flow

The diagram below illustrates the exact lifecycle from when an engineer submits an application prompt to live Hot-Module Reloading (HMR) within the microVM container:

```mermaid
sequenceDiagram
    autonumber
    actor Engineer
    participant Web as Atelier Web Studio (Next.js 16)
    participant DB as PostgreSQL (Prisma ORM)
    participant Orch as Orchestrator API (Express)
    participant AI as DeepSeek AI / OpenRouter
    participant VM as E2B MicroVM Sandbox
    participant Vite as Vite 6 Dev Server

    Engineer->>Web: Submits Prompt ("Build an Analytics Dashboard")
    Web->>Orch: POST /api/session { initialPrompt, userId }
    Orch->>DB: INSERT Session & Initial User Message
    
    par MicroVM Provisioning
        Orch->>VM: Sandbox.create("base-template") [< 1.2s]
        VM-->>Orch: Returns sandboxId
        Orch->>DB: UPDATE Session SET sandboxId, podName
        Orch->>VM: Launch Vite Auto-Restart Daemon (nohup loop)
        Orch->>VM: Forward Port 5173 to Edge Gateway
        VM-->>Orch: Returns Public HTTPS Preview URL
        Orch-->>Web: Response { sessionId, previewUrl, podName }
        Web-->>Engineer: Render Split-Pane Studio & Simulated Browser
    end

    loop Autonomous Agent Execution Loop
        Orch->>AI: POST /v1/chat/completions (History + Soul Prompt + Tool Schemas)
        AI-->>Orch: Function Call: write_file { path: "src/App.tsx", content: "..." }
        Orch->>DB: INSERT Message (role: "assistant", toolCalls: [...])
        Orch->>Orch: resolveAppPath("src/App.tsx") -> "/home/user/app/src/App.tsx"
        Orch->>VM: Write File to Sandbox Filesystem
        VM->>Vite: Detect File Mutation & Trigger Instant HMR
        Vite-->>Web: Live Preview Iframe Updates Instantly
        Orch->>AI: Return Tool Execution Output ("File written successfully")
    end

    Web->>Orch: GET /api/sessions/:id/messages (3s interval)
    Orch-->>Web: Streams agent reasoning & tool execution logs
```

---

## 🏛️ Core Architectural Subsystems

### 1. Autonomous Agent Execution Loop (`apps/orchestrator/agent/loop.ts`)
* **Multi-Turn Context Management:** Reads all past conversational steps, tool calls, and execution outputs from PostgreSQL to maintain continuous memory across turns.
* **System Prompt Grounding (`soul.md`):** Injects strict UI/UX engineering principles, Lucide icon best practices, Tailwind CSS rules, and component modularity standards into the model's reasoning prompt.
* **Function Calling Protocol:** Intercepts structured tool calls (`write_file`, `read_file`, `edit_file`, `bash`), runs security validations, executes them inside the remote VM, and reports outputs back to the AI loop.

### 2. MicroVM Sandbox & Supervisor Engine (`apps/orchestrator/agent/e2b.ts`)
* **Fast MicroVM Cold Starts:** Provisions full Linux environments in `< 1.2s` using pre-warmed base template containers.
* **Infinite Vite Auto-Restart Supervisor:** Wraps the development server in an autonomous process loop (`while true; do npx vite; sleep 1; done`) to prevent server downtime during temporary invalid syntax states.
* **Deterministic Path Normalizer:** The `resolveAppPath` subsystem canonicalizes relative and root file paths to `/home/user/app/`, automatically cleaning up obsolete `.jsx`/`.js` conflicting files.

### 3. Reactive Web Studio Frontend (`apps/web`)
* **Split-Pane Workspace:** Smooth draggable divider dynamically adjusting between 320px and 900px width with client drag overlay protection.
* **Simulated Browser Chrome:** High-craft browser address bar with SSL badge, live viewport dimension metrics (`375×667`, `768×1024`, `100%`), and 1-click external window popping.
* **Multi-Tab Synchronized Theme Engine:** Persistent theme provider managing CSS variables across tabs with zero paint flash (anti-FOUC).

---

## 🗄️ Database Entity-Relationship Model

```mermaid
erDiagram
    User ||--o{ Session : "owns"
    Session ||--o{ Message : "contains"

    User {
        String id PK
        String email UK
        String name
        String password
        DateTime createdAt
        DateTime updatedAt
    }

    Session {
        String id PK
        String userId FK
        String podName
        String previewUrl
        String sandboxId
        DateTime createdAt
        DateTime updatedAt
    }

    Message {
        String id PK
        String sessionId FK
        String role
        String content
        Json toolCalls
        DateTime createdAt
    }
```


---

## ⚡ Cloud Sandboxing & MicroVM Architecture

### 1. Ephemeral MicroVM Isolation (E2B)
Every workspace executes inside a dedicated Linux container (`amd64`). Heavy tasks (Node.js compilation, package installations, and execution) are fully isolated from the backend API.

### 2. Infinite Vite Supervisor Daemon
During rapid agent iterations, temporary syntax errors can crash dev servers. Atelier maintains an infinite supervisor loop inside the VM:
```bash
nohup sh -c 'while true; do npx vite --host 0.0.0.0 --port 5173; sleep 1; done' > /home/user/vite.log 2>&1 &
```
If a file modification triggers an unexpected exit, the supervisor daemon automatically revives Vite in under 1 second without dropping port `5173`.

### 3. Deterministic Path Resolution Engine
AI models frequently emit inconsistent path formats (`./src/App.tsx`, `src/App.tsx`, `App.tsx`). Atelier normalizes all paths through `resolveAppPath`:
```typescript
function resolveAppPath(filePath: string): string {
  if (filePath.startsWith('/home/user/app')) return filePath;
  const cleanPath = filePath.replace(/^(\.\/|\/)/, '');
  return `/home/user/app/${cleanPath}`;
}
```

---

## 💎 Studio Capabilities & UX Highlights

* **Interactive Prompt Modifiers:** 1-click feature chips (`+ Dark & Light Mode`, `+ Mobile Responsive`, `+ Mock Data & Charts`, `+ Search & Filters`) that instantly configure instructions.
* **Simulated Browser Chrome:** Live preview header featuring an SSL padlock (`🔒 localhost:5173`), refresh trigger, and live resolution chips.
* **1-Click Viewport Mode Switcher:** Toggle dimensions between **Responsive (100%)**, **Tablet (768px)**, and **Mobile (375px)** with realistic device bezels.
* **Tool Call Inspector:** Expandable monospace terminal cards detailing `write_file`, `edit_file`, and `bash` commands with 1-click clipboard copying.
* **Quick Iteration Actions:** One-tap refinement pills (`+ Add dark mode support`, `+ Make responsive on mobile`, `+ Add realistic mock data`).
* **Real-time Project Search:** Instant workspace filtering across the collapsible sidebar.
* **Zero-FOUC Theme Provider:** Persistent theme synchronization across tabs without paint flash.

---

## 📁 Monorepo Structure

```
.
├── apps/
│   ├── web/                         # Next.js 16 App Router Studio Frontend
│   │   ├── app/
│   │   │   ├── page.tsx             # Studio Entrance & Auth Console
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx       # Collapsible Sidebar + Telemetry Bar + Theme Sync
│   │   │   │   ├── page.tsx         # Prompt Launchpad + Category Starter Templates
│   │   │   │   └── [sessionId]/     # Resizable Split-Pane Studio & Live Preview
│   │   │   ├── icon.svg             # Atelier ✦ Vector Favicon
│   │   │   └── globals.css          # Atelier Design Tokens & Engineering Grid Pattern
│   │   └── lib/
│   │       ├── theme.tsx            # Multi-Tab Synchronized Theme Engine
│   │       └── config.ts            # Dynamic Orchestrator URL Resolver
│   │
│   └── orchestrator/                # Express Engine & AI Agent Controller
│       ├── agent/
│       │   ├── e2b.ts               # E2B Sandbox Lifecycle & Port Forwarding
│       │   ├── loop.ts              # Agent Execution Loop & DeepSeek AI Client
│       │   ├── soul.md              # System Prompt Defining Agent Behavior
│       │   ├── toolsRef.ts          # Function Calling Tool Definitions
│       │   └── tools/               # Tool Handlers (write_file, edit_file, read_file, bash)
│       ├── base-template/           # React 19 + Vite + Tailwind CSS Starter Pod
│       └── index.ts                 # REST API Endpoints (/api/session, /api/auth, etc.)
│
└── packages/
    ├── db/                          # Prisma ORM & Database Engine
    │   └── prisma/
    │       └── schema.prisma        # PostgreSQL Schema (User, Session, Message)
    └── ui/                          # Shared UI Primitive Library
```

---

## 🛠️ Agent Function Calling Tool Engine

| Tool | Aliases | Purpose |
| :--- | :--- | :--- |
| `write_file` | `write` | Creates or overwrites a file in `/home/user/app/`. |
| `read_file` | `read` | Reads file contents inside the sandbox. |
| `edit_file` | `edit` | Performs precision string replacements (`old_string` ➔ `new_string`). |
| `bash` | `bash` | Executes shell commands (`npm install <pkg>`, directory checks). |

---

## 🚀 Getting Started & Local Development

### Prerequisites
* **Bun** (`curl -fsSL https://bun.sh/install | bash`)
* **Node.js** (v18+)
* **PostgreSQL Database** (Neon, Supabase, or local instance)
* **E2B API Key** ([e2b.dev](https://e2b.dev))
* **OpenRouter / OpenAI API Key**

### 1. Environment Setup
Configure `apps/orchestrator/.env`:
```env
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/atelier"
E2B_API_KEY="e2b_..."
OPENROUTER_API_KEY="sk-or-v1-..."
MODEL_NAME="deepseek/deepseek-chat"
```

### 2. Database Migration & Prisma Generation
```bash
bun --cwd packages/db prisma db push
bun prisma generate
```

### 3. Run Development Monorepo
```bash
bun run dev
```
* **Atelier Web Studio:** `http://localhost:3000`
* **Orchestrator Backend:** `http://localhost:3001`

---

## 📦 Production Deployment

### 1. Database
Push Prisma schemas to your production PostgreSQL provider:
```bash
bun --cwd packages/db prisma db push
```

### 2. Orchestrator Backend (`apps/orchestrator`)
Deploy to Railway, Render, Fly.io, or AWS:
* **Build Command:** `bun install && bun run build`
* **Start Command:** `bun --cwd apps/orchestrator run start`
* **Environment Variables:** `DATABASE_URL`, `E2B_API_KEY`, `OPENROUTER_API_KEY`, `PORT`

### 3. Web Studio Frontend (`apps/web`)
Deploy to Vercel or Cloudflare:
* **Framework:** Next.js App Router
* **Root Directory:** `apps/web`
* **Environment Variable:** `NEXT_PUBLIC_ORCHESTRATOR_URL=https://your-orchestrator.up.railway.app`

---

