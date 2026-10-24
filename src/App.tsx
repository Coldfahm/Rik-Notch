import React, { useState } from 'react';
import { RikNotch } from './components/RikNotch';
import { ArchitectureViewer } from './components/ArchitectureViewer';
import { motion, AnimatePresence } from 'motion/react';
import { Code2, X, Eye } from 'lucide-react';

export default function App() {
  const [showBlueprintDrawer, setShowBlueprintDrawer] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e] select-none text-slate-200 flex flex-col justify-between">
      {/* Desktop background with subtle atmospheric illumination */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.06),rgba(255,255,255,0))] pointer-events-none" />

      {/* TOP ANCHORED REGION: The Physical Rik Notch (120px x 32px resting pill -> 390px x 88px on 150ms hover) */}
      <header className="relative w-full flex justify-center items-start pt-0 z-50">
        <RikNotch />
      </header>

      {/* CENTER VIEWPORT: Clean, hyper-minimalist workspace (Zero clutter, zero static labels) */}
      <main className="relative flex-1 flex flex-col items-center justify-center pointer-events-none px-6" />

      {/* BOTTOM EDGE: Architecture and code reference drawer */}
      <footer className="relative w-full px-6 py-3 flex items-center justify-between text-[11px] font-mono text-slate-400 z-40">
        <div className="flex items-center gap-2 text-slate-400">
          <span>Rik Notch</span>
          <span>·</span>
          <span>Desktop preview · simulated integrations</span>
        </div>

        <button
          onClick={() => setShowBlueprintDrawer(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors pointer-events-auto cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Eye Math &amp; Rust Codebase</span>
        </button>
      </footer>

      {/* Slide-over Specification & Codebase Drawer */}
      <AnimatePresence>
        {showBlueprintDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBlueprintDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-over Content Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-w-3xl h-full bg-[#090d16] border-l border-white/[0.1] shadow-2xl flex flex-col z-10 overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-black/40 sticky top-0 z-20 backdrop-blur-md">
                <div className="flex items-center gap-2 text-white">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-sm">Eye-Tracking Math &amp; Native Architecture</span>
                </div>
                <button
                  onClick={() => setShowBlueprintDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 flex flex-col gap-6">
                {/* Eye Tracking Math Formula Box */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] flex flex-col gap-3 font-mono text-xs">
                  <div className="text-sky-400 font-semibold flex items-center gap-2">
                    <span>Eye-Tracking Geometry &amp; Idle Saccade Math</span>
                  </div>
                  <div className="text-slate-300 leading-relaxed select-text space-y-1.5">
                    <div>1. Delta vector from eye center (ex, ey) to cursor (cx, cy):</div>
                    <div className="pl-4 text-emerald-400">dx = cx - ex; dy = cy - ey;</div>
                    <div>2. Polar angle computed via atan2:</div>
                    <div className="pl-4 text-emerald-400">θ = Math.atan2(dy, dx);</div>
                    <div>3. Euclidean distance &amp; radius clamping:</div>
                    <div className="pl-4 text-emerald-400">d = Math.hypot(dx, dy);</div>
                    <div className="pl-4 text-emerald-400">r = Math.min(R_MAX, (d / SENSITIVITY) * R_MAX); // R_MAX = 3.4px</div>
                    <div>4. Cartesian pupil offset:</div>
                    <div className="pl-4 text-emerald-400">pupilX = r * Math.cos(θ); pupilY = r * Math.sin(θ);</div>
                    <div>5. Idle Timer (2000ms delta = 0):</div>
                    <div className="pl-4 text-amber-300">
                      If (now - lastMoveTime &gt; 2000) =&gt; trigger Y-scale blink (scaleY: 0.08) and organic random micro-saccades.
                    </div>
                  </div>
                </div>

                {/* Architecture Viewer */}
                <ArchitectureViewer />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
