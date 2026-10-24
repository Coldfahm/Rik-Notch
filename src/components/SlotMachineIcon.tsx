import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Play,
  Pause,
  Camera,
  ClipboardCopy,
  Terminal,
  Wifi,
  WifiOff,
} from 'lucide-react';

export interface ToolDef {
  id: string;
  name: string;
  renderIcon: (state: any) => React.ReactNode;
  actionDesc: string;
}

interface SlotMachineIconProps {
  toolIndex: number;
  direction: 'up' | 'down';
  toolStates: {
    isMuted: boolean;
    isMicMuted: boolean;
    isPlaying: boolean;
    isWifiOn: boolean;
  };
  onClick: () => void;
}

export const TOOLS: ToolDef[] = [
  {
    id: 'audio',
    name: 'Master Audio',
    renderIcon: (s) => (s.isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />),
    actionDesc: 'Toggled master audio mute',
  },
  {
    id: 'mic',
    name: 'Hardware Microphone',
    renderIcon: (s) => (s.isMicMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-white" />),
    actionDesc: 'Toggled microphone privacy shutter',
  },
  {
    id: 'media',
    name: 'Media SMTC',
    renderIcon: (s) => (s.isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white fill-current ml-0.5" />),
    actionDesc: 'Toggled SMTC playback',
  },
  {
    id: 'snip',
    name: 'Instant Snip',
    renderIcon: () => <Camera className="w-4 h-4 text-white" />,
    actionDesc: 'Captured screen rect to clipboard',
  },
  {
    id: 'clipboard',
    name: 'Time Machine',
    renderIcon: () => <ClipboardCopy className="w-4 h-4 text-white" />,
    actionDesc: 'Pasted last buffer entry into active focus',
  },
  {
    id: 'terminal',
    name: 'Quick Script',
    renderIcon: () => <Terminal className="w-4 h-4 text-white" />,
    actionDesc: 'Executed background dev script',
  },
  {
    id: 'wifi',
    name: 'Network Radio',
    renderIcon: (s) => (s.isWifiOn ? <Wifi className="w-4 h-4 text-white" /> : <WifiOff className="w-4 h-4 text-rose-400" />),
    actionDesc: 'Toggled Wi-Fi 6E radio adapter',
  },
];

export const SlotMachineIcon: React.FC<SlotMachineIconProps> = ({
  toolIndex,
  direction,
  toolStates,
  onClick,
}) => {
  const currentTool = TOOLS[toolIndex % TOOLS.length];

  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center w-full h-full cursor-pointer select-none group"
      title={`${currentTool.name} — Click to execute, scroll to change`}
    >
      {/* Slot Machine Vertical Reel with Hooke's Law Spring Physics */}
      <div className="relative w-7 h-7 overflow-hidden flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={`${currentTool.id}-${toolIndex}`}
            initial={{
              y: direction === 'up' ? 24 : -24,
              opacity: 0,
              scale: 0.65,
            }}
            animate={{
              y: 0,
              opacity: 1,
              scale: 1,
            }}
            exit={{
              y: direction === 'up' ? -24 : 24,
              opacity: 0,
              scale: 0.65,
            }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 26,
              mass: 0.5,
            }}
            whileTap={{ scale: 0.8 }}
            className="flex items-center justify-center text-white"
          >
            {currentTool.renderIcon(toolStates)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Tiny subtle tactile dot underneath showing index */}
      <div className="absolute -bottom-1 flex items-center gap-1 opacity-0 group-hover:opacity-40 transition-opacity">
        {TOOLS.map((_, i) => (
          <span
            key={i}
            className={`w-1 h-1 rounded-full transition-all ${
              i === toolIndex % TOOLS.length ? 'bg-white w-2' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
