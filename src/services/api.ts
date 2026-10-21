import { 
  DebateSession, 
  ModelConfig, 
  DebateMessage, 
  UserApiKeys, 
  TechnicalConsensusSummary,
  PlanMaturityMetrics,
  TerminalExecutionResult 
} from '../types';

export interface StepResponse {
  content: string;
  thinkingTrace?: string;
  citations?: string[];
  maturityMetrics?: PlanMaturityMetrics;
  disputeDetected?: {
    topic: string;
    claim: string;
    rebuttal: string;
    evidence: string;
  };
}

export async function executeDebateStep(
  session: DebateSession,
  model: ModelConfig,
  history: DebateMessage[],
  round: number,
  roundType: string,
  humanNote?: string,
  keys?: UserApiKeys,
  currentMaturity?: PlanMaturityMetrics
): Promise<StepResponse> {
  const res = await fetch('/api/debate/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session: {
        id: session.id,
        title: session.title,
        goal: session.goal,
        initialCodeOrSpec: session.initialCodeOrSpec,
        projectFiles: session.projectFiles,
      },
      model,
      history,
      round,
      roundType,
      humanNote,
      keys,
      currentMaturity,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}: Failed to execute model step`);
  }

  return res.json();
}

export async function synthesizeConsensus(
  session: DebateSession,
  keys?: UserApiKeys
): Promise<TechnicalConsensusSummary> {
  const res = await fetch('/api/debate/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session,
      keys,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}: Failed to synthesize technical consensus`);
  }

  const data = await res.json();
  return data.summary;
}

export async function verifyClaimWithGeminiArgon(
  claim: string,
  evidence: string,
  context?: string,
  keys?: UserApiKeys
): Promise<{ verdict: string; verifiedBy: string; timestamp: number }> {
  const res = await fetch('/api/debate/verify-claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claim,
      evidence,
      context,
      keys,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}: Failed to verify claim`);
  }

  return res.json();
}

// Terminal Execution API
export async function executeTerminalCommand(
  command: string,
  timeoutMs: number = 15000
): Promise<TerminalExecutionResult> {
  const res = await fetch('/api/terminal/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, timeoutMs }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Terminal error ${res.status}`);
  }

  return res.json();
}

export async function executeTerminalScript(
  script: string,
  language: string = 'typescript'
): Promise<TerminalExecutionResult> {
  const res = await fetch('/api/terminal/run-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, language }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Script run error ${res.status}`);
  }

  return res.json();
}

export async function fetchMcpConfig(): Promise<any> {
  const res = await fetch('/api/mcp/config');
  if (!res.ok) {
    throw new Error('Failed to fetch MCP config');
  }
  return res.json();
}
