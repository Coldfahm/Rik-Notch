import React, { useState } from 'react';
import { LocalPortProbe, QuickScript, ClipboardItem, ActiveWindowContext } from '../types';
import {
  Terminal,
  Activity,
  Play,
  ClipboardList,
  GitBranch,
  Download,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Code2,
} from 'lucide-react';

interface DeveloperToolkitProps {
  activeContext: ActiveWindowContext;
  setActiveContext: (ctx: ActiveWindowContext) => void;
  onAction?: (msg: string) => void;
}

export const DeveloperToolkit: React.FC<DeveloperToolkitProps> = ({
  activeContext,
  setActiveContext,
  onAction,
}) => {
  const [subTab, setSubTab] = useState<'ports' | 'scripts' | 'clipboard' | 'context'>('ports');
  const [copiedClipId, setCopiedClipId] = useState<string | null>(null);

  // 1. Local Server Monitor ports
  const [ports, setPorts] = useState<LocalPortProbe[]>([
    { port: 3000, label: 'Next.js Dev Server', status: 'active', latencyMs: 1.2 },
    { port: 5173, label: 'Vite Frontend', status: 'active', latencyMs: 0.8 },
    { port: 8080, label: 'Rust Tauri IPC Backend', status: 'active', latencyMs: 0.3 },
    { port: 5432, label: 'PostgreSQL Instance', status: 'inactive', latencyMs: 0 },
  ]);

  // 2. Quick Execute Scripts
  const [scripts, setScripts] = useState<QuickScript[]>([
    {
      id: 's1',
      name: 'Clean Cargo Target & LTO Cache',
      type: 'powershell',
      command: 'cargo clean --profile release && cargo sweep -t 3d',
      status: 'idle',
    },
    {
      id: 's2',
      name: 'Docker Compose Down & Purge Vol',
      type: 'bash',
      command: 'docker compose down -v --remove-orphans',
      status: 'idle',
    },
    {
      id: 's3',
      name: 'Kill Zombie Port 3000 PIDs',
      type: 'batch',
      command: 'for /f "tokens=5" %a in (\'netstat -aon ^| find "3000"\') do taskkill /f /pid %a',
      status: 'idle',
    },
  ]);

  // 3. Clipboard Time Machine History
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardItem[]>([
    {
      id: 'c1',
      content: 'git commit -m "feat(win32): implement zero-polling WM_DISPLAYCHANGE handler"',
      type: 'text',
      timestamp: '2m ago',
    },
    {
      id: 'c2',
      content: '0x7FFB349A1020 // Base pointer to DXGI swap chain buffer',
      type: 'hex',
      timestamp: '8m ago',
    },
    {
      id: 'c3',
      content: '{"stiffness": 220.0, "damping": 24.0, "mass": 1.0, "hard_ceiling_mb": 50}',
      type: 'json',
      timestamp: '14m ago',
    },
    {
      id: 'c4',
      content: 'cargo build --release --target x86_64-pc-windows-msvc',
      type: 'text',
      timestamp: '22m ago',
    },
  ]);

  const probePort = (targetPort: number) => {
    setPorts((prev) =>
      prev.map((p) =>
        p.port === targetPort ? { ...p, status: 'probing' } : p
      )
    );
    setTimeout(() => {
      setPorts((prev) =>
        prev.map((p) =>
          p.port === targetPort
            ? {
                ...p,
                status: 'active',
                latencyMs: +(Math.random() * 1.5 + 0.3).toFixed(1),
              }
            : p
        )
      );
      onAction?.(`Silently probed localhost:${targetPort} — healthy (latency < 2ms)`);
    }, 450);
  };

  const runScript = (scriptId: string) => {
    setScripts((prev) =>
      prev.map((s) => (s.id === scriptId ? { ...s, status: 'running' } : s))
    );
    const target = scripts.find((s) => s.id === scriptId);
    onAction?.(`Silent background execution: ${target?.name}`);

    setTimeout(() => {
      setScripts((prev) =>
        prev.map((s) =>
          s.id === scriptId
            ? { ...s, status: 'success', lastRun: 'Just now' }
            : s
        )
      );
    }, 1200);
  };

  const copyClipboard = (item: ClipboardItem) => {
    navigator.clipboard.writeText(item.content);
    setCopiedClipId(item.id);
    onAction?.(`Pasted from Time Machine: "${item.content.substring(0, 36)}..."`);
    setTimeout(() => setCopiedClipId(null), 1500);
  };

  return (
    <div className="w-full flex flex-col gap-2.5 text-slate-200">
      {/* Sub-navigation tabs */}
      <div className="flex items-center justify-between pb-1 border-b border-white/[0.06] text-xs">
        <div className="flex items-center gap-1.5 p-0.5 bg-black/40 rounded-lg border border-white/[0.08]">
          <button
            onClick={() => setSubTab('ports')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              subTab === 'ports'
                ? 'bg-sky-500/20 text-sky-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Local Servers</span>
          </button>

          <button
            onClick={() => setSubTab('scripts')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              subTab === 'scripts'
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Quick Execute</span>
          </button>

          <button
            onClick={() => setSubTab('clipboard')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              subTab === 'clipboard'
                ? 'bg-indigo-500/20 text-indigo-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Clipboard Time Machine</span>
          </button>

          <button
            onClick={() => setSubTab('context')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              subTab === 'context'
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Context Morphing</span>
          </button>
        </div>

        {/* Current Active Window Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
          <span>Active Window:</span>
          <span className="font-mono text-slate-200 uppercase bg-white/[0.05] px-2 py-0.5 rounded border border-white/[0.08]">
            {activeContext}
          </span>
        </div>
      </div>

      {/* View 1: Local Server Monitor */}
      {subTab === 'ports' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ports.map((p) => (
            <div
              key={p.port}
              className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      p.status === 'active'
                        ? 'bg-emerald-400'
                        : p.status === 'probing'
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-slate-600'
                    }`}
                  />
                  <span className="font-mono font-medium text-xs text-slate-200">
                    :{p.port}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{p.label}</div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                  {p.status === 'active' ? `${p.latencyMs}ms` : 'offline'}
                </span>
                <button
                  onClick={() => probePort(p.port)}
                  className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
                  title="Silent Ping"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Quick Execute Shelf */}
      {subTab === 'scripts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {scripts.map((s) => (
            <div
              key={s.id}
              className="flex flex-col justify-between p-2 rounded-lg bg-black/40 border border-white/[0.06] hover:border-amber-400/30 transition-all text-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200 truncate">{s.name}</span>
                  <span className="text-[10px] font-mono uppercase text-amber-400/80 bg-amber-400/10 px-1 rounded">
                    {s.type}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate mt-1 bg-black/30 p-1 rounded">
                  {s.command}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/[0.04]">
                <span className="text-[10px] text-slate-400 font-mono">
                  {s.lastRun ? `Ran: ${s.lastRun}` : 'Ready'}
                </span>
                <button
                  onClick={() => runScript(s.id)}
                  disabled={s.status === 'running'}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    s.status === 'running'
                      ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                      : s.status === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200'
                  }`}
                >
                  {s.status === 'running' ? (
                    'Executing...'
                  ) : s.status === 'success' ? (
                    <>
                      <Check className="w-3 h-3" /> Done
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" /> Silent Run
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 3: Clipboard Time Machine */}
      {subTab === 'clipboard' && (
        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
          {clipboardHistory.map((clip) => (
            <div
              key={clip.id}
              className="flex items-center justify-between gap-3 p-1.5 px-2.5 rounded-lg bg-black/40 border border-white/[0.06] hover:border-indigo-400/30 transition-all text-xs group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono uppercase text-indigo-400/80 bg-indigo-400/10 px-1 py-0.5 rounded shrink-0">
                  {clip.type}
                </span>
                <span className="font-mono text-slate-200 truncate">{clip.content}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-400 font-mono">{clip.timestamp}</span>
                <button
                  onClick={() => copyClipboard(clip)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  title="Paste into active context"
                >
                  {copiedClipId === clip.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 4: Contextual Morphing Simulator */}
      {subTab === 'context' && (
        <div className="flex flex-col gap-2 p-2 bg-black/40 rounded-lg border border-white/[0.06]">
          <div className="text-xs text-slate-300">
            Simulate foreground active application to observe Rik Notch contextual morphing:
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => {
                setActiveContext('vscode');
                onAction?.('Notch morphed: VS Code active → displaying Git branch & dirty files');
              }}
              className={`p-2 rounded border text-left text-xs transition-all ${
                activeContext === 'vscode'
                  ? 'border-purple-400 bg-purple-500/15 text-white'
                  : 'border-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium mb-1">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                <span>VS Code</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                branch: main* (+2 stashes)
              </div>
            </button>

            <button
              onClick={() => {
                setActiveContext('chrome');
                onAction?.('Notch morphed: Chrome active → displaying download speeds');
              }}
              className={`p-2 rounded border text-left text-xs transition-all ${
                activeContext === 'chrome'
                  ? 'border-sky-400 bg-sky-500/15 text-white'
                  : 'border-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium mb-1">
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Web Browser</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                2 downloads (48 MB/s)
              </div>
            </button>

            <button
              onClick={() => {
                setActiveContext('blender');
                onAction?.('Notch morphed: Blender active → displaying OptiX render frame progress');
              }}
              className={`p-2 rounded border text-left text-xs transition-all ${
                activeContext === 'blender'
                  ? 'border-amber-400 bg-amber-500/15 text-white'
                  : 'border-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium mb-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>3D DCC (Blender)</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                Frame 0142/0500 · 84%
              </div>
            </button>

            <button
              onClick={() => {
                setActiveContext('fullscreen_game');
                onAction?.('Ghost Mode Triggered: Fullscreen game detected → Mouse hook unregistered');
              }}
              className={`p-2 rounded border text-left text-xs transition-all ${
                activeContext === 'fullscreen_game'
                  ? 'border-rose-400 bg-rose-500/15 text-white'
                  : 'border-white/[0.08] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium mb-1 text-rose-300">
                <Activity className="w-3.5 h-3.5 text-rose-400" />
                <span>Fullscreen Game</span>
              </div>
              <div className="text-[10px] text-rose-400/90 font-mono truncate">
                DXGI Exclusive (Ghost Mode)
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
