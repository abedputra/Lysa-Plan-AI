import React, { useState } from 'react';
import { 
  FileText, 
  Code, 
  CheckCircle, 
  ShieldAlert, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  History,
  ListTodo,
  Terminal,
  FileCheck2
} from 'lucide-react';
import { DebateSession } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ConsensusSummaryViewProps {
  session: DebateSession;
  onSynthesize: () => void;
  isSynthesizing: boolean;
}

export const ConsensusSummaryView: React.FC<ConsensusSummaryViewProps> = ({
  session,
  onSynthesize,
  isSynthesizing,
}) => {
  const [subTab, setSubTab] = useState<'todo' | 'rfc' | 'code' | 'tests' | 'security' | 'disputes'>('todo');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const summary = session.summary;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadPlanMd = () => {
    if (!summary) return;
    const planContent = `# IMPLEMENTATION PLAN: ${session.title}
> **Target Audience**: Autonomous AI Coding Agents (Cursor, Windsurf, Claude Code, VS Code Copilot) and Lead Developers.
> **Verified by**: Lysa Plan Multi-AI Council (${summary.synthesizerModel})
> **Consensus Score**: ${summary.consensusScore}% | Generated: ${new Date(summary.generatedAt).toLocaleString()}

---

## ⚠️ NON-NEGOTIABLE ARCHITECTURAL INVARIANTS (MANDATORY RULES FOR AGENT)
1. **Strict File Structure**: Adhere strictly to the designated file locations and module contracts.
2. **Failure Invariant**: Do NOT bypass failure handling, concurrency locks, or idempotency checks.
3. **Verification Prerequisite**: Every TODO item MUST be verified with test execution or terminal checks before proceeding.

---

## 🎯 EXECUTIVE ARCHITECTURE SUMMARY
${summary.executiveSummary}

---

## 📋 STEP-BY-STEP ACTIONABLE TODO CHECKLIST
${summary.actionableTodoPlan || `### Phase 1: Core Foundation & Types
- [ ] TODO (src/types/index.ts): Define data schemas, invariants, and interface contracts.
- [ ] TODO (src/core/engine.ts): Implement the primary system logic adhering to the verified blueprint.

### Phase 2: Implementation & Storage
- [ ] TODO (src/services/store.ts): Implement thread-safe storage or persistence layer.
- [ ] TODO (src/api/routes.ts): Wire clean API endpoints with input validation.

### Phase 3: Verification & Automated Tests
- [ ] TODO (tests/concurrency.test.ts): Implement test matrix assertions for race conditions.
- [ ] TODO (terminal): Run \`npm test\` and ensure 100% pass rate.`}

---

## 🏗️ SYSTEM DESIGN & ARCHITECTURE RFC
${summary.architectureRFC}

---

## 💻 PRODUCTION-READY VERIFIED CODE
${summary.validatedCode}

---

## 🧪 TEST & EDGE-CASE MATRIX
${summary.testMatrix}

---

## 🛡️ SECURITY & THREAT AUDIT
${summary.securityAudit}
`;

    const blob = new Blob([planContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plan.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyAgentPrompt = () => {
    if (!summary) return;
    const agentPrompt = `You are an elite software engineering agent tasked with executing this verified architectural plan.
STRICT ADHERENCE INSTRUCTIONS:
- You must obediently execute each task in the TODO checklist below step-by-step.
- Do NOT alter architectural boundaries or bypass safety invariants established during peer review.
- Run terminal verification commands after each step.

---
# PLAN OBJECTIVE: ${session.title}
${summary.executiveSummary}

## ACTIONABLE TODO CHECKLIST:
${summary.actionableTodoPlan || summary.testMatrix}

## ARCHITECTURE REFERENCE:
${summary.architectureRFC}

## VERIFIED CODE BLUEPRINT:
${summary.validatedCode}
`;
    handleCopy(agentPrompt, 'agent_prompt');
  };

  const handleDownloadCursorRules = () => {
    if (!summary) return;
    const cursorRules = `# Lysa Plan Directives for Cursor & Claude Code
# Project: ${session.title}

## Role & Goal
You are implementing the verified architecture for: ${session.goal}

## Architectural Invariants
${summary.executiveSummary}

## Component Rules & Module Contracts
${summary.architectureRFC}

## Verification Command
Always run tests before marking tasks completed.
`;
    const blob = new Blob([cursorRules], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `.cursorrules`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!summary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs">
        <Sparkles className="w-10 h-10 text-zinc-600 mb-3" />
        <h3 className="text-base font-semibold text-zinc-200 mb-1">Consensus Specification Not Yet Generated</h3>
        <p className="text-zinc-400 max-w-sm mx-auto mb-5 leading-relaxed">
          Run your multi-model debate in the Chamber. When discussions reach the maturity threshold, synthesize the full specification and agent-ready TODO plan.
        </p>
        <button
          onClick={onSynthesize}
          disabled={isSynthesizing || session.messages.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-40"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSynthesizing ? 'Synthesizing Consensus...' : 'Synthesize Consensus Specification'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* Top Summary Banner */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1 text-[11px] text-zinc-400">
                <span className="font-mono text-purple-400 font-semibold">{summary.synthesizerModel}</span>
                <span>·</span>
                <span>Synthesized {new Date(summary.generatedAt).toLocaleTimeString()}</span>
              </div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>Final Architecture Plan & Agent Directives</span>
              </h2>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {summary.executiveSummary}
              </p>
            </div>

            {/* Score & Primary Export Actions */}
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-850 border border-zinc-750 text-emerald-400 text-xs font-mono">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{summary.consensusScore}% Consensus</span>
              </div>

              {/* 1-Click Download plan.md */}
              <button
                onClick={handleDownloadPlanMd}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                title="Download agent-ready plan.md with detailed TODO checklist"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download plan.md</span>
              </button>

              {/* Copy prompt for Cursor / Claude Code */}
              <button
                onClick={handleCopyAgentPrompt}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-purple-950 hover:bg-purple-900 text-purple-300 text-xs border border-purple-800 transition cursor-pointer"
                title="Copy ready-to-paste prompt for Cursor or Claude Code agent"
              >
                {copiedKey === 'agent_prompt' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-purple-400" />
                )}
                <span>{copiedKey === 'agent_prompt' ? 'Copied' : 'Copy Agent Prompt'}</span>
              </button>

              {/* Download .cursorrules */}
              <button
                onClick={handleDownloadCursorRules}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs transition cursor-pointer"
                title="Download .cursorrules for project root"
              >
                <FileCheck2 className="w-3 h-3 text-cyan-400" />
                <span>.cursorrules</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-zinc-800 pb-1.5 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSubTab('todo')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer font-medium whitespace-nowrap ${
              subTab === 'todo'
                ? 'bg-zinc-800 text-emerald-300 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
            <span>Agent TODO Checklist</span>
          </button>

          <button
            onClick={() => setSubTab('rfc')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer font-medium whitespace-nowrap ${
              subTab === 'rfc'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Architecture RFC</span>
          </button>

          <button
            onClick={() => setSubTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer font-medium whitespace-nowrap ${
              subTab === 'code'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Validated Code</span>
          </button>

          <button
            onClick={() => setSubTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer font-medium whitespace-nowrap ${
              subTab === 'tests'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Matrix</span>
          </button>

          <button
            onClick={() => setSubTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer font-medium whitespace-nowrap ${
              subTab === 'security'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Security Audit</span>
          </button>

          <button
            onClick={() => setSubTab('disputes')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer font-medium whitespace-nowrap ${
              subTab === 'disputes'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-rose-400" />
            <span>Disputes & Proofs ({session.disputes.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 text-xs">
          
          {/* Actionable Agent TODO Plan */}
          {subTab === 'todo' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div>
                  <h3 className="font-semibold text-emerald-300 text-sm">
                    Actionable Agent Implementation Plan & TODO Checklist
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Give this checklist to your AI coding agent (Cursor, VS Code, Windsurf) to execute without deviating.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(summary.actionableTodoPlan || summary.testMatrix, 'todo_copy')}
                    className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer bg-zinc-800 px-2 py-1 rounded"
                  >
                    {copiedKey === 'todo_copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'todo_copy' ? 'Copied' : 'Copy TODOs'}</span>
                  </button>
                  <button
                    onClick={handleDownloadPlanMd}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download plan.md</span>
                  </button>
                </div>
              </div>
              <MarkdownRenderer content={summary.actionableTodoPlan || summary.testMatrix} />
            </div>
          )}

          {subTab === 'rfc' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-200">System Architecture & Component Contracts</h3>
                <button
                  onClick={() => handleCopy(summary.architectureRFC, 'rfc_copy')}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'rfc_copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'rfc_copy' ? 'Copied' : 'Copy RFC'}</span>
                </button>
              </div>
              <MarkdownRenderer content={summary.architectureRFC} />
            </div>
          )}

          {subTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-200">Production-Ready Implementation</h3>
                <button
                  onClick={() => handleCopy(summary.validatedCode, 'code_copy')}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'code_copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'code_copy' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <MarkdownRenderer content={summary.validatedCode} />
            </div>
          )}

          {subTab === 'tests' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-200">Verification & Test Scenarios</h3>
                <button
                  onClick={() => handleCopy(summary.testMatrix, 'test_copy')}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'test_copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'test_copy' ? 'Copied' : 'Copy Matrix'}</span>
                </button>
              </div>
              <MarkdownRenderer content={summary.testMatrix} />
            </div>
          )}

          {subTab === 'security' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-200">Threat Model & Invariant Audit</h3>
                <button
                  onClick={() => handleCopy(summary.securityAudit, 'sec_copy')}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'sec_copy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'sec_copy' ? 'Copied' : 'Copy Audit'}</span>
                </button>
              </div>
              <MarkdownRenderer content={summary.securityAudit} />
            </div>
          )}

          {subTab === 'disputes' && (
            <div className="space-y-3">
              <div className="pb-2 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-200">Resolved Technical Disputes</h3>
                <p className="text-[11px] text-zinc-400">Claims contested during peer review and verified with proof.</p>
              </div>

              {session.disputes.length === 0 ? (
                <p className="text-zinc-500 py-4 text-center">No disputes registered in this session.</p>
              ) : (
                <div className="space-y-2.5">
                  {session.disputes.map((dispute, idx) => (
                    <div key={dispute.id} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-200">#{idx + 1} - {dispute.topic}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">
                          Verified & Resolved
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-rose-400 font-medium block mb-0.5">Initial Claim:</span>
                          <p className="text-zinc-300">{dispute.claim}</p>
                        </div>
                        <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                          <span className="text-emerald-400 font-medium block mb-0.5">Rebuttal & Proof:</span>
                          <p className="text-zinc-300">{dispute.rebuttal}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
