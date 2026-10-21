export type ModelProvider = 
  | 'deepseek' 
  | 'claude' 
  | 'chatgpt' 
  | 'openai' 
  | 'openrouter' 
  | 'groq' 
  | 'gemini' 
  | 'custom';

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  modelIdentifier: string;
  role: string;
  avatarColor: string;
  iconName: string;
  systemPrompt: string;
  enabled: boolean;
  useHighThinking?: boolean;
  customApiKey?: string;
  customBaseUrl?: string;
}

export type DebateRoundType = 
  | 'draft_blueprint'       // Round 1: Model 1 proposes initial architecture & plan
  | 'peer_review'           // Round 2: Model 2 critiques & suggests improvements
  | 'verification_counter'  // Round 3: Model 3 & 1 cross-examine & refute false assumptions with proof
  | 'test_and_security'     // Round 4: Test specs & security audit
  | 'consensus_synthesis';  // Round 5: Final consensus & agent TODO synthesis

export interface DisputeItem {
  id: string;
  topic: string;
  proposerModelId: string;
  challengerModelId: string;
  claim: string;
  rebuttal: string;
  evidence: string; // Code repro or formal logic
  status: 'contested' | 'resolved_challenger' | 'resolved_proposer' | 'developer_verdict';
  resolution?: string;
  verifiedWithTerminal?: boolean;
  terminalOutput?: string;
}

export interface DebateMessage {
  id: string;
  modelId: string;
  modelName: string;
  modelRole: string;
  provider: ModelProvider;
  round: number;
  roundType: DebateRoundType;
  timestamp: number;
  content: string;
  thinkingTrace?: string;
  citations?: string[];
  codeSnippets?: { language: string; code: string; title?: string }[];
  disputeRef?: string;
  isHumanIntervention?: boolean;
}

export interface PlanMaturityMetrics {
  overallScore: number;          // 0 - 100%
  architectureStability: number; // 0 - 100%
  securityHardening: number;     // 0 - 100%
  testEdgeCaseCoverage: number;  // 0 - 100%
  codeClarity: number;           // 0 - 100%
  threshold: number;             // Default 85%
  isThresholdReached: boolean;
  estimatedTokensUsed: number;
  estimatedCostSavings: string;
  recommendation: 'continue' | 'ready_for_developer_decision' | 'mature';
  maturityReason?: string;
}

export interface ProjectFile {
  path: string;
  name: string;
  content: string;
  size: number;
  language: string;
}

export interface TechnicalConsensusSummary {
  executiveSummary: string;
  architectureRFC: string;
  validatedCode: string;
  testMatrix: string;
  securityAudit: string;
  actionableTodoPlan: string; // Detailed checklist with - [ ] TODO items for Cursor / VS Code AI agents
  consensusScore: number;
  resolvedDisputesCount: number;
  unresolvedRisks: string[];
  generatedAt: number;
  synthesizerModel: string;
}

export interface TerminalExecutionResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timestamp: number;
  success: boolean;
  environment: 'server' | 'local_mcp';
}

export interface DebateSession {
  id: string;
  title: string;
  goal: string;
  initialCodeOrSpec?: string;
  projectFiles?: ProjectFile[];
  models: ModelConfig[];
  messages: DebateMessage[];
  currentRound: number;
  maxRounds: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
  disputes: DisputeItem[];
  maturityMetrics?: PlanMaturityMetrics;
  summary?: TechnicalConsensusSummary;
  terminalLogs?: TerminalExecutionResult[];
  createdAt: number;
  updatedAt: number;
}

export interface UserApiKeys {
  deepseek?: string;
  claude?: string;
  openai?: string;
  openrouter?: string;
  groq?: string;
  gemini?: string;
  customBaseUrl?: string;
  customKey?: string;
}
