import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Flame, 
  Sparkles, 
  Plus, 
  Check, 
  X, 
  Scale 
} from 'lucide-react';
import { DisputeItem, DebateSession } from '../types';

interface DisputeTrackerProps {
  session: DebateSession;
  onVerifyWithGeminiArgon: (claim: string, evidence: string, context?: string) => void;
  onUpdateDisputeStatus: (disputeId: string, status: DisputeItem['status'], resolution?: string) => void;
  onAddDispute: (dispute: Omit<DisputeItem, 'id'>) => void;
  isVerifying: boolean;
  activeVerificationResult?: { verdict: string; timestamp: number } | null;
}

export const DisputeTracker: React.FC<DisputeTrackerProps> = ({
  session,
  onVerifyWithGeminiArgon,
  onUpdateDisputeStatus,
  onAddDispute,
  isVerifying,
  activeVerificationResult,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newClaim, setNewClaim] = useState('');
  const [newRebuttal, setNewRebuttal] = useState('');
  const [newEvidence, setNewEvidence] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);

  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newClaim.trim()) return;

    onAddDispute({
      topic: newTopic.trim(),
      proposerModelId: 'deepseek-architect',
      challengerModelId: 'claude-critic',
      claim: newClaim.trim(),
      rebuttal: newRebuttal.trim(),
      evidence: newEvidence.trim(),
      status: 'contested',
    });

    setNewTopic('');
    setNewClaim('');
    setNewRebuttal('');
    setNewEvidence('');
    setShowAddModal(false);
  };

  const handleRunFormalVerification = (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    onVerifyWithGeminiArgon(dispute.claim, dispute.rebuttal + '\n' + dispute.evidence, session.goal);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-4 text-xs">
        
        {/* Header */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h2 className="font-semibold text-zinc-100 text-sm">
                Dispute Ledger & Evidence Verifier
              </h2>
            </div>
            <p className="text-[11px] text-zinc-400">
              When models refute flawed assumptions with proof, track and audit resolutions here.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Dispute</span>
          </button>
        </div>

        {/* Verification Result Card */}
        {activeVerificationResult && selectedDispute && (
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Formal Logic Verification (Gemini 4 Argon High Thinking)
              </span>
              <span className="text-zinc-500 font-mono">
                {new Date(activeVerificationResult.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="text-[11px] text-zinc-200 bg-zinc-950/80 p-3 rounded-lg border border-purple-900/40 whitespace-pre-wrap font-mono leading-relaxed">
              {activeVerificationResult.verdict}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  onUpdateDisputeStatus(
                    selectedDispute.id,
                    'resolved_challenger',
                    'Verified true by Gemini 4 Argon: Rebuttal accepted and architecture amended.'
                  );
                  setSelectedDispute(null);
                }}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Mark as Resolved</span>
              </button>
            </div>
          </div>
        )}

        {/* Disputes List */}
        {session.disputes.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-950">
            <Scale className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-zinc-300 mb-0.5">No Contested Disputes</h3>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
              Any technical dispute or counter-proof generated during debate will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {session.disputes.map((dispute, index) => {
              const isResolved = dispute.status.startsWith('resolved');

              return (
                <div
                  key={dispute.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    isResolved
                      ? 'bg-zinc-900/60 border-zinc-800'
                      : 'bg-zinc-900/80 border-amber-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="font-semibold text-zinc-200">
                      #{index + 1} - {dispute.topic}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        isResolved
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/80'
                      }`}
                    >
                      {isResolved ? 'Resolved' : 'Contested'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 my-2.5">
                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-rose-400 font-medium block mb-0.5">Initial Claim:</span>
                      <p className="text-zinc-300">{dispute.claim}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
                      <span className="text-emerald-400 font-medium block mb-0.5">Rebuttal & Counter-Proof:</span>
                      <p className="text-zinc-300">{dispute.rebuttal}</p>
                    </div>
                  </div>

                  {dispute.evidence && (
                    <div className="my-2 bg-zinc-950 rounded-lg p-2.5 border border-zinc-800">
                      <pre className="text-cyan-300 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">
                        {dispute.evidence}
                      </pre>
                    </div>
                  )}

                  {dispute.resolution && (
                    <div className="p-2 rounded bg-emerald-950/30 text-emerald-300 text-[11px] border border-emerald-900/40">
                      {dispute.resolution}
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleRunFormalVerification(dispute)}
                      disabled={isVerifying}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-purple-300 text-[11px] transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      <span>{isVerifying && selectedDispute?.id === dispute.id ? 'Verifying...' : 'Verify Logic (High Thinking)'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          onUpdateDisputeStatus(
                            dispute.id,
                            'resolved_challenger',
                            'Developer accepted rebuttal: Design amended per challenger proof.'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] cursor-pointer"
                      >
                        Accept Rebuttal
                      </button>
                      <button
                        onClick={() =>
                          onUpdateDisputeStatus(
                            dispute.id,
                            'developer_verdict',
                            'Developer upheld initial blueprint with custom isolation.'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] cursor-pointer"
                      >
                        Developer Verdict
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Dispute Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-semibold text-zinc-200 text-xs">Add Technical Dispute</span>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDispute} className="space-y-2.5 text-xs">
                <div>
                  <label className="text-zinc-300 block mb-1">Topic:</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Distributed Lock TTL vs Job Execution SLA"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1">Flawed Claim:</label>
                  <textarea
                    value={newClaim}
                    onChange={(e) => setNewClaim(e.target.value)}
                    placeholder="e.g. Using in-memory Set is safe across instances..."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1">Rebuttal & Proof:</label>
                  <textarea
                    value={newRebuttal}
                    onChange={(e) => setNewRebuttal(e.target.value)}
                    placeholder="e.g. Fails under multi-instance autoscaling; retries hit different pods..."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1">Evidence / Repro Code:</label>
                  <textarea
                    value={newEvidence}
                    onChange={(e) => setNewEvidence(e.target.value)}
                    placeholder="// Reproduction code or test assertion..."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
                  >
                    Save Dispute
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
