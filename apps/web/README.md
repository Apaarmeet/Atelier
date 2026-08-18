# ✦ Atelier Web Studio Frontend

The precision user interface for **Atelier**, built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4**.

---

## 💎 Features
- **Haute Horlogerie Design Language:** Bi-modal theme engine (Ivory Parchment Light Mode & Obsidian Titanium Dark Mode) with zero paint flash.
- **Split-Pane Live Studio:** Draggable layout container with simulated browser chrome (`🔒 localhost:5173`), live reload, and viewport mode toggling (Responsive, Tablet 768px, Mobile 375px).
- **Interactive Prompt Composer:** Prompt modifiers (`+ Dark & Light Mode`, `+ Mobile Responsive`, `+ Mock Data`), category filters, and keyboard shortcut actions (`↵ Enter`, `⌘N`).
- **Tool Call Execution Inspector:** Monospace live badges for file operations and shell commands with 1-click clipboard copy.

---

## 🛠️ Development

```bash
# Run the Next.js development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Build & Type Check

```bash
# Type check TypeScript
bun run check-types

# Production build
bun run build
```

