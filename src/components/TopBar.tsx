import React from 'react';

interface TopBarProps {
  onScrollTo: (sectionId: string) => void;
  onTriggerNotch: () => void;
  onExport: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onScrollTo,
  onTriggerNotch,
  onExport,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-white/[0.08] bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-sky-300 transition-colors"
      >
        Rik Notch Systems
      </a>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
        <button
          onClick={() => onScrollTo('live-simulator')}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Live Simulator
        </button>
        <button
          onClick={() => onScrollTo('code-blueprint')}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Native Codebase
        </button>
        <button
          onClick={() => onScrollTo('os-bench')}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          OS Lifecycle Bench
        </button>
        <button
          onClick={() => onScrollTo('architectural-spec')}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Memory Architecture
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onTriggerNotch}
          className="hidden sm:inline-flex px-3.5 py-2 text-xs font-medium text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Pull Down Notch
        </button>
        <button
          onClick={onExport}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          Export Blueprint
        </button>
      </div>
    </header>
  );
};
