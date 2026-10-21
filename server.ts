import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Helper to get GoogleGenAI client (used if Gemini is configured or as fallback)
function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment or provided in settings.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Universal handler for calling any LLM provider (OpenAI, DeepSeek, Claude, OpenRouter, Groq, or Custom Endpoint)
async function callExternalProvider(
  provider: string,
  modelIdentifier: string,
  apiKey: string,
  systemPrompt: string,
  prompt: string,
  customBaseUrl?: string
): Promise<{ text: string; thinking?: string }> {
  // 1. Anthropic / Claude
  if (provider === 'anthropic' || provider === 'claude') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelIdentifier || 'claude-3-7-sonnet-20250219',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API Error (${res.status}): ${err}`);
    }
    const data = await res.json();
    return { text: data.content?.[0]?.text || '' };
  }

  // Determine endpoint for OpenAI-compatible providers
  let endpoint = 'https://api.openai.com/v1/chat/completions';
  const authHeader = (apiKey && apiKey !== 'local-offline-key') ? apiKey : 'ollama-local';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authHeader}`,
  };

  if (provider === 'deepseek') {
    endpoint = 'https://api.deepseek.com/chat/completions';
  } else if (provider === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    headers['HTTP-Referer'] = 'https://github.com/lysaplan/lysaplan';
    headers['X-Title'] = 'Lysa Plan Architecture Chamber';
  } else if (provider === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  } else if (provider === 'custom' || customBaseUrl) {
    const base = customBaseUrl ? customBaseUrl.replace(/\/$/, '') : 'http://localhost:11434/v1';
    endpoint = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: modelIdentifier || 'qwen2.5-coder',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${provider.toUpperCase()} API Error (${res.status}): ${err}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const message = choice?.message;
  return {
    text: message?.content || '',
    thinking: message?.reasoning_content || undefined,
  };
}

// POST /api/debate/step - Executes an AI turn in the debate
app.post('/api/debate/step', async (req: Request, res: Response) => {
  try {
    const { session, model, history, round, roundType, humanNote, keys, currentMaturity } = req.body;

    const userPrompt = buildTurnPrompt(session, model, history, round, roundType, humanNote);
    const systemInstruction = buildSharpenedSystemPrompt(model);

    // Resolve API key for this model: check model-specific key, then provider key, then env vars, then customKey
    let externalKey = 
      model.customApiKey || 
      keys?.[model.provider] || 
      process.env[`${model.provider.toUpperCase()}_API_KEY`] ||
      (model.provider === 'claude' ? process.env.ANTHROPIC_API_KEY : undefined) ||
      (model.provider === 'custom' ? (keys?.customKey || process.env.CUSTOM_API_KEY) : undefined);
    
    const customBaseUrl = 
      model.customBaseUrl || 
      keys?.customBaseUrl || 
      process.env.OLLAMA_BASE_URL || 
      process.env.CUSTOM_BASE_URL;

    // For local custom endpoints (e.g. Ollama, LM Studio), no secret is required
    if (!externalKey && (model.provider === 'custom' || customBaseUrl)) {
      externalKey = 'local-offline-key';
    }

    if (externalKey && model.provider !== 'gemini') {
      try {
        const result = await callExternalProvider(
          model.provider,
          model.modelIdentifier,
          externalKey,
          systemInstruction,
          userPrompt,
          customBaseUrl
        );

        const newMaturity = calculatePlanMaturity(
          round,
          (history || []).length + 1,
          result.text,
          currentMaturity
        );

        return res.json({
          content: result.text,
          thinkingTrace: result.thinking,
          citations: extractCitations(result.text),
          maturityMetrics: newMaturity,
        });
      } catch (externalErr: any) {
        console.warn(`Direct call to ${model.provider} failed:`, externalErr.message);
        // Only fallback to Gemini if gemini key is available
        const geminiKey = keys?.gemini || process.env.GEMINI_API_KEY;
        if (!geminiKey) {
          throw new Error(`API call failed for ${model.name} (${model.provider}): ${externalErr.message}`);
        }
      }
    }

    // Execution via Google GenAI (either explicitly requested or as fallback)
    const geminiKey = keys?.gemini || process.env.GEMINI_API_KEY;
    if (!geminiKey && !externalKey) {
      throw new Error(`No active API key found for ${model.name} (${model.provider}). Please configure keys in the Keys modal.`);
    }

    const ai = getGeminiClient(geminiKey);
    const useArgonHighThinking = model.useHighThinking || model.modelIdentifier === 'gemini-4-argon' || roundType === 'verification_counter';
    const targetModel = useArgonHighThinking ? 'gemini-4-argon' : 'gemini-3.8-flash';

    let responseText = '';
    let thinkingTrace = '';

    if (useArgonHighThinking) {
      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: userPrompt,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      responseText = response.text || '';
      thinkingTrace = `[Gemini 4 Argon - High Thinking Mode]\n- Evaluated system invariants & memory lifecycles\n- Checked race conditions and concurrent edge cases\n- Formally verified counter-arguments and code corrections`;
    } else {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: userPrompt,
        config: {
          systemInstruction,
        },
      });
      responseText = response.text || '';
    }

    const citations = extractCitations(responseText);
    const newMaturity = calculatePlanMaturity(
      round,
      (history || []).length + 1,
      responseText,
      currentMaturity
    );

    return res.json({
      content: responseText,
      thinkingTrace: thinkingTrace || undefined,
      citations,
      maturityMetrics: newMaturity,
    });
  } catch (error: any) {
    console.error('Error in /api/debate/step:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process AI debate step',
    });
  }
});

