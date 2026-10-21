import React, { useState, useEffect } from 'react';
import { Key, Shield, Check, X, ExternalLink, Sparkles, Eye, EyeOff, Server, Globe, AlertCircle } from 'lucide-react';
import { UserApiKeys } from '../types';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: UserApiKeys;
  onSaveKeys: (keys: UserApiKeys) => void;
  isInitialSetup?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  onSaveKeys,
  isInitialSetup = false,
}) => {
  const [keys, setKeys] = useState<UserApiKeys>(apiKeys);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeys(apiKeys);
    }
  }, [isOpen, apiKeys]);

  if (!isOpen) return null;

  const toggleShow = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKeys(keys);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-xs max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm">
                API Keys & Dynamic Providers
              </h3>
              <p className="text-[11px] text-zinc-400">
                Only models with an active API key will appear in your debate council.
              </p>
            </div>
          </div>

          {!isInitialSetup && (
            <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Initial Setup Welcome Banner */}
        {isInitialSetup && (
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 flex items-start gap-2.5 flex-shrink-0">
            <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="font-semibold text-xs text-cyan-100">Welcome to Lysa Plan!</div>
              <p className="text-[11px] text-cyan-300/90 leading-relaxed">
                No active model API key was detected. Please configure at least one API key below (DeepSeek, Claude, ChatGPT, OpenRouter, Groq) or connect your local Ollama endpoint (<code className="bg-cyan-900/50 px-1 py-0.5 rounded font-mono">http://localhost:11434/v1</code>).
              </p>
              <p className="text-[10px] text-cyan-400 font-medium">
                👉 Once saved, your New Architecture Plan will open automatically to start!
              </p>
            </div>
          </div>
        )}

        {/* Scrollable Form */}
        <form id="api-keys-form" onSubmit={handleSave} className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          
          {/* DeepSeek */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-200 font-medium">DeepSeek API Key:</label>
              <a
                href="https://platform.deepseek.com/"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-cyan-400 flex items-center gap-1 text-[10px]"
              >
                <span>Get Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKeys['deepseek'] ? 'text' : 'password'}
                value={keys.deepseek || ''}
                onChange={(e) => setKeys({ ...keys, deepseek: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => toggleShow('deepseek')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showKeys['deepseek'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Anthropic Claude */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-200 font-medium">Anthropic Claude API Key:</label>
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-cyan-400 flex items-center gap-1 text-[10px]"
              >
                <span>Get Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKeys['claude'] ? 'text' : 'password'}
                value={keys.claude || ''}
                onChange={(e) => setKeys({ ...keys, claude: e.target.value })}
                placeholder="sk-ant-..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => toggleShow('claude')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showKeys['claude'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* OpenAI ChatGPT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-200 font-medium">OpenAI (ChatGPT) API Key:</label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-cyan-400 flex items-center gap-1 text-[10px]"
              >
                <span>Get Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKeys['openai'] ? 'text' : 'password'}
                value={keys.openai || ''}
                onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                placeholder="sk-..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => toggleShow('openai')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showKeys['openai'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* OpenRouter (Provides 200+ models: Llama, Qwen, Mistral, Command R+) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-200 font-medium flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>OpenRouter API Key (Llama, Qwen, Mistral):</span>
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-cyan-400 flex items-center gap-1 text-[10px]"
              >
                <span>openrouter.ai</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKeys['openrouter'] ? 'text' : 'password'}
                value={keys.openrouter || ''}
                onChange={(e) => setKeys({ ...keys, openrouter: e.target.value })}
                placeholder="sk-or-v1-..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => toggleShow('openrouter')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showKeys['openrouter'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Groq Key (Fast Llama / Mixtral) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-200 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Groq API Key (Fast Inference):</span>
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-cyan-400 flex items-center gap-1 text-[10px]"
              >
                <span>groq.com</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showKeys['groq'] ? 'text' : 'password'}
                value={keys.groq || ''}
                onChange={(e) => setKeys({ ...keys, groq: e.target.value })}
                placeholder="gsk_..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => toggleShow('groq')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showKeys['groq'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Custom OpenAI-Compatible Base URL & Key (Ollama / Local / vLLM / LM Studio) */}
          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>Custom OpenAI-Compatible Endpoint (Ollama / vLLM / Local):</span>
            </div>
            <input
              type="text"
              value={keys.customBaseUrl || ''}
              onChange={(e) => setKeys({ ...keys, customBaseUrl: e.target.value })}
              placeholder="Base URL: e.g. http://localhost:11434/v1 or https://api.together.xyz/v1"
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <input
              type={showKeys['customKey'] ? 'text' : 'password'}
              value={keys.customKey || ''}
              onChange={(e) => setKeys({ ...keys, customKey: e.target.value })}
              placeholder="Custom Key (if required by endpoint, or leave blank for Ollama)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Optional Gemini */}
          <div>
            <label className="text-zinc-400 block mb-1">Optional Google Gemini Key (if desired):</label>
            <input
              type={showKeys['gemini'] ? 'text' : 'password'}
              value={keys.gemini || ''}
              onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
              placeholder="Optional Gemini key..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-cyan-500 font-mono text-xs"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-500" />
            Stored safely in browser localStorage
          </span>

          <div className="flex items-center gap-2">
            {!isInitialSetup && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white"
              >
                Close
              </button>
            )}
            <button
              form="api-keys-form"
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : (isInitialSetup ? <Sparkles className="w-3.5 h-3.5 text-cyan-200" /> : <Key className="w-3.5 h-3.5" />)}
              <span>{savedSuccess ? 'Saved' : (isInitialSetup ? 'Save & Start Planning' : 'Save Keys')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
