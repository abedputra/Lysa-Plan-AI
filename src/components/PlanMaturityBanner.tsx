import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  Coins, 
  Sliders, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { PlanMaturityMetrics } from '../types';

interface PlanMaturityBannerProps {
  metrics?: PlanMaturityMetrics;
  onSynthesize: () => void;
  onContinueOneRound: () => void;
  onUpdateThreshold: (threshold: number) => void;
  isSynthesizing: boolean;
}

export const PlanMaturityBanner: React.FC<PlanMaturityBannerProps> = ({
  metrics,
  onSynthesize,
  onContinueOneRound,
  onUpdateThreshold,
  isSynthesizing,
}) => {
  const [showConfig, setShowConfig] = useState(false);

  if (!metrics || metrics.overallScore === 0) return null;

  const threshold = metrics.threshold || 85;
  const isReached = metrics.isThresholdReached;

  return (
    <div
      className={`rounded-lg px-3 py-2 border transition-all text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 ${
        isReached
          ? 'bg-emerald-950/25 border-emerald-700/60 text-emerald-200'
          : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-300'
      }`}
    >
      {/* Metric Stats & Progress */}
      <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isReached ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          ) : (
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          )}
          <span className="font-semibold text-zinc-100">
            Maturity: <span className="font-mono text-cyan-300">{metrics.overallScore}%</span>
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            / {threshold}% threshold
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-20 sm:w-28 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0">
          <div
            className={`h-full transition-all duration-500 ${
              isReached ? 'bg-emerald-400' : 'bg-cyan-400'
            }`}
            style={{ width: `${Math.min(100, (metrics.overallScore / threshold) * 100)}%` }}
          />
        </div>

        <div className="h-3 w-px bg-zinc-800 hidden sm:block" />

        <div className="flex items-center gap-1 text-[11px] text-zinc-400">
          <Coins className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <span className="font-mono">~{metrics.estimatedTokensUsed.toLocaleString()} tokens</span>
          <span className="text-[10px] text-zinc-500 hidden lg:inline">({metrics.estimatedCostSavings})</span>
        </div>
      </div>

      {/* Threshold Reached Alert & Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 self-end md:self-auto">
        {isReached ? (
          <>
            <button
              onClick={onSynthesize}
              disabled={isSynthesizing}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50"
              title="Synthesize final technical consensus specification"
            >
              <Sparkles className="w-3 h-3 text-emerald-200" />
              <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize Consensus'}</span>
            </button>

            <button
              onClick={onContinueOneRound}
              className="flex items-center gap-0.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition cursor-pointer"
              title="Add 1 additional round of verification"
            >
              <span>+1 Round</span>
              <ChevronRight className="w-3 h-3 text-zinc-400" />
            </button>
          </>
        ) : (
          <button
            onClick={onSynthesize}
            disabled={isSynthesizing}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition cursor-pointer"
            title="Synthesize RFC now"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Synthesize RFC</span>
          </button>
        )}

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-pointer"
          title="Adjust threshold"
        >
          <Sliders className="w-3 h-3" />
        </button>
      </div>

      {/* Threshold Config Dropdown */}
      {showConfig && (
        <div className="w-full pt-2 mt-1 border-t border-zinc-800 flex items-center justify-between gap-3 text-[11px] text-zinc-400">
          <span>Target Maturity Threshold:</span>
          <div className="flex items-center gap-2">
            {[75, 85, 90, 95].map((val) => (
              <button
                key={val}
                onClick={() => {
                  onUpdateThreshold(val);
                  setShowConfig(false);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                  threshold === val
                    ? 'bg-cyan-500 text-white font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