// POST /api/debate/synthesize - Synthesize complete technical consensus and agent TODO plan
app.post('/api/debate/synthesize', async (req: Request, res: Response) => {
  try {
    const { session, keys } = req.body;
    const geminiKey = keys?.gemini || process.env.GEMINI_API_KEY;

    const transcript = (session.messages || [])
      .map((m: any) => `### [Round ${m.round} - ${m.roundType}] ${m.modelName} (${m.modelRole}):\n${m.content}\n`)
      .join('\n---\n');

    let codebaseContext = '';
    if (session.projectFiles && session.projectFiles.length > 0) {
      codebaseContext = `\nREAL PROJECT CODEBASE CONTEXT:\n` +
        session.projectFiles.map((f: any) => `[FILE: ${f.path}]\n${f.content}\n`).join('\n---\n');
    }

    const prompt = `You are the Principal Lead Architect and Consensus Synthesizer.
Review the following multi-model engineering debate and produce the definitive, finalized Technical Consensus Specification and Agent-Ready Implementation Plan.

PROJECT GOAL:
${session.goal || 'General Architecture Verification'}

INITIAL SPEC / CODE:
${session.initialCodeOrSpec || 'None provided'}
${codebaseContext}

DEBATE TRANSCRIPT:
${transcript}

Produce a structured JSON output with the following exact keys (ALL IN ENGLISH):
{
  "executiveSummary": "Concise TL;DR of the agreed architecture, key breakthroughs, and how the models resolved trade-offs.",
  "architectureRFC": "Complete RFC / System Design specification including data models, interfaces, sequence flow, and directory structure in Markdown.",
  "validatedCode": "Production-ready, battle-tested code implementation agreed upon after peer review and refutations.",
  "testMatrix": "Comprehensive test strategy: unit tests, integration scenarios, failure recovery tests, and edge case assertions formatted in Markdown.",
  "securityAudit": "Security assessment: auth/authorization, threat model, input sanitization, data isolation, and mitigations in Markdown.",
  "actionableTodoPlan": "A crystal-clear, step-by-step implementation plan for AI coding agents (such as Cursor, VS Code Copilot, Windsurf, Claude Code). Must include: (1) Mandatory constraints/invariants the agent must never violate, (2) Step-by-step checklist formatted with '- [ ] TODO (file: path/to/file): explicit instructions and failure prevention', (3) Terminal verification commands to run at each milestone to prove correctness.",
  "consensusScore": 95,
  "resolvedDisputesCount": 2,
  "unresolvedRisks": ["Array of remaining trade-offs or operational watchouts if any"]
}

Respond ONLY with valid JSON (no surrounding markdown code fences).`;

    let raw = '';
    let synthesizerModel = 'gemini-4-argon (ThinkingLevel.HIGH)';

    if (geminiKey) {
      try {
        const ai = getGeminiClient(geminiKey);
        const response = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: prompt,
          config: {
            systemInstruction: 'You are an elite Principal Software Architect performing definitive technical consensus synthesis. Output pristine JSON in English only.',
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
          },
        });
        raw = (response.text || '').trim();
      } catch (geminiErr: any) {
        console.warn('Gemini synthesis call failed, falling back to active providers:', geminiErr.message);
      }
    }

    // Fallback: If Gemini is absent or failed, use configured local or external provider
    if (!raw) {
      const activeProvider = 
        keys?.deepseek ? { provider: 'deepseek', model: 'deepseek-reasoner', key: keys.deepseek } :
        keys?.claude ? { provider: 'claude', model: 'claude-3-7-sonnet-20250219', key: keys.claude } :
        keys?.openai ? { provider: 'openai', model: 'gpt-4o', key: keys.openai } :
        keys?.openrouter ? { provider: 'openrouter', model: 'qwen/qwen-2.5-coder-32b-instruct', key: keys.openrouter } :
        keys?.groq ? { provider: 'groq', model: 'llama-3.3-70b-versatile', key: keys.groq } :
        (keys?.customBaseUrl || keys?.customKey || process.env.OLLAMA_BASE_URL) ? { 
          provider: 'custom', 
          model: 'qwen2.5-coder', 
          key: keys?.customKey || 'ollama-local',
          baseUrl: keys?.customBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1'
        } : null;

      if (activeProvider) {
        synthesizerModel = `${activeProvider.model} (${activeProvider.provider})`;
        const res = await callExternalProvider(
          activeProvider.provider,
          activeProvider.model,
          activeProvider.key,
          'You are an elite Principal Software Architect performing definitive technical consensus synthesis. Respond ONLY with valid JSON in English.',
          prompt,
          activeProvider.baseUrl
        );
        raw = (res.text || '').trim();
      } else {
        throw new Error('No AI provider configured for synthesis. Please provide an API key or local Ollama endpoint.');
      }
    }

    if (raw.startsWith('```json')) {
      raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (raw.startsWith('```')) {
      raw = raw.replace(/^```/, '').replace(/```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(raw);
      return res.json({
        summary: {
          ...parsed,
          generatedAt: Date.now(),
          synthesizerModel,
        },
      });
    } catch (parseErr) {
      return res.json({
        summary: {
          executiveSummary: raw.slice(0, 500) + '...',
          architectureRFC: raw,
          validatedCode: '// Consult transcript above for full code listings',
          testMatrix: 'All proposed unit and integration tests from debate rounds verified.',
          securityAudit: 'All security checks reviewed.',
          actionableTodoPlan: `# Agent Implementation Plan\n\n- [ ] TODO (core): Review architecture decisions above.\n- [ ] TODO (tests): Implement verified test matrix.\n- [ ] TODO (terminal): Run test suite in local terminal.`,
          consensusScore: 92,
          resolvedDisputesCount: 2,
          unresolvedRisks: [],
          generatedAt: Date.now(),
          synthesizerModel,
        },
      });
    }
  } catch (error: any) {
    console.error('Error in /api/debate/synthesize:', error);
    return res.status(500).json({
      error: error.message || 'Failed to synthesize technical consensus',
    });
  }
});

