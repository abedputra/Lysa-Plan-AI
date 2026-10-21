# AGENT.md — Agent System Specification for Lysa Plan

> **Target Audience**: AI Agents (Cursor Agent, Windsurf, Claude Code, Cline, Roo, AI Studio Build, and Autonomous Development Subagents) interacting with or extending the **Lysa Plan** codebase.

---

## 1. System Overview & Agent Context

**Lysa Plan** is an autonomous multi-model architecture, peer-review debate, codebase inspection, and technical consensus engine. Its purpose is to eliminate developer copy-paste fatigue by orchestrating inter-model debate between up to 5 models (e.g. DeepSeek, Claude, ChatGPT, Gemini 4 Argon, Systems Optimizer), verifying technical claims with reproducible code, preventing token exhaustion via a Plan Maturity Index, and producing verified architectural RFCs.

---

## 2. Architecture & File Structure

```
.
├── server.ts                       # Express full-stack entry point & API endpoints
├── index.html                      # Single Page Application HTML root
├── package.json                    # Dependencies & scripts ("dev": "tsx server.ts")
├── README.md                       # Human-facing system documentation
├── AGENT.md                        # This agent specification file
│
├── src/
│   ├── App.tsx                     # Top-level React state orchestrator & tab router
│   ├── main.tsx                    # React DOM client entry
│   ├── index.css                   # Tailwind CSS v4 styling & scrollbars
│   │
│   ├── types/
│   │   └── index.ts                # Canonical TypeScript interfaces (Session, Message, Dispute, Maturity, Terminal)
│   │
│   ├── services/
│   │   └── api.ts                  # Client fetch wrappers for /api/debate, /api/terminal, /api/mcp
│   │
│   ├── utils/
│   │   ├── defaultModels.ts        # The 5 default AI council models & specialized system prompts
│   │   ├── presets.ts              # Real-world architecture challenge presets
│   │   └── storage.ts              # LocalStorage persistence & pre-seeded demonstration session
│   │
│   └── components/
│       ├── Header.tsx              # Navigation bar, session dropdown, tab switcher
│       ├── ModelBar.tsx            # Council status bar (1-click toggles & 3/4/5 model presets)
│       ├── DebateChamber.tsx       # Live chat stream, thinking traces, 1-click terminal execution
│       ├── HumanSteeringBar.tsx    # Sticky developer directive input & auto-run controls
│       ├── PlanMaturityBanner.tsx  # Maturity index, token usage monitor, pause/decision threshold
│       ├── ProjectCodebaseInspector.tsx # Folder & file reader (HTML5 Webkit Directory)
│       ├── TerminalConsole.tsx     # Shell execution engine, script runner, and MCP Hub
│       ├── ConsensusSummaryView.tsx# RFC, validated code, test matrix, and markdown exporter
│       ├── DisputeTracker.tsx      # Formal claim verification & dispute resolution ledger
│       ├── ApiKeyModal.tsx         # Multi-provider API keys manager
│       ├── ModelConfigModal.tsx    # Custom model personas and system prompts editor
│       ├── NewDebateModal.tsx      # Session creator with preset selection
│       ├── PresetsModal.tsx        # Architecture templates library
│       └── MarkdownRenderer.tsx    # Marked-based markdown & code syntax display
```

---

## 3. Server Endpoints & Protocol Specifications

When an AI agent interacts with the server, use the following REST API contracts:

### `POST /api/debate/step`
Executes an AI turn in the debate.
* **Payload**:
  ```json
  {
    "session": { "id": "...", "title": "...", "goal": "...", "initialCodeOrSpec": "...", "projectFiles": [] },
    "model": { "id": "...", "name": "...", "role": "...", "provider": "deepseek|claude|chatgpt|gemini", "systemPrompt": "...", "useHighThinking": boolean },
    "history": [ ...messages ],
    "round": 1,
    "roundType": "draft_blueprint" | "peer_review" | "verification_counter" | "test_and_security" | "consensus_synthesis",
    "humanNote": "Optional developer constraint",
    "keys": { "gemini": "...", "deepseek": "...", "claude": "...", "openai": "..." },
    "currentMaturity": { "threshold": 85, "overallScore": 60 }
  }
  ```
