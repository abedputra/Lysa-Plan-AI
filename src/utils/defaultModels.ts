import { ModelConfig, UserApiKeys } from '../types';

export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: 'deepseek-architect',
    name: 'DeepSeek Reasoner',
    provider: 'deepseek',
    modelIdentifier: 'deepseek-reasoner',
    role: 'Lead System Architect & Planner',
    avatarColor: 'from-blue-600 to-cyan-600',
    iconName: 'Cpu',
    systemPrompt: `You are the Lead System Architect. Your role is to design resilient, clean, scalable architectures and draft foundational technical blueprints. You focus on modular boundaries, clean interfaces, concurrency safety, and low-latency algorithms. You open debate rounds with clear schemas and data flows.`,
    enabled: true,
    useHighThinking: false,
  },
  {
    id: 'claude-critic',
    name: 'Claude 3.7 Sonnet',
    provider: 'claude',
    modelIdentifier: 'claude-3-7-sonnet-20250219',
    role: 'Code Reviewer & Senior Critic',
    avatarColor: 'from-amber-600 to-orange-600',
    iconName: 'Code',
    systemPrompt: `You are a Staff Software Engineer and Senior Code Reviewer known for catching subtle bugs, ergonomic API flaws, race conditions, and over-engineering. You analyze proposed blueprints with relentless constructive critique. When you spot a flaw, cite specific lines, explain why it fails, provide a reproducible counter-proof, and propose a cleaner alternative. If a counter-proof against your point is valid, concede immediately and pivot to unaddressed issues.`,
    enabled: true,
    useHighThinking: false,
  },
  {
    id: 'chatgpt-tester',
    name: 'ChatGPT (GPT-4o)',
    provider: 'chatgpt',
    modelIdentifier: 'gpt-4o',
    role: 'Verification & Test Strategist',
    avatarColor: 'from-emerald-600 to-teal-600',
    iconName: 'CheckCircle2',
    systemPrompt: `You are the Principal Verification and Quality Engineer. Your mission is to break things before production. You demand test matrices, mock boundaries, edge case scenarios, chaos injection, idempotency proofs, and concrete test code for every component. If proven wrong, concede gracefully and provide the patched test assertions.`,
    enabled: true,
    useHighThinking: false,
  },
  {
    id: 'openrouter-specialist',
    name: 'Qwen 2.5 Coder / Llama 3.3',
    provider: 'openrouter',
    modelIdentifier: 'qwen/qwen-2.5-coder-32b-instruct',
    role: 'Implementation & Algorithmic Specialist',
    avatarColor: 'from-indigo-600 to-violet-600',
    iconName: 'Code',
    systemPrompt: `You are an Implementation and Low-Level Systems Specialist. You inspect algorithmic complexity, memory allocations, data structures, and edge-case execution paths. You provide concrete, production-ready code blocks and verify implementation correctness.`,
    enabled: true,
    useHighThinking: false,
  },
  {
    id: 'custom-model-slot',
    name: 'Custom Model (Any API / Ollama / Groq)',
    provider: 'custom',
    modelIdentifier: 'custom-model',
    role: 'Security & Systems Hardening Specialist',
    avatarColor: 'from-purple-600 to-pink-600',
    iconName: 'ShieldAlert',
    systemPrompt: `You are a Systems Hardening and Security Specialist. You audit input validation, authorization boundaries, cryptographic invariants, memory safety, and thread synchronization.`,
    enabled: false,
    useHighThinking: false,
  },
];

// Helper to determine if a model has an active key configured
export function isModelConfiguredAndActive(model: ModelConfig, keys: UserApiKeys): boolean {
  if (!model.enabled) return false;

  // If model has its own direct API key specified
  if (model.customApiKey && model.customApiKey.trim().length > 0) return true;

  // Check provider key in UserApiKeys
  switch (model.provider) {
    case 'deepseek':
      return Boolean(keys.deepseek && keys.deepseek.trim().length > 0);
    case 'claude':
      return Boolean(keys.claude && keys.claude.trim().length > 0);
    case 'chatgpt':
    case 'openai':
      return Boolean(keys.openai && keys.openai.trim().length > 0);
    case 'openrouter':
      return Boolean(keys.openrouter && keys.openrouter.trim().length > 0);
    case 'groq':
      return Boolean(keys.groq && keys.groq.trim().length > 0);
    case 'custom':
      return Boolean(
        (keys.customKey && keys.customKey.trim().length > 0) ||
        (keys.customBaseUrl && keys.customBaseUrl.trim().length > 0) ||
        model.customBaseUrl
      );
    case 'gemini':
      return Boolean(keys.gemini && keys.gemini.trim().length > 0);
    default:
      return false;
  }
}

// Helper to determine if any API key or local model endpoint is configured
export function hasAnyActiveKey(keys?: UserApiKeys): boolean {
  if (!keys) return false;
  return Boolean(
    (keys.deepseek && keys.deepseek.trim().length > 0) ||
    (keys.claude && keys.claude.trim().length > 0) ||
    (keys.openai && keys.openai.trim().length > 0) ||
    (keys.openrouter && keys.openrouter.trim().length > 0) ||
    (keys.groq && keys.groq.trim().length > 0) ||
    (keys.customBaseUrl && keys.customBaseUrl.trim().length > 0) ||
    (keys.customKey && keys.customKey.trim().length > 0) ||
    (keys.gemini && keys.gemini.trim().length > 0)
  );
}
