import { DebateSession, UserApiKeys, ProjectFile, PlanMaturityMetrics } from '../types';
import { DEFAULT_MODELS } from './defaultModels';

const KEYS_STORAGE_KEY = 'lysaplan_api_keys_v1';
const SESSIONS_STORAGE_KEY = 'lysaplan_sessions_v1';
const ACTIVE_SESSION_ID_KEY = 'lysaplan_active_session_id_v1';

export function loadUserApiKeys(): UserApiKeys {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserApiKeys(keys: UserApiKeys): void {
  try {
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch (e) {
    console.error('Failed to save API keys:', e);
  }
}

export function loadSavedSessions(): DebateSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [createDefaultSession()];
    const sessions = JSON.parse(raw);
    return Array.isArray(sessions) && sessions.length > 0 ? sessions : [createDefaultSession()];
  } catch {
    return [createDefaultSession()];
  }
}

export function saveSessions(sessions: DebateSession[]): void {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
}

export function setActiveSessionId(id: string): void {
  localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
}

export function createDefaultSession(): DebateSession {
  const initialMaturity: PlanMaturityMetrics = {
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
    maturityReason: 'New session ready. Define your architecture goal or load your codebase.',
  };

  return {
    id: `session-${Date.now()}`,
    title: 'New Architecture Plan',
    goal: '',
    models: DEFAULT_MODELS,
    messages: [],
    currentRound: 1,
    maxRounds: 5,
    status: 'idle',
    disputes: [],
    projectFiles: [],
    maturityMetrics: initialMaturity,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
