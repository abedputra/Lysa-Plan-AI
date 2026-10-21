# Lysa Plan — Multi-AI Architecture & Consensus Chamber

> **Autonomous Multi-Model Peer-Review, Dynamic Model Support, Live Codebase Inspection, Real Terminal Verification & Agent-Ready Plan Export**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

---

## 🌟 1. Background & Problem Statement

As software developers, constructing a rock-solid architectural plan before writing production code is the single most critical factor in project success. 

Before **Lysa Plan**, developers commonly adopted an ad-hoc, multi-tab workflow:
1. Prompt **DeepSeek** to generate an initial system design or architectural blueprint.
2. Manually **copy-paste** that plan into **Claude** for ruthless code review, edge-case analysis, and anti-pattern detection.
3. Copy-paste the resulting discussion into **ChatGPT** to formulate test matrices, chaos scenarios, and concurrency proofs.
4. Bring the refined plan to additional models or custom open-source models for threat modeling, security invariant verification, and memory safety checks.
5. Inevitably, one model would refute another model's assumptions with concrete technical proof—and upon re-verification, the rebuttal was proven right!

### 💥 Core Inefficiencies of the Manual Approach:
* **Copy-Paste Fatigue**: Shuttling large code blocks between multiple browser tabs causes context loss, friction, and developer burnout.
* **Premature Execution**: Developers often begin coding before the architecture has been thoroughly stress-tested against failure modes.
* **Token & Cost Explosion (Circular Arguing)**: Without a strict concession protocol, AI models will debate micro-optimizations or disproven assumptions indefinitely, burning through token quotas and driving up API bills.
* **Unverified Theoretical Debates**: Models debate hypothetically in chat windows without ever executing or verifying the test scripts in an actual environment.
* **Disconnected Downstream Execution**: When the plan is finally ready, AI coding agents (such as Cursor, VS Code, or Windsurf) lack clear, enforceable `TODO` checklists and non-negotiable invariants, causing them to deviate from the agreed architecture.

### 💡 The Solution: Lysa Plan
**Lysa Plan** unifies this entire peer-review and consensus loop into a single, high-efficiency developer dashboard. It orchestrates round-robin debate among your chosen AI models, inspects real local codebase files, enforces a **Concession & Pivot Protocol** to eliminate token waste, executes test scripts in a live terminal sandbox, and synthesizes finalized **Agent-Ready `plan.md` specifications** with explicit `- [ ] TODO` checklists.

---

## 🔒 2. Privacy-First & 100% Local Execution (Zero-Cloud Option)

Many developers and enterprise teams work on proprietary codebases where **strict privacy and data confidentiality** are non-negotiable. 

**Lysa Plan was designed from the ground up to run completely locally on your own machine.**

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR LOCAL MACHINE                     │
│                                                             │
│   ┌────────────────┐      HTTP/IPC     ┌────────────────┐   │
│   │   Lysa Plan    │ ◄───────────────► │ Local Terminal │   │
│   │   Dashboard    │                   │ (Shell/Runner) │   │
│   │ (localhost:3000)                   └────────────────┘   │
│   └────────┬───────┘                                        │
│            │ In-Memory                                      │
│            ▼ Context                                        │
│   ┌────────────────┐      OpenAI-API   ┌────────────────┐   │
│   │ Local Codebase │ ◄───────────────► │  Local Ollama  │   │
│   │ (Folder Reader)│                   │ or LM Studio   │   │
│   └────────────────┘                   └────────────────┘   │
│                                                             │
│         ZERO TELEMETRY • ZERO LOGGING • ZERO PHONE-HOME     │
└─────────────────────────────────────────────────────────────┘
```

### 🛡️ Local Privacy Guarantees:
1. **Zero External API Calls**: When configured with a local model runner (like **Ollama** or **LM Studio**), all prompt completions, debate arguments, and consensus summaries run 100% on your local GPU/CPU. No data ever leaves your computer.
2. **Local Codebase In-Memory Inspection**: When you select your local project folder in the Codebase Inspector, files are loaded directly into browser memory via the browser File System Access API. They are never transmitted to any third-party cloud database or server.
3. **Local Shell & Script Verification**: Terminal verification commands (`npm test`, `pytest`, `cargo test`) execute directly inside the local shell session on your computer where `lysa-plan` was started.
4. **Local Browser Storage**: All session logs, active debate transcripts, and custom model settings are stored in your browser's private `localStorage`. There is no remote tracker or analytics script.

---

## 🚀 3. How to Run Locally with Ollama (Step-by-Step Guide)

You can run Lysa Plan completely offline with open-source coding and reasoning models (such as `qwen2.5-coder:32b`, `deepseek-r1`, `llama3.3`, or `codellama`).

### Step 1: Install & Start Ollama
If you haven't installed Ollama yet, install it from [ollama.com](https://ollama.com/):
```bash
# macOS / Linux:
curl -fsSL https://ollama.com/install.sh | sh

