import React, { useState } from 'react';
import { ARCHITECTURE_FILES, DIRECTORY_TREE } from '../data/architectureCode';
import { Copy, Check, Download, FolderTree, Code, Terminal, FileCode, Cpu, Layers, Zap } from 'lucide-react';

interface ArchitectureViewerProps {
  onAction?: (msg: string) => void;
}

export const ArchitectureViewer: React.FC<ArchitectureViewerProps> = ({ onAction }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'tree' | 'spec'>('code');

  const activeFile = ARCHITECTURE_FILES[selectedFileIndex];

  const handleCopyCode = () => {
    const textToCopy = viewMode === 'tree' ? DIRECTORY_TREE : activeFile.code;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    onAction?.(`Copied ${viewMode === 'tree' ? 'Directory Tree' : activeFile.path} to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBundle = () => {
    const bundleData = {
      project: 'Rik Notch',
      version: '0.1.0',
      description: 'Ultra-high-performance, zero-polling dynamic desktop overlay architecture',
      generatedAt: new Date().toISOString(),
      tree: DIRECTORY_TREE,
      files: ARCHITECTURE_FILES.map((f) => ({
        path: f.path,
        language: f.language,
        code: f.code,
      })),
    };

    const blob = new Blob([JSON.stringify(bundleData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rik-notch-architecture-blueprint.json';
    a.click();
    URL.revokeObjectURL(url);
    onAction?.('Downloaded complete Rik Notch architecture bundle JSON');
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden">
      {/* Top Bar for Code Studio */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4 bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold text-white tracking-tight">
              Rik Notch System Architecture & Core Boilerplate Codebase
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rust (Tauri v2) + Win32 C++ FFI / Wayland Layer-Shell · Zero Polling · &lt;50MB Ceiling
          </p>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs">
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'code'
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Native Code</span>
            </button>

            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Directory Tree</span>
            </button>

            <button
              onClick={() => setViewMode('spec')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'spec'
                  ? 'bg-sky-500/20 text-sky-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Spec & Memory Invariants</span>
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadBundle}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Blueprint</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'code' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
          {/* File Selector Sidebar */}
          <div className="lg:col-span-4 border-r border-white/[0.08] bg-slate-950/20 p-3 flex flex-col gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 px-2 uppercase tracking-wider mb-1">
              Core Native Files ({ARCHITECTURE_FILES.length})
            </span>

            {ARCHITECTURE_FILES.map((file, idx) => (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`flex flex-col text-left p-2.5 rounded-xl border transition-all ${
                  selectedFileIndex === idx
                    ? 'bg-sky-500/10 border-sky-400/30 text-white shadow-sm'
                    : 'bg-black/20 border-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <FileCode className={`w-4 h-4 ${selectedFileIndex === idx ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span className="font-mono text-xs font-medium text-slate-200 truncate">
                      {file.path}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 bg-white/[0.05] px-1.5 py-0.5 rounded">
                    {file.language}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-1">
                  {file.title}
                </div>
              </button>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-8 flex flex-col bg-[#060911]">
            {/* File Header */}
            <div className="px-4 py-2.5 border-b border-white/[0.06] bg-black/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sky-400 font-medium">{activeFile.path}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-400">{activeFile.description}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                {activeFile.code.split('\n').length} lines
              </span>
            </div>

            {/* Syntax Viewport */}
            <pre className="flex-1 p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto max-h-[500px] select-text">
              <code>{activeFile.code}</code>
            </pre>
          </div>
        </div>
      )}

      {viewMode === 'tree' && (
        <div className="p-5 bg-[#060911] text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto select-text">
          <div className="text-slate-400 mb-3 pb-2 border-b border-white/[0.06] flex items-center justify-between">
            <span>Optimal Directory Structure for Rust/C++ Native Hybrid Architecture</span>
            <span className="text-sky-400">Pure Zero-Polling & Layer-Shell Layout</span>
          </div>
          <pre>{DIRECTORY_TREE}</pre>
        </div>
      )}

      {viewMode === 'spec' && (
        <div className="p-6 bg-[#060911] grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Core Architectural Tenets</span>
            </h3>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
              <div className="font-semibold text-slate-200">1. Zero-Polling OS Event Architecture</div>
              <p className="text-slate-400 leading-normal">
                Eliminates all setInterval, requestAnimationFrame idle loops, and continuous polling ticks. Sits dormant in memory until native OS events fire: ManagementEventWatcher (WMI), ETW, dbus, and WM_USER notifications.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
              <div className="font-semibold text-slate-200">2. Hard 50MB Memory Ceiling & Retraction GC</div>
              <p className="text-slate-400 leading-normal">
                Baseline footprint stays around 9MB–12MB. The exact frame the notch retracts to its resting pill, explicit garbage collection calls EmptyWorkingSet on Win32, instantly evicting cached album art, text buffers, DOM trees, and file previews.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
              <div className="font-semibold text-slate-200">3. Hooke&apos;s Law Dynamic Elasticity</div>
              <p className="text-slate-400 leading-normal">
                Uses F = -kx - cv spring equations. Prevents linear, flat CSS transitions. Dropping a file or shifting tools causes deliberate physical overshoot and natural settling.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Critical Edge-Case Invariants</span>
            </h3>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
              <div className="font-semibold text-slate-200">4.1 Ghost Mode (DXGI Fullscreen Bypass)</div>
              <p className="text-slate-400 leading-normal">
                DirectX and Vulkan exclusive fullscreen contexts are probed. If a game like Fortnite or Forza Horizon is active, the top-edge mouse hook is unhooked completely. Zero focus stealing, zero frame stutter.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
              <div className="font-semibold text-slate-200">4.2 Multi-Monitor Hotplug Centering</div>
              <p className="text-slate-400 leading-normal">
                Catches WM_DISPLAYCHANGE immediately. Recalculates primary display geometry and teleports the notch to the exact physical center before the display finishes fading in from black.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex flex-col gap-1.5">
              <div className="font-semibold text-slate-200">4.4 Millisecond Shutdown Compliance (&lt;10ms)</div>
              <p className="text-slate-400 leading-normal">
                Listens to WM_QUERYENDSESSION. Commits shelf paths and clipboard history asynchronously and terminates via ExitProcess in under 10ms, avoiding OS shutdown block screens.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