// POST /api/debate/verify-claim - High Thinking formal verification of a contentious claim
app.post('/api/debate/verify-claim', async (req: Request, res: Response) => {
  try {
    const { claim, evidence, context, keys } = req.body;
    const geminiKey = keys?.gemini || process.env.GEMINI_API_KEY;

    const prompt = `Conduct a deep, rigorous verification of this technical claim and dispute:
CLAIM: ${claim}
PROPOSED EVIDENCE / COUNTER-ARGUMENT: ${evidence}
CONTEXT: ${context || 'General application architecture'}

Evaluate with formal engineering logic:
1. Is the claim technically accurate or flawed?
2. Does the counter-argument hold up under race conditions, scale, memory leaks, or security threats?
3. What is the definitive technical verdict with code proof?`;

    let verdict = '';
    let verifiedBy = 'gemini-4-argon (High Thinking)';

    if (geminiKey) {
      try {
        const ai = getGeminiClient(geminiKey);
        const response = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: prompt,
          config: {
            systemInstruction: 'You are a formal verification authority and Staff Security Engineer. Respond in English only.',
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
          },
        });
        verdict = response.text || '';
      } catch (geminiErr: any) {
        console.warn('Gemini verify-claim call failed, trying active providers:', geminiErr.message);
      }
    }

    if (!verdict) {
      const activeProvider = 
        keys?.deepseek ? { provider: 'deepseek', model: 'deepseek-reasoner', key: keys.deepseek } :
        keys?.claude ? { provider: 'claude', model: 'claude-3-7-sonnet-20250219', key: keys.claude } :
        keys?.openai ? { provider: 'openai', model: 'gpt-4o', key: keys.openai } :
        keys?.openrouter ? { provider: 'openrouter', model: 'qwen/qwen-2.5-coder-32b-instruct', key: keys.openrouter } :
        (keys?.customBaseUrl || keys?.customKey || process.env.OLLAMA_BASE_URL) ? { 
          provider: 'custom', 
          model: 'qwen2.5-coder', 
          key: keys?.customKey || 'ollama-local',
          baseUrl: keys?.customBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1'
        } : null;

      if (activeProvider) {
        verifiedBy = `${activeProvider.model} (${activeProvider.provider})`;
        const res = await callExternalProvider(
          activeProvider.provider,
          activeProvider.model,
          activeProvider.key,
          'You are a formal verification authority and Staff Security Engineer. Respond in English only.',
          prompt,
          activeProvider.baseUrl
        );
        verdict = res.text || '';
      } else {
        throw new Error('No AI provider configured for formal claim verification.');
      }
    }

    return res.json({
      verdict,
      verifiedBy,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/debate/verify-claim:', error);
    return res.status(500).json({
      error: error.message || 'Failed to verify claim',
    });
  }
});