# Pull your preferred coding or reasoning models:
ollama pull qwen2.5-coder:32b
ollama pull deepseek-r1:14b
ollama pull llama3.3

# Ensure Ollama server is running (default port 11434):
ollama serve
```

### Step 2: Clone & Start Lysa Plan Locally
```bash
# 1. Clone repository
git clone https://github.com/your-username/lysa-plan.git
cd lysa-plan

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment variables
cp .env.example .env

# 4. Start the local server
npm run dev
```

Lysa Plan will be live at:
```
http://localhost:3000
```

### Step 3: Connect Local Models in Lysa Plan
1. In the Lysa Plan UI, click the **"Keys"** button in the top navigation bar.
2. Under **"Custom OpenAI-Compatible Endpoint (Ollama / vLLM / Local)"**:
   * Set **Base URL**: `http://localhost:11434/v1`
   * Leave API Key blank (or type `ollama`).
3. Click **"Save Keys"**.
4. Now, open the model settings or Council bar:
   * Select or add your model name (e.g., `qwen2.5-coder:32b` or `deepseek-r1:14b`).
   * The local model immediately becomes active in the Council chamber!
5. Start your architecture debate—everything runs offline with total confidentiality!

---

## 🎯 4. Core Features

### 🤖 1. Dynamic Models & Custom API Keys (No Gemini by Default)
Lysa Plan gives developers full freedom to configure any model in the world:
* **DeepSeek Reasoner** (`deepseek-reasoner` via DeepSeek API)
* **Anthropic Claude 3.7 Sonnet** (`claude-3-7-sonnet-20250219` via Anthropic API)
* **OpenAI ChatGPT** (`gpt-4o` via OpenAI API)
* **OpenRouter** (Connect 200+ models including `qwen/qwen-2.5-coder-32b`, `meta-llama/llama-3.3-70b`, `mistralai/mistral-large`)
* **Groq** (Ultra-fast inference for open models)
* **Custom OpenAI-Compatible Endpoints** (Local Ollama at `http://localhost:11434/v1`, vLLM, LM Studio, or Together AI)
* **Optional Gemini** (Can be activated if configured)

> **Active Key Visibility Rule**: To keep your workspace completely clean, **only models with an active, configured API key appear in the council bar**. Inactive models without keys are hidden from the UI.

---

### 🤝 2. Concession & Pivot Protocol (Token Saving & Rapid Convergence)
One of the greatest causes of token waste in multi-agent systems is circular debate—where models endlessly argue over opinions. Lysa Plan enforces a strict **Concession Mandate**:
1. When Model B presents concrete proof (code reproduction, terminal output, file citation, or formal logic) refuting Model A's assumption:
2. **Model A MUST formally concede** (*"I concede to @ModelB on this point based on the reproduction snippet..."*).
3. Model A is strictly forbidden from continuing circular arguments.
4. Model A must **immediately pivot** to discovering new unaddressed edge cases or formulating the patch, which peer models then inspect.
5. This leads to rapid convergence, prevents repetitive token consumption, and saves significant API costs.

---

### 📝 3. Agent-Ready `plan.md` Export (Cursor, VS Code, Windsurf, Claude Code)
Once consensus is reached, Lysa Plan synthesizes an actionable implementation package:
* **`plan.md`**: Contains non-negotiable architectural invariants, data contracts, and an explicit checklist formatted with:
  ```markdown
  - [ ] TODO (file: src/services/auth.ts): Implement idempotent token verification with TTL.
  - [ ] TODO (file: tests/concurrency.test.ts): Verify atomic lock release with automated test script.
  ```
