import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Sparkles, 
  Send, 
  Compass 
} from 'lucide-react';
import { DebateSession } from '../types';

interface HumanSteeringBarProps {
  session: DebateSession;
  isDebating: boolean;
  onNextStep: (humanNote?: string) => void;
  onToggleAutoRun: () => void;
  onSynthesize: () => void;
  isSynthesizing: boolean;
}

export const HumanSteeringBar: React.FC<HumanSteeringBarProps> = ({
  session,
  isDebating,
  onNextStep,
  onToggleAutoRun,
  onSynthesize,
  isSynthesizing,
}) => {
  const [developerNote, setDeveloperNote] = useState('');

  const handleSendGuidance = () => {
    if (!developerNote.trim()) return;
    onNextStep(developerNote.trim());
    setDeveloperNote('');
  };

  return (
    <div className="bg-zinc-950 border-t border-zinc-850 px-4 py-2.5 backdrop-blur-md sticky bottom-0 z-30 flex-shrink-0">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
        
        {/* Developer Directive Input */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-zinc-500">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <input
            type="text"
            value={developerNote}
            onChange={(e) => setDeveloperNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendGuidance();
            }}
            placeholder="Steer debate or inject constraints (e.g., 'Ensure sub-50ms p99 and idempotent retry logic')..."
            className="w-full bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-xs pl-8 pr-20 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-cyan-500 transition"
          />
          {developerNote.trim() && (
            <button
              onClick={handleSendGuidance}
              disabled={isDebating}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>Send</span>
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 justify-end flex-shrink-0">
          
          {/* Auto-Run Toggle */}
          <button
            onClick={onToggleAutoRun}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              isDebating
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border border-zinc-700/80'
            }`}
          >
            {isDebating ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-cyan-400" />
                <span>Auto-Debate</span>
              </>
            )}
          </button>

          {/* 1 Step */}
          <button
            onClick={() => onNextStep()}
            disabled={isDebating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 text-xs font-medium transition disabled:opacity-50 cursor-pointer"
            title="Execute 1 model turn"
          >
            <SkipForward className="w-3 h-3" />
            <span className="hidden sm:inline">1 Step</span>
          </button>

          {/* Synthesize Consensus */}
          <button
            onClick={onSynthesize}
            disabled={isSynthesizing || session.messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition shadow-xs disabled:opacity-40 cursor-pointer"
            title="Synthesize definitive consensus specification"
          >
            <Sparkles className="w-3 h-3" />
            <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize RFC'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