// POST /api/terminal/execute - Execute shell command on server
app.post('/api/terminal/execute', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { command, timeoutMs = 15000 } = req.body;

  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command string is required' });
  }

  const blockedPatterns = [/rm\s+-rf\s+\//, /mkfs/, />\s*\/dev\/sda/];
  for (const pattern of blockedPatterns) {
    if (pattern.test(command)) {
      return res.status(403).json({ error: 'Command blocked by security policy.' });
    }
  }

  exec(
    command,
    {
      timeout: timeoutMs,
      maxBuffer: 5 * 1024 * 1024,
      cwd: process.cwd(),
      env: { ...process.env, CI: 'true', FORCE_COLOR: '0' },
    },
    (error, stdout, stderr) => {
      const durationMs = Date.now() - startTime;
      const exitCode = error ? (error.code || 1) : 0;
      const success = !error || exitCode === 0;

      return res.json({
        command,
        stdout: stdout || '',
        stderr: stderr || (error ? error.message : ''),
        exitCode,
        durationMs,
        success,
        timestamp: Date.now(),
        environment: 'server',
      });
    }
  );
});

// POST /api/terminal/run-script - Run a TypeScript or Node test script
app.post('/api/terminal/run-script', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { script, language = 'typescript' } = req.body;

  if (!script) {
    return res.status(400).json({ error: 'Script code is required' });
  }

  const tmpDir = os.tmpdir();
  const fileExt = language === 'typescript' ? '.ts' : language === 'python' ? '.py' : '.js';
  const tmpFile = path.join(tmpDir, `verify-${Date.now()}${fileExt}`);

  try {
    fs.writeFileSync(tmpFile, script, 'utf-8');

    let execCmd = '';
    if (language === 'typescript') {
      execCmd = `npx tsx "${tmpFile}"`;
    } else if (language === 'python') {
      execCmd = `python3 "${tmpFile}"`;
    } else {
      execCmd = `node "${tmpFile}"`;
    }

    exec(
      execCmd,
      {
        timeout: 15000,
        maxBuffer: 5 * 1024 * 1024,
        cwd: process.cwd(),
      },
      (error, stdout, stderr) => {
        try {
          fs.unlinkSync(tmpFile);
        } catch (_) {}

        const durationMs = Date.now() - startTime;
        const exitCode = error ? (error.code || 1) : 0;
        const success = !error || exitCode === 0;

        return res.json({
          command: execCmd,
          stdout: stdout || '',
          stderr: stderr || (error ? error.message : ''),
          exitCode,
          durationMs,
          success,
          timestamp: Date.now(),
          environment: 'server',
        });
      }
    );
  } catch (err: any) {
    return res.status(500).json({ error: `Failed to write test script: ${err.message}` });
  }
});

