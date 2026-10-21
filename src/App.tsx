import React, { useState, useEffect, useRef } from 'react';
import { 
  DebateSession, 
  DebateMessage, 
  ModelConfig, 
  UserApiKeys, 
  DisputeItem, 
  DebateRoundType,
  ProjectFile,
  TerminalExecutionResult 
} from './types';
import { 
  loadSavedSessions, 
  saveSessions, 
  loadUserApiKeys, 
  saveUserApiKeys, 
  getActiveSessionId, 
  setActiveSessionId,
  createDefaultSession 
} from './utils/storage';
import { isModelConfiguredAndActive, hasAnyActiveKey } from './utils/defaultModels';
import { executeDebateStep, synthesizeConsensus, verifyClaimWithGeminiArgon } from './services/api';

import { Header } from './components/Header';
import { ModelBar } from './components/ModelBar';
import { DebateChamber } from './components/DebateChamber';
import { HumanSteeringBar } from './components/HumanSteeringBar';
import { ConsensusSummaryView } from './components/ConsensusSummaryView';
import { DisputeTracker } from './components/DisputeTracker';
import { TerminalConsole } from './components/TerminalConsole';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ModelConfigModal } from './components/ModelConfigModal';
import { NewDebateModal } from './components/NewDebateModal';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [sessions, setSessions] = useState<DebateSession[]>(() => loadSavedSessions());
  const [activeSessionId, setActiveSessionIdState] = useState<string>(() => {
    const savedId = getActiveSessionId();
    const loaded = loadSavedSessions();
    return savedId && loaded.some((s) => s.id === savedId) ? savedId : loaded[0].id;
  });

  const [activeTab, setActiveTab] = useState<'chamber' | 'terminal' | 'summary' | 'disputes'>('chamber');
  const [apiKeys, setApiKeys] = useState<UserApiKeys>(() => loadUserApiKeys());

  // Debating execution state
  const [isDebating, setIsDebating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeModelId, setActiveModelId] = useState<string | undefined>(undefined);
  const [verificationResult, setVerificationResult] = useState<{ verdict: string; timestamp: number } | null>(null);

  // In-app Toast state (replaces window.alert)
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Terminal state
  const [pendingCodeToRun, setPendingCodeToRun] = useState<{ code: string; language: string; title?: string } | null>(null);

  // Modals state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isModelConfigModalOpen, setIsModelConfigModalOpen] = useState(false);
  const [isNewDebateModalOpen, setIsNewDebateModalOpen] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  // Auto-run ref to prevent stale closures
  const isAutoRunRef = useRef(isDebating);
  isAutoRunRef.current = isDebating;

  // Active session helper
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || createDefaultSession();

  // On startup: detect whether any API key or local endpoint is configured
  useEffect(() => {
    const hasKeys = hasAnyActiveKey(apiKeys);
    if (!hasKeys) {
      setIsInitialSetup(true);
      setIsApiKeyModalOpen(true);
    } else if (activeSession.messages.length === 0) {
      // If keys are already active and there's no active debate yet, open New Plan automatically
      setIsNewDebateModalOpen(true);
    }
  }, []);

  // Persist sessions
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Persist active ID
  useEffect(() => {
    if (activeSessionId) {
      setActiveSessionId(activeSessionId);
    }
  }, [activeSessionId]);

  // Update session helper
  const updateActiveSession = (updater: (prev: DebateSession) => DebateSession) => {
    setSessions((prevSessions) =>
      prevSessions.map((s) => (s.id === activeSession.id ? updater(s) : s))
    );
  };

  // Determine which model speaks next from enabled models that have active API keys
  const getNextModelAndRound = (session: DebateSession): { nextModel: ModelConfig; roundNumber: number; roundType: DebateRoundType } => {
    let candidateModels = session.models.filter((m) => isModelConfiguredAndActive(m, apiKeys));
    if (candidateModels.length === 0) {
      candidateModels = session.models.filter((m) => m.enabled);
    }
    if (candidateModels.length === 0) {
      throw new Error('No AI models have an active API key. Please open Keys to configure DeepSeek, Claude, ChatGPT, OpenRouter, or Custom API key.');
    }

    const messageCount = session.messages.length;
    const modelIndex = messageCount % candidateModels.length;
    const nextModel = candidateModels[modelIndex];

    let roundType: DebateRoundType = 'draft_blueprint';
    let roundNumber = Math.min(5, Math.floor(messageCount / candidateModels.length) + 1);

    if (messageCount === 0) {
      roundType = 'draft_blueprint';
    } else if (roundNumber === 2 || messageCount === 1) {
      roundType = 'peer_review';
    } else if (roundNumber === 3 || messageCount === 2) {
      roundType = 'verification_counter';
    } else if (roundNumber === 4 || messageCount === 3) {
      roundType = 'test_and_security';
    } else {
      roundType = 'consensus_synthesis';
    }

    return { nextModel, roundNumber, roundType };
  };

  // Execute a single step in the debate
  const handleNextStep = async (humanNote?: string, forceIgnoreThreshold?: boolean) => {
    try {
      if (
        !forceIgnoreThreshold &&
        activeSession.maturityMetrics?.isThresholdReached &&
        isAutoRunRef.current &&
        !activeSession.summary
      ) {
        setIsDebating(false);
        return;
      }

      const { nextModel, roundNumber, roundType } = getNextModelAndRound(activeSession);
      setActiveModelId(nextModel.id);

      if (humanNote) {
        const humanMsg: DebateMessage = {
          id: `human-${Date.now()}`,
          modelId: 'developer-human',
          modelName: 'Developer',
          modelRole: 'System Owner & Principal Directive',
          provider: 'custom',
          round: roundNumber,
          roundType: roundType,
          timestamp: Date.now(),
          content: `> **Developer Steering Directive:**\n${humanNote}`,
          isHumanIntervention: true,
        };

        updateActiveSession((prev) => ({
          ...prev,
          messages: [...prev.messages, humanMsg],
          updatedAt: Date.now(),
        }));
      }

      const res = await executeDebateStep(
        activeSession,
        nextModel,
        activeSession.messages,
        roundNumber,
        roundType,
        humanNote,
        apiKeys,
        activeSession.maturityMetrics
      );

      const newMsg: DebateMessage = {
        id: `msg-${Date.now()}`,
        modelId: nextModel.id,
        modelName: nextModel.name,
        modelRole: nextModel.role,
        provider: nextModel.provider,
        round: roundNumber,
        roundType: roundType,
        timestamp: Date.now(),
        content: res.content,
        thinkingTrace: res.thinkingTrace,
        citations: res.citations,
      };

      const lower = res.content.toLowerCase();
      let autoDispute: DisputeItem | null = null;
      if (
        lower.includes('rebuttal') || 
        lower.includes('race condition') || 
        lower.includes('flaw') || 
        lower.includes('counter-proof') ||
        lower.includes('memory leak') ||
        lower.includes('dispute')
      ) {
        autoDispute = {
          id: `disp-${Date.now()}`,
          topic: `Critical Scrutiny by ${nextModel.name} (Round ${roundNumber})`,
          proposerModelId: activeSession.messages[activeSession.messages.length - 1]?.modelId || 'previous-model',
          challengerModelId: nextModel.id,
          claim: `Initial design assumption from previous turn`,
          rebuttal: res.content.slice(0, 250) + '...',
          evidence: res.content.slice(0, 500),
          status: 'contested',
        };
      }

      const updatedMaturity = res.maturityMetrics || activeSession.maturityMetrics;

      updateActiveSession((prev) => ({
        ...prev,
        messages: [...prev.messages, newMsg],
        currentRound: Math.max(prev.currentRound, roundNumber),
        disputes: autoDispute ? [...prev.disputes, autoDispute] : prev.disputes,
        maturityMetrics: updatedMaturity,
        updatedAt: Date.now(),
      }));

      setActiveModelId(undefined);

      if (updatedMaturity?.isThresholdReached) {
        setIsDebating(false);
        return;
      }

      if (isAutoRunRef.current) {
        setTimeout(() => {
          if (isAutoRunRef.current) {
            handleNextStep();
          }
        }, 1500);
      }
    } catch (err: any) {
      console.error('Failed to run turn:', err);
      setIsDebating(false);
      setActiveModelId(undefined);
      showToast(`Failed to execute AI turn: ${err.message}`, 'error');
    }
  };

  const handleToggleAutoRun = () => {
    if (isDebating) {
      setIsDebating(false);
    } else {
      setIsDebating(true);
      handleNextStep();
    }
  };

  const handleContinueOneRound = () => {
    handleNextStep(undefined, true);
  };

  const handleUpdateThreshold = (threshold: number) => {
    updateActiveSession((prev) => ({
      ...prev,
      maturityMetrics: prev.maturityMetrics
        ? {
            ...prev.maturityMetrics,
            threshold,
            isThresholdReached: prev.maturityMetrics.overallScore >= threshold,
          }
        : undefined,
    }));
  };

  const handleSynthesize = async () => {
    try {
      setIsSynthesizing(true);
      const summary = await synthesizeConsensus(activeSession, apiKeys);
      updateActiveSession((prev) => ({
        ...prev,
        summary,
        status: 'completed',
        updatedAt: Date.now(),
      }));
      setIsSynthesizing(false);
      setActiveTab('summary');
      showToast('Consensus RFC and production code successfully synthesized!', 'success');
    } catch (err: any) {
      setIsSynthesizing(false);
      console.error('Synthesis failed:', err);
      showToast(`Failed to synthesize consensus: ${err.message}`, 'error');
    }
  };

  const handleVerifyWithGeminiArgon = async (claim: string, evidence: string, context?: string) => {
    try {
      setIsVerifying(true);
      const result = await verifyClaimWithGeminiArgon(claim, evidence, context || activeSession.goal, apiKeys);
      setVerificationResult(result);
      setIsVerifying(false);
      setActiveTab('disputes');
      showToast('Claim verified with High Thinking mode.', 'success');
    } catch (err: any) {
      setIsVerifying(false);
      console.error('Verification failed:', err);
      showToast(`Failed to verify claim: ${err.message}`, 'error');
    }
  };

  const handleUpdateDisputeStatus = (disputeId: string, status: DisputeItem['status'], resolution?: string) => {
    updateActiveSession((prev) => ({
      ...prev,
      disputes: prev.disputes.map((d) => (d.id === disputeId ? { ...d, status, resolution } : d)),
      updatedAt: Date.now(),
    }));
  };

  const handleAddDispute = (dispute: Omit<DisputeItem, 'id'>) => {
    const newDispute: DisputeItem = {
      ...dispute,
      id: `disp-${Date.now()}`,
    };
    updateActiveSession((prev) => ({
      ...prev,
      disputes: [newDispute, ...prev.disputes],
      updatedAt: Date.now(),
    }));
  };

  // Terminal Handlers
  const handleAddTerminalLog = (log: TerminalExecutionResult) => {
    updateActiveSession((prev) => ({
      ...prev,
      terminalLogs: [...(prev.terminalLogs || []), log],
      updatedAt: Date.now(),
    }));
  };

  const handleClearTerminalLogs = () => {
    updateActiveSession((prev) => ({
      ...prev,
      terminalLogs: [],
      updatedAt: Date.now(),
    }));
  };

  const handleSendToTerminal = (code: string, language: string, title?: string) => {
    setPendingCodeToRun({ code, language, title });
    setActiveTab('terminal');
  };

  // Project Files Handlers
  const handleAddFiles = (newFiles: ProjectFile[]) => {
    updateActiveSession((prev) => {
      const existing = prev.projectFiles || [];
      const merged = [...existing];
      newFiles.forEach((nf) => {
        const idx = merged.findIndex((f) => f.path === nf.path);
        if (idx >= 0) {
          merged[idx] = nf;
        } else {
          merged.push(nf);
        }
      });
      return {
        ...prev,
        projectFiles: merged,
        updatedAt: Date.now(),
      };
    });
    showToast(`Added ${newFiles.length} file(s) to codebase context`, 'success');
  };

  const handleRemoveFile = (path: string) => {
    updateActiveSession((prev) => ({
      ...prev,
      projectFiles: (prev.projectFiles || []).filter((f) => f.path !== path),
      updatedAt: Date.now(),
    }));
  };

  const handleClearFiles = () => {
    updateActiveSession((prev) => ({
      ...prev,
      projectFiles: [],
      updatedAt: Date.now(),
    }));
  };

  // Quick Model Count Presets
  const handleSelectModelPreset = (count: number) => {
    updateActiveSession((prev) => ({
      ...prev,
      models: prev.models.map((m, idx) => ({
        ...m,
        enabled: idx < count,
      })),
      updatedAt: Date.now(),
    }));
  };

  const handleToggleModel = (modelId: string) => {
    updateActiveSession((prev) => ({
      ...prev,
      models: prev.models.map((m) => (m.id === modelId ? { ...m, enabled: !m.enabled } : m)),
      updatedAt: Date.now(),
    }));
  };

  // Session Management
  const handleSelectSession = (session: DebateSession) => {
    setActiveSessionIdState(session.id);
  };

  const handleCreateSession = (newSession: DebateSession) => {
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionIdState(newSession.id);
    setActiveTab('chamber');
  };

  const handleSaveModels = (updatedModels: ModelConfig[]) => {
    updateActiveSession((prev) => ({
      ...prev,
      models: updatedModels,
      updatedAt: Date.now(),
    }));
    showToast('Council configuration saved', 'success');
  };

  const handleSaveApiKeys = (keys: UserApiKeys) => {
    setApiKeys(keys);
    saveUserApiKeys(keys);
    showToast('API keys saved securely', 'success');

    if (hasAnyActiveKey(keys)) {
      setIsInitialSetup(false);
      setIsApiKeyModalOpen(false);
      // Automatically open the New Plan modal right after saving active keys
      setTimeout(() => {
        setIsNewDebateModalOpen(true);
        showToast('Model active! Create your new architecture plan to start.', 'info');
      }, 400);
    }
  };

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden">
      
      {/* Top Application Header */}
      <Header
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
        onOpenNewDebate={() => setIsNewDebateModalOpen(true)}
        onOpenModelConfig={() => setIsModelConfigModalOpen(true)}
        onOpenApiKeys={() => {
          setIsInitialSetup(false);
          setIsApiKeyModalOpen(true);
        }}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Model Council Status Bar */}
      <ModelBar
        models={activeSession.models}
        apiKeys={apiKeys}
        activeModelId={activeModelId}
        isDebating={isDebating}
        onOpenModelConfig={() => setIsModelConfigModalOpen(true)}
        onOpenApiKeys={() => setIsApiKeyModalOpen(true)}
        onToggleModel={handleToggleModel}
        onSelectModelPreset={handleSelectModelPreset}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {activeTab === 'chamber' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <DebateChamber
              session={activeSession}
              activeModelId={activeModelId}
              isDebating={isDebating}
              onVerifyWithGeminiArgon={handleVerifyWithGeminiArgon}
              onLogDispute={(topic, claim, rebuttal, evidence) => {
                handleAddDispute({
                  topic,
                  proposerModelId: 'deepseek-architect',
                  challengerModelId: 'claude-critic',
                  claim,
                  rebuttal,
                  evidence,
                  status: 'contested',
                });
                setActiveTab('disputes');
              }}
              onAddFiles={handleAddFiles}
              onRemoveFile={handleRemoveFile}
              onClearFiles={handleClearFiles}
              onSynthesize={handleSynthesize}
              onContinueOneRound={handleContinueOneRound}
              onUpdateThreshold={handleUpdateThreshold}
              isSynthesizing={isSynthesizing}
              onSendToTerminal={handleSendToTerminal}
            />

            {/* Sticky Developer Steering & Execution Control Bar */}
            <HumanSteeringBar
              session={activeSession}
              isDebating={isDebating}
              onNextStep={handleNextStep}
              onToggleAutoRun={handleToggleAutoRun}
              onSynthesize={handleSynthesize}
              isSynthesizing={isSynthesizing}
            />
          </div>
        )}

        {activeTab === 'terminal' && (
          <TerminalConsole
            sessionLogs={activeSession.terminalLogs || []}
            onAddLog={handleAddTerminalLog}
            onClearLogs={handleClearTerminalLogs}
            pendingCodeToRun={pendingCodeToRun}
            onClearPendingCode={() => setPendingCodeToRun(null)}
          />
        )}

        {activeTab === 'summary' && (
          <ConsensusSummaryView
            session={activeSession}
            onSynthesize={handleSynthesize}
            isSynthesizing={isSynthesizing}
          />
        )}

        {activeTab === 'disputes' && (
          <DisputeTracker
            session={activeSession}
            onVerifyWithGeminiArgon={handleVerifyWithGeminiArgon}
            onUpdateDisputeStatus={handleUpdateDisputeStatus}
            onAddDispute={handleAddDispute}
            isVerifying={isVerifying}
            activeVerificationResult={verificationResult}
          />
        )}
      </main>

      {/* Non-intrusive Toast Notification */}
      {toast && (
        <div className="fixed bottom-16 right-4 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 shadow-xl text-xs text-zinc-100 animate-slideUp">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-zinc-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKeys={apiKeys}
        onSaveKeys={handleSaveApiKeys}
        isInitialSetup={isInitialSetup}
      />

      <ModelConfigModal
        isOpen={isModelConfigModalOpen}
        onClose={() => setIsModelConfigModalOpen(false)}
        models={activeSession.models}
        onSaveModels={handleSaveModels}
      />

      <NewDebateModal
        isOpen={isNewDebateModalOpen}
        onClose={() => setIsNewDebateModalOpen(false)}
        onCreateSession={handleCreateSession}
      />
    </div>
  );
}
