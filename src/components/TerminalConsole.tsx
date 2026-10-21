import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  Cpu, 
  Laptop, 
  Share2 
} from 'lucide-react';
import { TerminalExecutionResult } from '../types';
import { executeTerminalCommand, executeTerminalScript, fetchMcpConfig } from '../services/api';

interface TerminalConsoleProps {
  sessionLogs?: TerminalExecutionResult[];
  onAddLog: (log: TerminalExecutionResult) => void;
  onClearLogs: () => void;
  pendingCodeToRun?: { code: string; language: string; title?: string } | null;
  onClearPendingCode?: () => void;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  sessionLogs = [],
  onAddLog,
  onClearLogs,
  pendingCodeToRun,
  onClearPendingCode,
}) => {
  const [commandInput, setCommandInput] = useState('npm run lint');
  const [scriptInput, setScriptInput] = useState('');
  const [scriptLang, setScriptLang] = useState<'typescript' | 'javascript' | 'python'>('typescript');
  const [mode, setMode] = useState<'command' | 'script' | 'mcp'>('command');
  const [isRunning, setIsRunning] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mcpConfigData, setMcpConfigData] = useState<any>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingCodeToRun) {
      setMode('script');
      setScriptInput(pendingCodeToRun.code);
      if (pendingCodeToRun.language.includes('py')) {
        setScriptLang('python');
      } else {
        setScriptLang('typescript');
      }
      if (onClearPendingCode) onClearPendingCode();
    }
  }, [pendingCodeToRun]);

  useEffect(() => {
    fetchMcpConfig().then(setMcpConfigData).catch(() => {});
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionLogs.length]);

  const handleRunCommand = async (cmdToRun?: string) => {
    const cmd = cmdToRun || commandInput.trim();
    if (!cmd || isRunning) return;

    try {
      setIsRunning(true);
      const result = await executeTerminalCommand(cmd);
      onAddLog(result);
      setIsRunning(false);
    } catch (err: any) {
      setIsRunning(false);
      onAddLog({
        command: cmd,
        stdout: '',
        stderr: err.message || 'Execution error',
        exitCode: 1,
        durationMs: 0,
        timestamp: Date.now(),
        success: false,
        environment: 'server',
      });
    }
  };

  const handleRunScript = async () => {
    if (!scriptInput.trim() || isRunning) return;

    try {
      setIsRunning(true);
      const result = await executeTerminalScript(scriptInput.trim(), scriptLang);
      onAddLog(result);
      setIsRunning(false);
    } catch (err: any) {
      setIsRunning(false);
      onAddLog({
        command: `run-${scriptLang}-script`,
        stdout: '',
        stderr: err.message || 'Execution error',
        exitCode: 1,
        durationMs: 0,
        timestamp: Date.now(),
        success: false,
        environment: 'server',
      });
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const quickCommands = [
    { label: 'TypeCheck (tsc)', cmd: 'npm run lint' },
    { label: 'Node Version & Platform', cmd: 'node -e "console.log({ node: process.version, platform: process.platform, arch: process.arch })"' },
    { label: 'Installed Packages', cmd: 'npm list --depth=0' },
    { label: 'Project File Tree', cmd: 'ls -lah' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-zinc-950 text-zinc-100 overflow-hidden text-xs">
      
      {/* Top Console Bar */}
      <div className="border-b border-zinc-850 bg-zinc-950 px-4 py-2 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-200">Terminal & Execution Engine</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            Server & MCP Local
          </span>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-md border border-zinc-800 text-[11px]">
          <button
            onClick={() => setMode('command')}
            className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
              mode === 'command'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Shell Command
          </button>
          <button
            onClick={() => setMode('script')}
            className={`px-2.5 py-1 rounded transition cursor-pointer font-medium ${
              mode === 'script'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Run Script / Test
          </button>
          <button
            onClick={() => setMode('mcp')}
            className={`px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 font-medium ${
              mode === 'mcp'
                ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Share2 className="w-3 h-3 text-amber-400" />
            <span>MCP Config</span>
          </button>
        </div>
      </div>

      {/* Main Console Split View */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* MCP Tab Content */}
        {mode === 'mcp' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-3xl mx-auto scrollbar-thin text-xs">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                <h4 className="font-semibold text-zinc-100">
                  Model Context Protocol (MCP) Integration
                </h4>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                Connect your local Claude Desktop, Cursor, or Windsurf IDE to Lysa Plan so models can run commands and read files on your local machine.
              </p>
            </div>

            {/* Claude Desktop Config */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Claude Desktop Config (`claude_desktop_config.json`):</span>
                </span>
                <button
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(mcpConfigData?.claudeDesktopConfig || {}, null, 2),
                      'claude_mcp'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'claude_mcp' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'claude_mcp' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-cyan-300 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(mcpConfigData?.claudeDesktopConfig || {}, null, 2)}
              </pre>
            </div>

            {/* Cursor IDE Config */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Cursor / Windsurf Config (`.cursor/mcp.json`):</span>
                </span>
                <button
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(mcpConfigData?.cursorMcpConfig || {}, null, 2),
                      'cursor_mcp'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'cursor_mcp' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'cursor_mcp' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-purple-300 font-mono text-[11px] overflow-x-auto">
                {JSON.stringify(mcpConfigData?.cursorMcpConfig || {}, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* Input Controls */}
            <div className="p-3 bg-zinc-900/60 border-b border-zinc-850 space-y-2.5">
              
              {/* Quick Command Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] scrollbar-none">
                <span className="text-zinc-500 font-medium mr-1">Quick:</span>
                {quickCommands.map((qc, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => {
                      setCommandInput(qc.cmd);
                      handleRunCommand(qc.cmd);
                    }}
                    className="px-2 py-0.5 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 whitespace-nowrap transition cursor-pointer"
                  >
                    {qc.label}
                  </button>
                ))}
              </div>

              {/* Mode Input */}
              {mode === 'command' ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-cyan-400 font-bold text-xs">
                      $
                    </span>
                    <input
                      type="text"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRunCommand();
                      }}
                      placeholder="Enter command (e.g., npm test, npx tsx test.ts, git status)..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 font-mono text-xs text-zinc-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <button
                    onClick={() => handleRunCommand()}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isRunning ? 'Running...' : 'Execute'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Write or paste verification script:</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={scriptLang}
                        onChange={(e) => setScriptLang(e.target.value as any)}
                        className="bg-zinc-950 text-zinc-200 border border-zinc-800 rounded px-2 py-0.5 text-[11px]"
                      >
                        <option value="typescript">TypeScript (tsx)</option>
                        <option value="javascript">JavaScript (Node)</option>
                        <option value="python">Python 3</option>
                      </select>

                      <button
                        onClick={handleRunScript}
                        disabled={isRunning}
                        className="flex items-center gap-1 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isRunning ? 'Executing...' : 'Run Script'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={scriptInput}
                    onChange={(e) => setScriptInput(e.target.value)}
                    placeholder="// Paste test code or concurrency simulation script here..."
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-cyan-300 font-mono text-xs focus:outline-none focus:border-purple-500 leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* Terminal Output Logs */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-mono text-xs bg-zinc-950 scrollbar-thin">
              <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-900 pb-1.5 text-[11px]">
                <span>Execution Logs ({sessionLogs.length} runs)</span>
                {sessionLogs.length > 0 && (
                  <button
                    onClick={onClearLogs}
                    className="text-zinc-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {sessionLogs.length === 0 ? (
                <div className="py-10 text-center text-zinc-600 space-y-1">
                  <TerminalIcon className="w-6 h-6 mx-auto mb-1 text-zinc-700" />
                  <p>Terminal ready. Execute commands or run AI verification scripts above.</p>
                </div>
              ) : (
                sessionLogs.map((log, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-zinc-850 bg-zinc-900/60 overflow-hidden"
                  >
                    <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-850 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-zinc-200">
                        {log.success ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        )}
                        <span className="font-semibold">$ {log.command}</span>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-500 text-[10px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {log.durationMs}ms
                        </span>
                        <span
                          className={`px-1 py-0.2 rounded font-mono ${
                            log.exitCode === 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          Exit {log.exitCode}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 overflow-x-auto text-[11px] leading-relaxed">
                      {log.stdout && (
                        <pre className="text-emerald-300/90 whitespace-pre-wrap">{log.stdout}</pre>
                      )}
                      {log.stderr && (
                        <pre className="text-rose-400 whitespace-pre-wrap">{log.stderr}</pre>
                      )}
                      {!log.stdout && !log.stderr && (
                        <span className="text-zinc-600 italic">(Process exited with no output)</span>
                      )}
                    </div>
                  </div>
                ))
              )}

              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
