import React from 'react';
import { ModelConfig, UserApiKeys } from '../types';
import { isModelConfiguredAndActive } from '../utils/defaultModels';
import { 
  Bot, 
  BrainCircuit, 
  ShieldCheck, 
  Code, 
  CheckCircle2, 
  Zap, 
  Users, 
  Key,
  Sliders,
  Plus
} from 'lucide-react';

interface ModelBarProps {
  models: ModelConfig[];
  apiKeys: UserApiKeys;
  activeModelId?: string;
  isDebating: boolean;
  onOpenModelConfig: () => void;
  onOpenApiKeys: () => void;
  onToggleModel: (modelId: string) => void;
  onSelectModelPreset: (count: number) => void;
}

export const ModelBar: React.FC<ModelBarProps> = ({
  models,
  apiKeys,
  activeModelId,
  isDebating,
  onOpenModelConfig,
  onOpenApiKeys,
  onToggleModel,
  onSelectModelPreset,
}) => {
  const getIcon = (iconName: string) => {
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

  // ONLY display models that have an active API key or are configured and active
  const activeModels = models.filter((m) => isModelConfiguredAndActive(m, apiKeys));

  return (
    <div className="bg-zinc-950 border-b border-zinc-850 px-4 py-1.5 flex-shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto scrollbar-none text-xs">
        
        {/* If no API keys are active yet */}
        {activeModels.length === 0 ? (
          <div className="flex items-center justify-between w-full py-0.5">
            <div className="flex items-center gap-2 text-zinc-400">
              <Key className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
              <span className="text-[11px]">
                No model API keys active yet. Add your DeepSeek, Claude, ChatGPT, OpenRouter, or Custom API key to activate the council.
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onOpenApiKeys}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition cursor-pointer"
              >
                <Key className="w-3 h-3" />
                <span>Configure Keys</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Left: Active Council info */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                <Users className="w-3 h-3 text-cyan-400" />
                <span>Active Council ({activeModels.length}):</span>
              </div>
            </div>

            {/* Right: Only the models with active API keys */}
            <div className="flex items-center gap-1.5 min-w-max">
              {activeModels.map((model) => {
                const isActive = activeModelId === model.id && isDebating;

                return (
                  <button
                    key={model.id}
                    onClick={() => onToggleModel(model.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-zinc-850 border-cyan-500 text-zinc-100 shadow-xs'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                    title={`${model.name} (${model.role}) · Click to toggle`}
                  >
                    {getIcon(model.iconName)}
                    <span className="font-medium truncate max-w-[130px]">{model.name}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive
                          ? 'bg-cyan-400 animate-ping'
                          : 'bg-emerald-400'
                      }`}
                    />
                  </button>
                );
              })}

              <button
                onClick={onOpenModelConfig}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-[11px] transition cursor-pointer"
                title="Configure model roles or add custom models"
              >
                <Sliders className="w-3 h-3 text-zinc-400" />
                <span>Manage</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
