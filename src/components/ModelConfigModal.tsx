import React, { useState } from 'react';
import { Sliders, X, Check, Sparkles, Plus, Trash2, Bot, BrainCircuit, Code, ShieldCheck } from 'lucide-react';
import { ModelConfig, ModelProvider } from '../types';

interface ModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelConfig[];
  onSaveModels: (models: ModelConfig[]) => void;
}

export const ModelConfigModal: React.FC<ModelConfigModalProps> = ({
  isOpen,
  onClose,
  models,
  onSaveModels,
}) => {
  const [currentModels, setCurrentModels] = useState<ModelConfig[]>(models);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  if (!isOpen) return null;

  const handleUpdateCurrent = (field: keyof ModelConfig, value: any) => {
    const updated = [...currentModels];
    updated[selectedIdx] = {
      ...updated[selectedIdx],
      [field]: value,
    };
    setCurrentModels(updated);
  };

  const handleToggleEnabled = (idx: number) => {
    const updated = [...currentModels];
    updated[idx] = {
      ...updated[idx],
      enabled: !updated[idx].enabled,
    };
    setCurrentModels(updated);
  };

  const handleAddModel = () => {
    if (currentModels.length >= 5) return;
    const newModel: ModelConfig = {
      id: `custom-model-${Date.now()}`,
      name: 'Custom Reviewer',
      provider: 'openrouter',
      modelIdentifier: 'qwen/qwen-2.5-coder-32b-instruct',
      role: 'Performance & Edge-Case Specialist',
      avatarColor: 'from-violet-600 to-purple-600',
      iconName: 'Code',
      systemPrompt: 'You are an Implementation and Edge-Case Specialist with razor-sharp analytical scrutiny. Review code, find failure modes, provide reproducible counter-proofs, and concede immediately if proven wrong.',
      enabled: true,
      useHighThinking: false,
    };
    setCurrentModels([...currentModels, newModel]);
    setSelectedIdx(currentModels.length);
  };

  const handleDeleteModel = (idx: number) => {
    if (currentModels.length <= 1) return;
    const updated = currentModels.filter((_, i) => i !== idx);
    setCurrentModels(updated);
    setSelectedIdx(Math.max(0, idx - 1));
  };

  const handleSave = () => {
    onSaveModels(currentModels);
    onClose();
  };

  const selectedModel = currentModels[selectedIdx] || currentModels[0];

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full p-5 shadow-2xl flex flex-col max-h-[85vh] text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm">
                AI Council & Dynamic Model Roles
              </h3>
              <p className="text-[11px] text-zinc-400">
                Configure roles, model endpoints, and sharp observation prompts (Max 5 models)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-zinc-500 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Split layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-3 flex-1 overflow-y-auto pr-1 scrollbar-thin">
          
          {/* Left: Model List */}
          <div className="space-y-1.5 border-r border-zinc-800 pr-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-500">
                Council ({currentModels.length}/5):
              </span>
              {currentModels.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddModel}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 text-[10px] font-medium cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Model</span>
                </button>
              )}
            </div>

            {currentModels.map((m, idx) => (
              <div
                key={m.id}
                onClick={() => setSelectedIdx(idx)}
                className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-between gap-1.5 ${
                  selectedIdx === idx
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                    : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-800 text-zinc-400'
                }`}
              >
                <div className="min-w-0">
                  <span className="font-semibold block truncate text-[11px]">
                    {m.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 block truncate">
                    {m.role}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={m.enabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleEnabled(idx);
                    }}
                    className="rounded border-zinc-700 text-cyan-500 focus:ring-0 cursor-pointer"
                    title="Enable or disable model slot"
                  />
                  {currentModels.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModel(idx);
                      }}
                      className="p-1 text-zinc-600 hover:text-rose-400"
                      title="Remove model slot"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right: Model Editor */}
          {selectedModel && (
            <div className="sm:col-span-2 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-300 block mb-1">Display Name:</label>
                  <input
                    type="text"
                    value={selectedModel.name}
                    onChange={(e) => handleUpdateCurrent('name', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-1.5 text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 block mb-1">Provider Engine:</label>
                  <select
                    value={selectedModel.provider}
                    onChange={(e) => handleUpdateCurrent('provider', e.target.value as ModelProvider)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-1.5 text-zinc-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="deepseek">DeepSeek API</option>
                    <option value="claude">Anthropic Claude</option>
                    <option value="chatgpt">OpenAI (ChatGPT)</option>
                    <option value="openrouter">OpenRouter (200+ Models)</option>
                    <option value="groq">Groq (Fast Llama)</option>
                    <option value="custom">Custom Endpoint (Ollama / Local)</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">
                  Model Identifier (API model name):
                </label>
                <input
                  type="text"
                  value={selectedModel.modelIdentifier}
                  onChange={(e) => handleUpdateCurrent('modelIdentifier', e.target.value)}
                  placeholder="e.g. deepseek-reasoner, claude-3-7-sonnet-20250219, gpt-4o, qwen/qwen-2.5-coder-32b"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-1.5 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">Specialized Council Role:</label>
                <input
                  type="text"
                  value={selectedModel.role}
                  onChange={(e) => handleUpdateCurrent('role', e.target.value)}
                  placeholder="e.g. Lead System Architect, Ruthless Code Critic, Concurrency Specialist"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-1.5 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Optional Custom Base URL and Key for this specific model */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                <div>
                  <label className="text-zinc-400 block mb-0.5 text-[10px]">Model-Specific Base URL (Optional):</label>
                  <input
                    type="text"
                    value={selectedModel.customBaseUrl || ''}
                    onChange={(e) => handleUpdateCurrent('customBaseUrl', e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 font-mono text-[11px] text-zinc-300"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-0.5 text-[10px]">Model-Specific Key (Optional):</label>
                  <input
                    type="password"
                    value={selectedModel.customApiKey || ''}
                    onChange={(e) => handleUpdateCurrent('customApiKey', e.target.value)}
                    placeholder="Leave blank to use provider key"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-1 font-mono text-[11px] text-zinc-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 block mb-1">
                  System Perspective & Scrutiny Directive:
                </label>
                <textarea
                  value={selectedModel.systemPrompt}
                  onChange={(e) => handleUpdateCurrent('systemPrompt', e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-zinc-300 focus:outline-none focus:border-cyan-500 text-xs leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] text-zinc-500">
            Changes take effect immediately on next debate step.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Council</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
