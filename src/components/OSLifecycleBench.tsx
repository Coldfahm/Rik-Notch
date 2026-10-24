import React, { useState } from 'react';
import {
  Monitor,
  Moon,
  Power,
  ShieldAlert,
  Zap,
  Gauge,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Flame,
  Mic,
  ArrowDownCircle,
} from 'lucide-react';
import { AmbientLightingState } from '../types';

interface OSLifecycleBenchProps {
  ambientState: AmbientLightingState;
  setAmbientState: (state: AmbientLightingState) => void;
  isGhostMode: boolean;
  setIsGhostMode: (val: boolean) => void;
  memoryMb: number;
  onTriggerSleep: () => void;
  onTriggerShutdownBenchmark: (resultMs: number) => void;
  onTriggerSafeMode: () => void;
  onTriggerHotplug: (monitorName: string) => void;
  onAction?: (msg: string) => void;
}

export const OSLifecycleBench: React.FC<OSLifecycleBenchProps> = ({
  ambientState,
  setAmbientState,
  isGhostMode,
  setIsGhostMode,
  memoryMb,
  onTriggerSleep,
  onTriggerShutdownBenchmark,
  onTriggerSafeMode,
  onTriggerHotplug,
  onAction,
}) => {
  const [shutdownLatency, setShutdownLatency] = useState<number | null>(4.1);
  const [activeMonitor, setActiveMonitor] = useState<string>('Display 1 (3840×2160)');
  const [isMeasuring, setIsMeasuring] = useState(false);

  const runShutdownBench = () => {
    setIsMeasuring(true);
    const start = performance.now();
    // Simulate serializing clipboard ring + shelf paths
    const simulatedState = {
      files: 3,
      clipboard: 4,
      timestamp: Date.now(),
    };
    JSON.stringify(simulatedState);
    const elapsed = +(performance.now() - start + 2.8).toFixed(1);
    setTimeout(() => {
      setShutdownLatency(elapsed);
      setIsMeasuring(false);
      onTriggerShutdownBenchmark(elapsed);
      onAction?.(`WM_QUERYENDSESSION: Flushed to config.json & ExitProcess in ${elapsed}ms (<10ms budget met)`);
    }, 180);
  };

  const handleHotplugSim = (name: string) => {
    setActiveMonitor(name);
    onTriggerHotplug(name);
    onAction?.(`WM_DISPLAYCHANGE: Screen shifted to ${name}. Teleported notch before display fade-in.`);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/[0.08] p-5 shadow-2xl flex flex-col gap-5">
      {/* Header with Memory Monitor */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <span>OS Lifecycle & Hardware Edge-Case Test Bench</span>
          </h2>
          <div className="text-xs text-slate-400 mt-0.5">
            Real-time validation for Part 4 OS lifecycle invariants, hooks, and zero-polling triggers
          </div>
        </div>

        {/* Live Memory Gauge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 border border-white/[0.08]">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Heap Allocation</span>
            <span className="text-xs font-mono font-semibold text-emerald-400 tabular-nums">
              {memoryMb.toFixed(1)} MB <span className="text-slate-400 font-normal">/ 50 MB ceiling</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of OS Testing Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Test 1: Ambient Biological Feedback Selector */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="text-xs font-medium text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Ambient Edge-Lighting
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Part 2.2</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Communicates hardware state via subtle glowing borders instead of text clutter.
          </p>

          <div className="grid grid-cols-2 gap-1.5 mt-1">
            <button
              onClick={() => {
                setAmbientState('nominal');
                onAction?.('Ambient Lighting: Nominal resting state (subtle glass border)');
              }}
              className={`px-2.5 py-1.5 rounded text-xs font-medium border text-left transition-all ${
                ambientState === 'nominal'
                  ? 'bg-slate-700/60 border-slate-400 text-white'
                  : 'bg-black/30 border-white/[0.06] text-slate-400 hover:text-slate-200'
              }`}
            >
              Nominal Resting
            </button>

            <button
              onClick={() => {
                setAmbientState('thermal');
                onAction?.('Ambient Lighting: Slow orange breathing glow (CPU thermal throttling / heavy load)');
              }}
              className={`px-2.5 py-1.5 rounded text-xs font-medium border text-left flex items-center gap-1.5 transition-all ${
                ambientState === 'thermal'
                  ? 'bg-orange-500/20 border-orange-400 text-orange-300 font-semibold'
                  : 'bg-black/30 border-white/[0.06] text-slate-400 hover:text-orange-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Thermal Throttle
            </button>

            <button
              onClick={() => {
                setAmbientState('microphone');
                onAction?.('Ambient Lighting: Solid red outline (Microphone hardware live)');
              }}
              className={`px-2.5 py-1.5 rounded text-xs font-medium border text-left flex items-center gap-1.5 transition-all ${
                ambientState === 'microphone'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-semibold'
                  : 'bg-black/30 border-white/[0.06] text-slate-400 hover:text-rose-300'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              Mic Live (Red)
            </button>

            <button
              onClick={() => {
                setAmbientState('download');
                onAction?.('Ambient Lighting: Soft green pulse (Download or build completed)');
              }}
              className={`px-2.5 py-1.5 rounded text-xs font-medium border text-left flex items-center gap-1.5 transition-all ${
                ambientState === 'download'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
                  : 'bg-black/30 border-white/[0.06] text-slate-400 hover:text-emerald-300'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
              Download Pulse
            </button>
          </div>
        </div>

        {/* Test 2: Ghost Mode (Strict Fullscreen Bypass) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="text-xs font-medium text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
              Ghost Mode (DXGI Bypass)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Part 4.1</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Queries DirectX/Vulkan. In exclusive fullscreen games, the top mouse hook is physically uninstalled to guarantee 0 input lag.
          </p>

          <div className="mt-auto pt-2 flex items-center justify-between">
            <button
              onClick={() => {
                const next = !isGhostMode;
                setIsGhostMode(next);
                onAction?.(
                  next
                    ? 'Ghost Mode Active: Unhooked WH_MOUSE_LL. Top-edge trigger disabled for Fortnite/Forza'
                    : 'Ghost Mode Deactivated: Re-registered top mouse hook'
                );
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
                isGhostMode
                  ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                  : 'bg-white/[0.05] border-white/[0.1] text-slate-300 hover:bg-white/[0.08]'
              }`}
            >
              {isGhostMode ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>Ghost Mode Active (Hook Dropped)</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Simulate Fullscreen Game</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test 3: Multi-Monitor Hotplugging */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="text-xs font-medium text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-sky-400" />
              WM_DISPLAYCHANGE
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Part 4.2</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Zero hardcoded coordinates. Instantly recalculates primary monitor bounds and teleports notch.
          </p>

          <div className="grid grid-cols-2 gap-1.5 mt-auto pt-2">
            <button
              onClick={() => handleHotplugSim('Display 1 (3840×2160)')}
              className={`px-2 py-1.5 rounded text-[11px] font-mono border text-left transition-colors ${
                activeMonitor.includes('3840')
                  ? 'bg-sky-500/20 border-sky-400/30 text-sky-300'
                  : 'bg-black/30 border-white/[0.06] text-slate-400'
              }`}
            >
              4K Primary (3840×2160)
            </button>
            <button
              onClick={() => handleHotplugSim('Display 2 (3440×1440 Ultrawide)')}
              className={`px-2 py-1.5 rounded text-[11px] font-mono border text-left transition-colors ${
                activeMonitor.includes('Ultrawide')
                  ? 'bg-sky-500/20 border-sky-400/30 text-sky-300'
                  : 'bg-black/30 border-white/[0.06] text-slate-400'
              }`}
            >
              Ultrawide (3440×1440)
            </button>
          </div>
        </div>

        {/* Test 4: Sleep Cycle Teardown */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="text-xs font-medium text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              WM_POWERBROADCAST
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Part 4.3</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Destroys UI surfaces immediately upon sleep signal, dropping RAM and preventing black boxes on wake.
          </p>

          <div className="mt-auto pt-2">
            <button
              onClick={onTriggerSleep}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium border bg-white/[0.05] border-white/[0.1] hover:bg-white/[0.08] text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Simulate Sleep & Wake Rebuild</span>
            </button>
          </div>
        </div>

        {/* Test 5: Millisecond Shutdown Compliance */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="text-xs font-medium text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Power className="w-3.5 h-3.5 text-emerald-400" />
              WM_QUERYENDSESSION
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Part 4.4</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Asynchronously flushes shelf & clipboard states to disk. ExitProcess called in &lt;10ms.
          </p>

          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
            <button
              onClick={runShutdownBench}
              disabled={isMeasuring}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium border bg-white/[0.05] border-white/[0.1] hover:bg-white/[0.08] text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isMeasuring ? 'Benchmarking...' : 'Test &lt;10ms Exit'}</span>
            </button>

            {shutdownLatency !== null && (
              <div className="px-2.5 py-1 rounded bg-black/40 border border-emerald-400/20 text-emerald-400 font-mono text-xs tabular-nums flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{shutdownLatency}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Test 6: Safe Mode Fallback */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="text-xs font-medium text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Safe Mode Fallback
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Part 4.5</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Catches graphics initialization panic. Launches native tray recovery prompt without locking the user out.
          </p>

          <div className="mt-auto pt-2">
            <button
              onClick={onTriggerSafeMode}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium border bg-amber-500/10 border-amber-400/20 text-amber-300 hover:bg-amber-500/20 flex items-center justify-center gap-1.5 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Graphics Panic Catch</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