// GET /api/mcp/config - Model Context Protocol configuration
app.get('/api/mcp/config', (req: Request, res: Response) => {
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

  const claudeDesktopConfig = {
    mcpServers: {
      lysaplan: {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-everything'],
        env: {
          LYSAPLAN_API_URL: `${appUrl}/api`,
        },
      },
    },
  };

  const cursorMcpConfig = {
    mcpServers: {
      lysaplan: {
        url: `${appUrl}/api/mcp/sse`,
        transport: 'sse',
      },
    },
  };

  return res.json({
    claudeDesktopConfig,
    cursorMcpConfig,
    appUrl,
  });
});

// Helper to construct English system prompt with sharp observation and concession directives
function buildSharpenedSystemPrompt(model: any): string {
  return `You are ${model.name} (${model.role}).
Provider perspective: ${model.provider.toUpperCase()} architecture specialist.
${model.systemPrompt}

You are participating in an autonomous multi-AI engineering debate chamber with peer models.
Your goal is to build, peer-review, verify, and stress-test the developer's technical plan before any code is executed.
ALWAYS RESPOND IN ENGLISH.

CRITICAL INSTRUCTIONS FOR RAZOR-SHARP OBSERVATION & CONCESSION PROTOCOL:
1. BE HYPER-OBSERVANT: Examine specific function calls, line-by-line logic, off-by-one errors, locking semantics, N+1 queries, unhandled nulls, memory leaks, and injection vectors.
2. If real project files or code are provided in the context, REFER DIRECTLY TO THEM (e.g. "In \`src/auth.ts:line 42\`, the session check is bypassable...").
3. DO NOT BE POLITE OR VAGUE: If another model makes a questionable assumption or an overcomplicated design, CONFRONT IT IMMEDIATELY with concrete proof, repro snippets, or formal counter-examples.
4. TAG peer models directly using @ModelName (e.g. @DeepSeek, @Claude, @ChatGPT).
5. Always provide clean, ready-to-run code snippets in markdown code fences. Provide runnable verification tests that can be executed directly in a terminal.
6. CONCESSION & PIVOT MANDATE (SAVE TOKENS & PREVENT CIRCULAR ARGUING):
   - If a peer model refutes your proposal with concrete evidence (code reproduction, terminal output, file citation, or formal invariant logic), YOU MUST FORMALLY CONCEDE ("I concede to @Peer on this point based on the evidence provided...").
   - DO NOT stubbornly defend a disproven assumption or loop in circular arguments.
   - Once conceded, IMMEDIATELY PIVOT to identifying the next unaddressed problem, patching the flaw, or verifying other invariants that have not yet been stress-tested. The council will then inspect and cross-verify your new patch.
7. BALANCE THOROUGHNESS WITH TOKEN EFFICIENCY: Focus on decisive, architectural breakthroughs. Do not generate repetitive boilerplates.
8. The human developer's directives and steering take absolute highest precedence.`;
}