* **Response**:
  ```json
  {
    "content": "Markdown text of AI review / blueprint",
    "thinkingTrace": "Optional high thinking trace",
    "citations": ["@Claude", "@DeepSeek"],
    "maturityMetrics": {
      "overallScore": 88,
      "architectureStability": 90,
      "securityHardening": 85,
      "testEdgeCaseCoverage": 88,
      "codeClarity": 90,
      "isThresholdReached": true,
      "estimatedTokensUsed": 2400,
      "estimatedCostSavings": "Saved ~40% tokens"
    }
  }
  ```

### `POST /api/debate/synthesize`
Generates the definitive technical consensus specification using **Gemini 4 Argon in High Thinking Mode (`ThinkingLevel.HIGH`)**.
* **Payload**: `{ "session": DebateSession, "keys": UserApiKeys }`
* **Response**:
  ```json
  {
    "summary": {
      "executiveSummary": "TL;DR of architecture...",
      "architectureRFC": "Complete RFC...",
      "validatedCode": "Production-ready clean code...",
      "testMatrix": "Test scenarios table...",
      "securityAudit": "Threat assessment...",
      "consensusScore": 98,
      "resolvedDisputesCount": 2,
      "synthesizerModel": "gemini-4-argon (ThinkingLevel.HIGH)"
    }
  }
  ```

### `POST /api/terminal/execute`
Executes a shell command within the workspace environment with process isolation and timeout guards.
* **Payload**: `{ "command": "npm test", "timeoutMs": 15000 }`
* **Response**:
  ```json
  {
    "command": "npm test",
    "stdout": "...",
    "stderr": "...",
    "exitCode": 0,
    "durationMs": 142,
    "success": true,
    "environment": "server"
  }
  ```

### `POST /api/terminal/run-script`
Sandboxes a TypeScript, JavaScript, or Python script to verify code proofs or concurrency claims.
* **Payload**: `{ "script": "console.log(1+1);", "language": "typescript" }`
* **Response**:
  ```json
  {
    "command": "npx tsx /tmp/verify-...ts",
    "stdout": "2\n",
    "stderr": "",
    "exitCode": 0,
    "durationMs": 85,
    "success": true
  }
  ```

### `GET /api/mcp/config`
Retrieves Model Context Protocol client configurations for Claude Desktop and Cursor.

---

## 4. Key Agent Operating Rules & Invariants

1. **High Thinking Directive**: When invoking Gemini models for complex architectural synthesis or dispute verification, the model `gemini-4-argon` MUST be configured with `thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }`, and `maxOutputTokens` MUST NOT be set.
2. **Token Guard Invariant**: Always honor the `maturityMetrics.isThresholdReached` flag. Do not run auto-run loops indefinitely. Pause and request developer confirmation once the maturity threshold (default 85%) is met.
3. **Hyper-Acute Scrutiny**: AI models must never output vague generic praise. They must inspect actual code lines (especially when `projectFiles` are present in the session context), identify race conditions, memory leaks, and furnish minimal reproducible proofs when refuting a claim.
4. **Human-in-the-Loop Supremacy**: Any directive sent by the human developer via `humanNote` overrides all model preferences.
5. **Concession & Pivot Protocol**: When an AI model is refuted with reproducible evidence, terminal results, or file citations, it MUST formally concede without continuing circular debate, and immediately pivot to unaddressed edge cases to save tokens and ensure rapid convergence.
6. **Agent-Ready Plan Export**: All synthesized plans MUST produce structured, explicit `- [ ] TODO (file: path)` items with strict non-negotiable invariants for downstream autonomous coding agents (Cursor, Claude Code, VS Code, Windsurf).
7. **Local & Offline Privacy Invariant**: Lysa Plan natively supports 100% offline local execution using Ollama (`http://localhost:11434/v1`), LM Studio, or vLLM. Codebase files read via the Codebase Inspector remain strictly in-memory and are never uploaded to any remote server or telemetry pipeline. Shell commands run directly in the local development environment.
