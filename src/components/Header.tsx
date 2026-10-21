import React from 'react';
import { 
  Cpu, 
  MessageSquareCode, 
  FileText, 
  ShieldCheck, 
  Key, 
  Plus, 
  Sliders, 
  CheckCircle, 
  ChevronDown,
  Terminal as TerminalIcon
} from 'lucide-react';
import { DebateSession } from '../types';

interface HeaderProps {
  sessions: DebateSession[];
  activeSession: DebateSession;
  onSelectSession: (session: DebateSession) => void;
  onOpenNewDebate: () => void;
  onOpenModelConfig: () => void;
  onOpenApiKeys: () => void;
  activeTab: 'chamber' | 'terminal' | 'summary' | 'disputes';
  onChangeTab: (tab: 'chamber' | 'terminal' | 'summary' | 'disputes') => void;
}

export const Header: React.FC<HeaderProps> = ({
  sessions,
  activeSession,
  onSelectSession,
  onOpenNewDebate,
  onOpenModelConfig,
  onOpenApiKeys,
  activeTab,
  onChangeTab,
}) => {
  const consensusScore = activeSession.summary?.consensusScore || (activeSession.messages.length > 0 ? 80 : 0);

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 flex-shrink-0">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Branding & Session Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-100">Lysa Plan</span>
          </div>

          <a
            href="https://abedputra.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-zinc-400 hover:text-cyan-300 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition"
            title="Conceived & created by Abed Putra (abedputra@gmail.com)"
          >
            <span className="text-zinc-500">by</span>
            <span className="text-zinc-200 font-medium hover:underline">Abed Putra</span>
          </a>

          <div className="h-4 w-px bg-zinc-800 mx-0.5 hidden sm:block" />

          {/* Session Switcher */}
          <div className="relative group">
            <select
              value={activeSession.id}
              onChange={(e) => {
                const s = sessions.find((item) => item.id === e.target.value);
                if (s) onSelectSession(s);
              }}
              className="appearance-none bg-zinc-900 hover:bg-zinc-850 text-zinc-200 text-xs font-medium pl-2.5 pr-7 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-zinc-600 cursor-pointer max-w-[180px] md:max-w-[240px] truncate"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* New Plan Button */}
          <button
            onClick={onOpenNewDebate}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/70 transition cursor-pointer"
            title="Create new architecture plan"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">New Plan</span>
          </button>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center p-0.5 bg-zinc-900 rounded-lg border border-zinc-800 text-xs font-medium">
          <button
            onClick={() => onChangeTab('chamber')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer ${
              activeTab === 'chamber'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquareCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Debate ({activeSession.messages.length})</span>
          </button>

          <button
            onClick={() => onChangeTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer ${
              activeTab === 'terminal'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => onChangeTab('summary')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer relative ${
              activeTab === 'summary'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>RFC & Code</span>
            {activeSession.summary && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            )}
          </button>

          <button
            onClick={() => onChangeTab('disputes')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer ${
              activeTab === 'disputes'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Disputes ({activeSession.disputes.length})</span>
          </button>
        </nav>

        {/* Right: Actions & Indicators */}
        <div className="flex items-center gap-2">
          {activeSession.messages.length > 0 && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-emerald-400 text-xs font-mono">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              <span>Consensus: {consensusScore}%</span>
            </div>
          )}

          <button
            onClick={onOpenModelConfig}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-800 transition cursor-pointer"
            title="Configure AI Models & Roles"
          >
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Models</span>
          </button>

          <button
            onClick={onOpenApiKeys}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-800 transition cursor-pointer"
            title="API Keys & Providers"
          >
            <Key className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Keys</span>
          </button>
        </div>
      </div>
    </header>
  );
};
