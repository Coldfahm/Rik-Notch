import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Disc, AlertTriangle } from 'lucide-react';

interface MediaControllerProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onMemoryFlush: () => void;
  onAction?: (msg: string) => void;
}

export const MediaController: React.FC<MediaControllerProps> = ({
  isPlaying,
  setIsPlaying,
  onMemoryFlush,
  onAction,
}) => {
  const [trackProgress, setTrackProgress] = useState(24); // percentage
  const [pauseCountdown, setPauseCountdown] = useState(60); // 60s failsafe
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);

  // Synchronous local .lrc lines (zero network polling)
  const lrcLines = [
    'Sub-millisecond OS hooks running without polling loops',
    'Hooke\'s law springs damping through kinetic frames',
    'Zero allocations cached inside the dormant pill',
    'Synchronous ticker-tape fading out through the top',
    'Pure native compositing blending to the bezel edge',
  ];

  // 60-second pause memory failsafe countdown
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (!isPlaying) {
      timer = setInterval(() => {
        setPauseCountdown((prev) => {
          if (prev <= 1) {
            onMemoryFlush();
            onAction?.('60s Inactivity Failsafe: Collapsed media module and flushed album art from RAM');
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setPauseCountdown(60);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, onMemoryFlush, onAction]);

  // Synchronous lyrics progress tick
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentLyricIndex((prev) => (prev + 1) % lrcLines.length);
      setTrackProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 3800);
    return () => clearInterval(interval);
  }, [isPlaying, lrcLines.length]);

  return (
    <div className="w-full flex flex-col gap-2.5 text-slate-200">
      {/* Top track & SMTC transport row */}
      <div className="flex items-center justify-between gap-4">
        {/* Album Cover & Track Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-800/80 border border-white/[0.1] shrink-0 flex items-center justify-center">
            {/* Minimalist stylized SVG album art to keep memory lean */}
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-900/40 via-indigo-950/60 to-purple-900/40" />
            <Disc className={`w-5 h-5 text-sky-400 relative z-10 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-white truncate">Kinetic Resonance</span>
              <span className="text-[10px] font-mono text-sky-400/80 bg-sky-400/10 px-1 rounded">SMTC</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">Rik Audio Labs · Native MPRIS</div>
          </div>
        </div>

        {/* Media Transport Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onAction?.('SMTC Previous Track sent')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Previous"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const nextState = !isPlaying;
              setIsPlaying(nextState);
              onAction?.(nextState ? 'SMTC Play: Liquid visualizer active' : 'SMTC Pause: Liquid visualizer frozen');
            }}
            className="p-2 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-400/30 transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={() => onAction?.('SMTC Next Track sent')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Next"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Single-Line "Ticker-Tape" Lyrics with Bottom-in / Top-out Transition */}
      <div className="relative h-6 overflow-hidden bg-black/40 rounded border border-white/[0.06] flex items-center px-3">
        <div className="absolute left-2 text-[10px] font-mono text-sky-400 flex items-center gap-1 shrink-0">
          <Music className="w-3 h-3" />
          <span>LRC</span>
        </div>

        <div className="w-full text-center pl-10 pr-2">
          <div
            key={currentLyricIndex}
            className="text-xs font-mono text-slate-300 tracking-wide truncate animate-tickerTape"
            style={{
              animation: 'tickerTape 3.8s ease-in-out',
            }}
          >
            {lrcLines[currentLyricIndex]}
          </div>
        </div>
      </div>

      {/* Progress Bar & Inactivity Failsafe Status */}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex-1 flex items-center gap-2 mr-3">
          <span className="font-mono text-[10px] tabular-nums">1:14</span>
          <div className="flex-1 h-1 bg-white/[0.1] rounded-full overflow-hidden">
            <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${trackProgress}%` }} />
          </div>
          <span className="font-mono text-[10px] tabular-nums">4:02</span>
        </div>

        {!isPlaying && (
          <div className="flex items-center gap-1 text-amber-400/90 font-mono text-[10px] shrink-0">
            <AlertTriangle className="w-3 h-3" />
            <span>RAM Flush in {pauseCountdown}s</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes tickerTape {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          15% {
            opacity: 1;
            transform: translateY(0);
          }
          85% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-12px);
          }
        }
      `}</style>
    </div>
  );
};
