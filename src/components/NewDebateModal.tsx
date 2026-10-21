import React, { useState } from 'react';
import { Plus, X, Sparkles, Terminal } from 'lucide-react';
import { DebateSession } from '../types';
import { DEFAULT_MODELS } from '../utils/defaultModels';

interface NewDebateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSession: (session: DebateSession) => void;
}

export const NewDebateModal: React.FC<NewDebateModalProps> = ({
  isOpen,
  onClose,
  onCreateSession,
}) => {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [initialCode, setInitialCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !goal.trim()) return;

    const newSession: DebateSession = {
      id: `session-${Date.now()}`,
      title: title.trim(),
      goal: goal.trim(),
      initialCodeOrSpec: initialCode.trim() || undefined,
      models: DEFAULT_MODELS,
      messages: [],
      currentRound: 1,
      maxRounds: 5,
      status: 'idle',
      disputes: [],
      projectFiles: [],
      maturityMetrics: {
        overallScore: 0,
        architectureStability: 0,
        securityHardening: 0,
        testEdgeCaseCoverage: 0,
        codeClarity: 0,
        threshold: 85,
        isThresholdReached: false,
        estimatedTokensUsed: 0,
        estimatedCostSavings: 'Zero tokens consumed',
        recommendation: 'continue',
        maturityReason: 'New session initialized. The Lead Architect will propose the initial blueprint.',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onCreateSession(newSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-3.5 max-h-[85vh] flex flex-col text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm">
                Create New Architecture Plan
              </h3>
              <p className="text-[11px] text-zinc-400">
                Define your technical challenge, requirements, and constraints
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form id="new-debate-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
          <div>
            <label className="text-zinc-300 font-medium block mb-1">Plan Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Distributed Lock & Webhook Idempotency Pipeline"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-cyan-500 text-xs"
              required
            />
          </div>

          <div>
            <label className="text-zinc-300 font-medium block mb-1">
              Architecture Goal & Requirements:
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Describe requirements, performance targets (p99 latency), database consistency, or failure modes..."
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-cyan-500 text-xs leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="text-zinc-300 font-medium block mb-1 flex items-center justify-between">
              <span>Initial Draft / Code Snippet (Optional):</span>
              <span className="text-[10px] text-zinc-500">Models will analyze this first</span>
            </label>
            <textarea
              value={initialCode}
              onChange={(e) => setInitialCode(e.target.value)}
              placeholder="// Paste initial interface, SQL schema, or logic here..."
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white font-medium"
          >
            Cancel
          </button>
          <button
            form="new-debate-form"
            type="submit"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>Launch Chamber</span>
          </button>
        </div>
      </div>
    </div>
  );
};