* **1-Click Copy Agent Prompt**: Pre-formatted prompt instructing your IDE agent (Cursor / Windsurf / Claude Code) to follow the plan strictly without deviating.
* **1-Click `.cursorrules` / `CLAUDE.md` Export**: Drop the directives directly into your project root.

---

### 📊 4. Plan Maturity Index & Token Cost Guard
To prevent infinite debate loops, Lysa Plan continuously scores the plan across four dimensions:
1. **Architecture Stability (30%)**
2. **Security Hardening (25%)**
3. **Test & Edge-Case Coverage (25%)**
4. **Code Implementation Clarity (20%)**

When the maturity score crosses the user threshold (default **85%**), auto-debate pauses and presents the decision:
* **Synthesize Consensus**: Immediately produces the final RFC, validated code, and agent `plan.md`.
* **+1 Round**: Add an extra turn if you want further verification on a specific concern.

---

### 📁 5. Local Codebase Context Inspector
Lysa Plan reads real source code from your local computer:
* **Directory Picker**: Upload your project folder structure (`.ts`, `.tsx`, `.js`, `.py`, `.sql`, `.json`, etc.) without uploading `node_modules` or `.git`.
* **Direct File Citations**: Models inspect actual files from your disk and cite exact line numbers.

---

### 💻 6. Real Terminal Sandbox & MCP Support
Lysa Plan tests code proofs in a real runtime environment:
* **Interactive Terminal**: Run shell commands directly (`npm test`, `npm run lint`, `git status`).
* **1-Click "Run in Terminal"**: Any test script or proof generated during debate can be sent to the terminal with a single click.
* **Sandboxed Script Runner**: Execute TypeScript (`tsx`), JavaScript (`node`), or Python (`python3`) test scripts safely with timeout protection.
* **Model Context Protocol (MCP)**: Native configuration endpoints for **Claude Desktop** and **Cursor / Windsurf**.

---

## ⚖️ 5. Open Source License

Lysa Plan is licensed under the **[MIT License](LICENSE)**.

### Why the MIT License is Best for This Project:
* **Maximum Permissiveness**: Anyone can use, clone, deploy, modify, and distribute Lysa Plan without restrictive barriers.
* **Developer & Community Friendly**: Standard for modern developer tools (used by React, Vite, Next.js, Babel, Tailwind CSS).
* **IDE & Agent Integration**: Allows developers and companies to freely bundle or integrate Lysa Plan with their custom IDE workflows (Cursor, VS Code, Windsurf) without legal friction.

*(If your organization requires explicit patent grants, Apache 2.0 is also a compatible alternative).*

---

## 🛠️ 6. Technical Architecture

```
Lysa Plan Architecture
├── Frontend (React 19 + TypeScript + Vite + Tailwind CSS v4)
│   ├── DebateChamber (Chat Viewport, Thinking Traces, 1-Click Code Run)
│   ├── ModelBar (Only Active Models Displayed, Dynamic Slots)
│   ├── HumanSteeringBar (Developer Directives, Auto-Debate Controls)
│   ├── PlanMaturityBanner (Maturity Progress, Token Guard & Decisions)
│   ├── ProjectCodebaseInspector (Local Directory & File Context Reader)
│   ├── TerminalConsole (Real Shell Execution, Script Runner & MCP Hub)
│   ├── ConsensusSummaryView (plan.md Export, .cursorrules, Validated Code, RFC)
│   └── DisputeTracker (Contested Claims, Evidence & High Thinking Verifier)
│
└── Backend Server (Node.js + Express + Vite Middleware)
    ├── /api/debate/step (Dynamic Providers: DeepSeek, Claude, OpenAI, OpenRouter, Groq, Ollama)
    ├── /api/debate/synthesize (Definitive RFC & Agent TODO Plan Synthesis)
    ├── /api/debate/verify-claim (Formal Logic Verification Engine)
    ├── /api/terminal/execute (Isolated Shell Execution with Process Timeout)
    ├── /api/terminal/run-script (TypeScript, Node & Python Sandbox Runner)
    └── /api/mcp/config (MCP Server Manifest for Claude Desktop & Cursor)
```

---

## 📄 7. License
MIT License. Built for software engineers who value architectural precision before execution.
