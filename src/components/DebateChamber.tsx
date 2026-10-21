import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  BrainCircuit, 
  Sparkles, 
  ShieldCheck, 
  Code, 
  CheckCircle2, 
  Zap, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  FolderPlus,
  FileCode,
  ArrowDown,
  Play,
  Copy,
  Check,
  Target
} from 'lucide-react';
import { DebateMessage, DebateSession, ModelConfig, ProjectFile } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { PlanMaturityBanner } from './PlanMaturityBanner';
import { ProjectCodebaseInspector } from './ProjectCodebaseInspector';

interface DebateChamberProps {
  session: DebateSession;
  activeModelId?: string;
  isDebating: boolean;
  onVerifyWithGeminiArgon: (claim: string, evidence: string) => void;
  onLogDispute: (topic: string, claim: string, rebuttal: string, evidence: string) => void;
  onAddFiles: (files: ProjectFile[]) => void;
  onRemoveFile: (path: string) => void;
  onClearFiles: () => void;
  onSynthesize: () => void;
  onContinueOneRound: () => void;
  onUpdateThreshold: (threshold: number) => void;
  isSynthesizing: boolean;
  onSendToTerminal?: (code: string, language: string, title?: string) => void;
}

export const DebateChamber: React.FC<DebateChamberProps> = ({
  session,
  activeModelId,
  isDebating,
  onVerifyWithGeminiArgon,
  onLogDispute,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onSynthesize,
  onContinueOneRound,
  onUpdateThreshold,
  isSynthesizing,
  onSendToTerminal,
}) => {
  const [showGoalCard, setShowGoalCard] = useState<boolean>(false);
  const [isCodebaseOpen, setIsCodebaseOpen] = useState<boolean>(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.messages.length, activeModelId]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setIsScrolledUp(distanceToBottom > 120);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsScrolledUp(false);
  };

  const toggleThinking = (msgId: string) => {
    setExpandedThinking((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const extractCodeBlock = (content: string): { code: string; language: string } | null => {
    const match = content.match(/```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
    if (match) {
      return {
        language: match[1] || 'typescript',
        code: match[2].trim(),
      };
    }
    return null;
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 1800);
  };

  const getModelIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu':
        return <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Code':
        return <Code className="w-3.5 h-3.5 text-amber-400" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ShieldAlert':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />;
      case 'Zap':
        return <Zap className="w-3.5 h-3.5 text-pink-400" />;
      default:
        return <Bot className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const getModelInfo = (modelId: string): ModelConfig | undefined => {
    return session.models.find((m) => m.id === modelId);
  };

  const formatRoundLabel = (roundType: string, round: number) => {
    switch (roundType) {
      case 'draft_blueprint':
        return `R${round} · Blueprint`;
      case 'peer_review':
        return `R${round} · Critique`;
      case 'verification_counter':
        return `R${round} · Counter-Proof`;
      case 'test_and_security':
        return `R${round} · Hardening`;
      case 'consensus_synthesis':
        return `R${round} · Consensus`;
      default:
        return `R${round}`;
    }
  };

  const projectFilesCount = session.projectFiles?.length || 0;

  return (
    <div className="relative flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-zinc-950">
      
      {/* Sleek Sub-Toolbar: Plan Objective & Codebase Status */}
      <div className="bg-zinc-900/90 border-b border-zinc-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0 z-20 text-xs">
        
        {/* Left: Objective pill */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => setShowGoalCard(!showGoalCard)}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition cursor-pointer min-w-0"
            title="Click to view/hide full architecture objective"
          >
            <Target className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="font-semibold truncate max-w-[240px] sm:max-w-[420px]">
              {session.title || 'New Architecture Plan'}
            </span>
            {showGoalCard ? (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            )}
          </button>
        </div>

        {/* Right: Codebase Drawer & Messages count */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsCodebaseOpen(!isCodebaseOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition cursor-pointer ${
              projectFilesCount > 0
                ? 'bg-zinc-800 text-cyan-300 border-zinc-700/80'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
            title="Inspect or load local project files"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Codebase ({projectFilesCount})</span>
          </button>

          <span className="text-zinc-500 font-mono text-[11px] hidden sm:inline">
            {session.messages.length} turns
          </span>
        </div>
      </div>

      {/* Expandable Objective Drawer */}
      {showGoalCard && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 text-xs space-y-2 animate-fadeIn z-10 flex-shrink-0">
          <div>
            <span className="text-zinc-400 font-medium block mb-1">Architecture Objective:</span>
            <p className="text-zinc-200 font-mono text-[11px] leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-850">
              {session.goal || 'No goal set yet. Enter your technical objective or questions in the steering bar below.'}
            </p>
          </div>

          {session.initialCodeOrSpec && (
            <div>
              <span className="text-zinc-400 font-medium block mb-1">Initial Draft / Code:</span>
              <div className="bg-zinc-950 rounded-lg p-2.5 border border-zinc-850 overflow-x-auto max-h-32">
                <pre className="text-cyan-300 font-mono text-[11px] leading-relaxed">{session.initialCodeOrSpec}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expandable Codebase Inspector Drawer */}
      {isCodebaseOpen && (
        <div className="border-b border-zinc-800 bg-zinc-950 p-3 z-10 flex-shrink-0">
          <ProjectCodebaseInspector
            projectFiles={session.projectFiles || []}
            onAddFiles={onAddFiles}
            onRemoveFile={onRemoveFile}
            onClearFiles={onClearFiles}
          />
        </div>
      )}

      {/* Scrollable Chamber */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scroll-smooth"
      >
        <div className="max-w-4xl mx-auto space-y-3 pb-6">
          
          {/* Plan Maturity Ribbon (Only shows when messages exist or score > 0) */}
          {session.messages.length > 0 && session.maturityMetrics && (
            <PlanMaturityBanner
              metrics={session.maturityMetrics}
              onSynthesize={onSynthesize}
              onContinueOneRound={onContinueOneRound}
              onUpdateThreshold={onUpdateThreshold}
              isSynthesizing={isSynthesizing}
            />
          )}

          {/* Messages Thread */}
          {session.messages.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
              <BrainCircuit className="w-8 h-8 mx-auto mb-2.5 text-zinc-600" />
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">Council Ready</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4 leading-relaxed">
                Your AI council will peer-review blueprints, cross-examine assumptions with proof, and verify edge cases.
              </p>
              
              <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Type a steering directive or click &quot;Auto-Debate&quot; below to launch Round 1</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {session.messages.map((msg) => {
                const modelInfo = getModelInfo(msg.modelId);
                const codeSnippet = extractCodeBlock(msg.content);

                return (
                  <div
                    key={msg.id}
                    className={`rounded-lg border transition-all overflow-hidden ${
                      msg.isHumanIntervention
                        ? 'bg-amber-950/20 border-amber-800/60'
                        : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700/80'
                    }`}
                  >
                    {/* Header */}
                    <div className="px-3.5 py-1.5 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 bg-zinc-950/60 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-zinc-850 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                          {getModelIcon(modelInfo?.iconName || 'Bot')}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-zinc-100">{msg.modelName}</span>
                          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                            {msg.modelRole}
                          </span>
                          {msg.isHumanIntervention && (
                            <span className="text-[10px] font-semibold text-amber-300 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800 flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              Developer Directive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Tag & Time */}
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        <span className="text-cyan-400 font-medium">
                          {formatRoundLabel(msg.roundType, msg.round)}
                        </span>
                        <span>·</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Thinking Trace (Gemini 4 Argon High Thinking) */}
                    {msg.thinkingTrace && (
                      <div className="mx-3 mt-2 border border-purple-900/40 bg-purple-950/20 rounded-md overflow-hidden text-xs">
                        <button
                          onClick={() => toggleThinking(msg.id)}
                          className="w-full px-2.5 py-1.5 flex items-center justify-between text-purple-300 hover:text-purple-200 transition cursor-pointer font-medium text-[11px]"
                        >
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>Reasoning Trace (High Thinking Mode)</span>
                          </div>
                          {expandedThinking[msg.id] ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {expandedThinking[msg.id] && (
                          <div className="p-2.5 bg-purple-950/30 text-purple-200/90 font-mono text-[10px] leading-relaxed whitespace-pre-line border-t border-purple-900/30">
                            {msg.thinkingTrace}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="p-3 text-xs leading-relaxed">
                      <MarkdownRenderer content={msg.content} />
                    </div>

                    {/* Footer Actions */}
                    <div className="px-3 py-1.5 bg-zinc-950/50 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span>Reviewed:</span>
                            {msg.citations.map((c, i) => (
                              <span key={i} className="text-cyan-400 font-mono">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {codeSnippet && onSendToTerminal && (
                          <button
                            onClick={() =>
                              onSendToTerminal(
                                codeSnippet.code,
                                codeSnippet.language,
                                `Code from ${msg.modelName}`
                              )
                            }
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] font-medium transition cursor-pointer"
                            title="Execute this code directly in the terminal"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Run in Terminal</span>
                          </button>
                        )}

                        {codeSnippet && (
                          <button
                            onClick={() => handleCopyCode(codeSnippet.code, msg.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] transition cursor-pointer"
                            title="Copy code"
                          >
                            {copiedSnippetId === msg.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                            <span>{copiedSnippetId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const topic = `${msg.modelName} (Round ${msg.round})`;
                            onLogDispute(topic, `Claim from ${msg.modelName}`, msg.content.slice(0, 300), msg.content);
                          }}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] transition cursor-pointer"
                          title="Log as a contested dispute"
                        >
                          Log Dispute
                        </button>

                        <button
                          onClick={() => onVerifyWithGeminiArgon(`Technical claim from ${msg.modelName}`, msg.content)}
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-purple-300 text-[10px] transition cursor-pointer"
                          title="Verify claim with Gemini 4 Argon High Thinking"
                        >
                          Verify Logic
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Active Thinking Indicator */}
              {isDebating && (
                <div className="p-3 rounded-lg bg-zinc-900/90 border border-cyan-800/50 flex items-center gap-2.5 text-xs text-zinc-200">
                  <BrainCircuit className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="font-medium">
                    Model is scrutinizing architecture and verifying edge cases...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {isScrolledUp && (
        <button
          onClick={scrollToBottom}
          className="absolute right-6 bottom-3 px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 shadow-md flex items-center gap-1.5 transition cursor-pointer z-30"
        >
          <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
          <span>Latest Message</span>
        </button>
      )}
    </div>
  );
};