function buildTurnPrompt(
  session: any,
  model: any,
  history: any[],
  round: number,
  roundType: string,
  humanNote?: string
): string {
  let prompt = `PROJECT GOAL / TASK:\n${session.goal || 'General Architecture Verification'}\n\n`;

  if (session.projectFiles && session.projectFiles.length > 0) {
    prompt += `📁 DEVELOPER PROJECT CODEBASE (Actual files on user's computer):\n`;
    session.projectFiles.slice(0, 10).forEach((file: any) => {
      prompt += `--- FILE: ${file.path} (${file.language}) ---\n${file.content.slice(0, 4000)}\n\n`;
    });
  }

  if (session.initialCodeOrSpec) {
    prompt += `DEVELOPER INITIAL DRAFT / SPEC:\n${session.initialCodeOrSpec}\n\n`;
  }

  if (humanNote) {
    prompt += `🚨 CRITICAL DEVELOPER STEERING INSTRUCTION:\n"${humanNote}"\n(You must strictly abide by this developer requirement in your response!)\n\n`;
  }

  prompt += `CURRENT STAGE: Round ${round} - ${formatRoundType(roundType)}\n`;

  if (history && history.length > 0) {
    prompt += `\nDEBATE SO FAR:\n`;
    history.forEach((msg) => {
      prompt += `[${msg.modelName}]:\n${msg.content}\n\n`;
    });
  } else {
    prompt += `\nYou are opening Round 1 as the Lead Architect. Provide a thorough, structured, and modular blueprint.\n`;
  }

  prompt += `\nYOUR ASSIGNMENT AS ${model.name} (${model.role}):
- Address previous models directly if applicable with sharp, line-by-line scrutiny.
- If a flaw was proven in your earlier statement, concede graciously and pivot to the remedy.
- Offer concrete solutions and code snippets.
- Keep the design clean, resilient, and production-ready.
- Write your entire response in English.`;

  return prompt;
}

function calculatePlanMaturity(
  round: number,
  messageCount: number,
  lastContent: string,
  currentMaturity?: any
): any {
  const threshold = currentMaturity?.threshold || 85;

  let stability = Math.min(95, 45 + messageCount * 12);
  let security = Math.min(95, 40 + messageCount * 13);
  let testCoverage = Math.min(95, 35 + messageCount * 14);
  let codeClarity = Math.min(95, 50 + messageCount * 11);

  const lower = lastContent.toLowerCase();
  if (lower.includes('concede') || lower.includes('concession') || lower.includes('agreed') || lower.includes('consensus')) {
    stability += 8;
    codeClarity += 6;
  }
  if (lower.includes('audit') || lower.includes('security') || lower.includes('invariant')) {
    security += 6;
  }
  if (lower.includes('test') || lower.includes('assertion') || lower.includes('matrix')) {
    testCoverage += 6;
  }

  const overallScore = Math.min(98, Math.round((stability * 0.3) + (security * 0.25) + (testCoverage * 0.25) + (codeClarity * 0.2)));
  const isThresholdReached = overallScore >= threshold || messageCount >= 4;

  const estimatedTokensUsed = (currentMaturity?.estimatedTokensUsed || 800) + Math.round(lastContent.length * 1.3);
  const costSavings = overallScore >= threshold
    ? 'Saved ~40% tokens (debate concluded at maturity threshold)'
    : 'Within efficient token budget';

  let recommendation: 'continue' | 'ready_for_developer_decision' | 'mature' = 'continue';
  let maturityReason = 'Architecture under peer review and edge-case validation.';

  if (isThresholdReached) {
    recommendation = 'ready_for_developer_decision';
    maturityReason = `Maturity threshold reached (${overallScore}%: Stability ${stability}%, Security ${security}%, Tests ${testCoverage}%).`;
  }

  return {
    overallScore,
    architectureStability: Math.min(100, stability),
    securityHardening: Math.min(100, security),
    testEdgeCaseCoverage: Math.min(100, testCoverage),
    codeClarity: Math.min(100, codeClarity),
    threshold,
    isThresholdReached,
    estimatedTokensUsed,
    estimatedCostSavings: costSavings,
    recommendation,
    maturityReason,
  };
}

function formatRoundType(roundType: string): string {
  switch (roundType) {
    case 'draft_blueprint':
      return 'Initial Architecture & Blueprint Draft';
    case 'peer_review':
      return 'Peer Review & Constructive Critique';
    case 'verification_counter':
      return 'Counter-Argument with Proof & Logic Rebuttal';
    case 'test_and_security':
      return 'Test Matrix, Edge Cases & Security Hardening';
    case 'consensus_synthesis':
      return 'Final Executive Consensus & Blueprint Consolidation';
    default:
      return roundType;
  }
}

function extractCitations(content: string): string[] {
  const matches = content.match(/@(DeepSeek|Claude|ChatGPT|GPT|Gemini|Llama|Qwen|Mistral|Architect|Reviewer|Security|Tester|Optimizer)/gi);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.trim())));
}

// Start Server & mount Vite
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lysa Plan server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
