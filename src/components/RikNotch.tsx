import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PetEyes } from './PetEyes';
import { MicroSlider } from './MicroSlider';
import { AudioVisualizerBars } from './AudioVisualizerBars';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Disc,
  Volume2,
  VolumeX,
  Sun,
  Wifi,
  WifiOff,
  Bluetooth,
  Moon,
  BatteryCharging,
  Headphones,
  UploadCloud,
  ClipboardList,
  FileEdit,
  Video,
  Copy,
  Check,
  Timer,
  Camera,
} from 'lucide-react';

interface TrackInfo {
  title: string;
  artist: string;
  albumArt: string;
  dominantColor: string;
  duration: number; // seconds
}

export const RikNotch: React.FC = () => {
  // State Machine: 'collapsed' | 'peeking' | 'expanded'
  const [notchState, setNotchState] = useState<'collapsed' | 'peeking' | 'expanded'>('collapsed');
  
  // 5 Pages (0: Media, 1: Focus+Calendar, 2: System, 3: Shelf+Clipboard, 4: Quick Toggles)
  const [activePage, setActivePage] = useState<number>(0);
  const [lastUsedPage, setLastUsedPage] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Track & Playback state
  const [tracks] = useState<TrackInfo[]>([
    {
      title: 'Midnight Resonance (Spatial Mix)',
      artist: 'Rik Audio Labs & SynthWave Collective',
      albumArt: 'radial-gradient(circle, #0ea5e9, #0284c7)',
      dominantColor: '#38bdf8',
      duration: 222, // 3:42
    },
    {
      title: 'Kinetic Spring Dynamics',
      artist: 'OS Kernel Acoustics',
      albumArt: 'radial-gradient(circle, #10b981, #059669)',
      dominantColor: '#34d399',
      duration: 185, // 3:05
    },
    {
      title: 'Obsidian Velvet Sub-bass',
      artist: 'Low Latency Driver',
      albumArt: 'radial-gradient(circle, #8b5cf6, #6d28d9)',
      dominantColor: '#a78bfa',
      duration: 254, // 4:14
    },
  ]);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const currentTrack = tracks[currentTrackIdx];

  const [isPlaying, setIsPlaying] = useState(true);
  const [trackPosition, setTrackPosition] = useState(84); // 1:24
  const [isSeeking, setIsSeeking] = useState(false);

  // Focus & Calendar
  const [pomoSeconds, setPomoSeconds] = useState(25 * 60);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [joinedMeeting, setJoinedMeeting] = useState(false);

  // System & Mirror
  const [isMicLive, setIsMicLive] = useState(true);
  const [isCamLive, setIsCamLive] = useState(false);
  const [isMirrorOpen, setIsMirrorOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Shelf & Clipboard
  const [files, setFiles] = useState(['Turbine_Assembly_Rev4.dwg', 'RED_Raw_Take12.r3d']);
  const [isDragOverCollapsed, setIsDragOverCollapsed] = useState(false);
  const [copiedChip, setCopiedChip] = useState<string | null>(null);
  const [clipboardText, setClipboardText] = useState('git commit -m "feat: wasapi fft"');
  const [noteText, setNoteText] = useState('Inspect low latency audio buffer');
  const [isEditingNote, setIsEditingNote] = useState(false);

  // Quick Toggles
  const [isWifiOn, setIsWifiOn] = useState(true);
  const [isBtOn, setIsBtOn] = useState(true);
  const [isDndOn, setIsDndOn] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [brightness, setBrightness] = useState(85);

  // Timers for hover intent, collapse, peek, and sticky page
  const notchRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const peekTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stickyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstTrackRef = useRef(true);
  const lastScrollTimeRef = useRef<number>(0);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Playback timer tick
  useEffect(() => {
    if (!isPlaying || isSeeking) return;
    const interval = setInterval(() => {
      setTrackPosition((prev) => (prev >= currentTrack.duration ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isSeeking, currentTrack.duration]);

  // Pomodoro timer tick
  useEffect(() => {
    if (!isPomoRunning) return;
    const interval = setInterval(() => {
      setPomoSeconds((prev) => (prev > 0 ? prev - 1 : 25 * 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPomoRunning]);

  // Camera video stream cleanup
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isMirrorOpen && notchState !== 'collapsed' && activePage === 2) {
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = s;
            }
          })
          .catch(() => {
            // gracefully fallback to mock video preview
          });
      }
    } else {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isMirrorOpen, notchState, activePage]);

  // Stop camera when notch collapses
  useEffect(() => {
    if (notchState === 'collapsed') {
      setIsMirrorOpen(false);
    }
  }, [notchState]);

  // Trigger copy with 300ms green flash
  const handleCopy = (text: string, chipId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedChip(chipId);
    setTimeout(() => {
      setCopiedChip((curr) => (curr === chipId ? null : curr));
    }, 300);
  };

  // 1. Hover Intent: 120ms delay before expanding
  const handleMouseEnter = useCallback(() => {
    // Cancel pending collapse
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }

    if (notchState === 'peeking') {
      // Upgrade peek to expanded
      if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
      setNotchState('expanded');
      return;
    }

    if (notchState === 'collapsed' && !hoverTimerRef.current) {
      hoverTimerRef.current = setTimeout(() => {
        setNotchState('expanded');
        hoverTimerRef.current = null;

        // If playing, show Media (0) first, else lastUsedPage
        if (!stickyTimerRef.current) {
          if (isPlaying) {
            setActivePage(0);
          } else {
            setActivePage(lastUsedPage);
          }
        }
      }, 120);
    }
  }, [notchState, isPlaying, lastUsedPage]);

  // 2. Fluid Collapse: 300ms exit delay
  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    if (notchState !== 'collapsed' && !collapseTimerRef.current) {
      collapseTimerRef.current = setTimeout(() => {
        setNotchState('collapsed');
        setIsMirrorOpen(false);
        collapseTimerRef.current = null;
      }, 300);
    }
  }, [notchState]);

  // 3. Track Change & Auto-Peek (2.5s duration)
  const triggerTrackChange = useCallback((newIdx: number) => {
    setCurrentTrackIdx(newIdx);
    setTrackPosition(0);

    // Invariant: Do not auto-peek on app start
    if (isFirstTrackRef.current) {
      isFirstTrackRef.current = false;
      return;
    }

    // If collapsed and playing, auto-peek Media page for 2.5s
    if (notchState === 'collapsed' && isPlaying) {
      setNotchState('peeking');
      setActivePage(0);

      if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
      peekTimerRef.current = setTimeout(() => {
        setNotchState((curr) => (curr === 'peeking' ? 'collapsed' : curr));
      }, 2500);
    }
    // Invariant: If notch is already open on another page, do NOT switch pages!
  }, [notchState, isPlaying]);

  // Manual Page Switch (Sticky for 8s)
  const switchPage = useCallback((newPage: number, dir?: 'left' | 'right') => {
    setSlideDirection(dir || (newPage > activePage ? 'right' : 'left'));
    setActivePage(newPage);
    setLastUsedPage(newPage);

    // Make selection sticky for 8s
    if (stickyTimerRef.current) clearTimeout(stickyTimerRef.current);
    stickyTimerRef.current = setTimeout(() => {
      stickyTimerRef.current = null;
    }, 8000);
  }, [activePage]);

  // Keyboard navigation: Left/Right arrow keys while hovered
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (notchState === 'collapsed') return;
      if (e.key === 'ArrowRight') {
        switchPage((activePage + 1) % 5, 'right');
      } else if (e.key === 'ArrowLeft') {
        switchPage((activePage - 1 + 5) % 5, 'left');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [notchState, activePage, switchPage]);

  // Mouse wheel cycling between the 5 pages
  const handleWheel = (e: React.WheelEvent) => {
    if (notchState === 'collapsed') return;

    const now = performance.now();
    if (now - lastScrollTimeRef.current < 160) return;
    lastScrollTimeRef.current = now;

    if (e.deltaY > 0 || e.deltaX > 0) {
      switchPage((activePage + 1) % 5, 'right');
    } else if (e.deltaY < 0 || e.deltaX < 0) {
      switchPage((activePage - 1 + 5) % 5, 'left');
    }
  };

  // Drag files onto collapsed notch: Expand to Shelf page
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (notchState === 'collapsed') {
      setIsDragOverCollapsed(true);
      setNotchState('expanded');
      setActivePage(3); // Shelf page
    }
  };

  const handleDragLeave = () => {
    setIsDragOverCollapsed(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCollapsed(false);
    if (e.dataTransfer.files?.length > 0) {
      const fileName = e.dataTransfer.files[0].name;
      setFiles((f) => [fileName, ...f.slice(0, 2)]);
    }
  };

  // Seeker interaction (click / drag)
  const handleSeeker = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newPos = Math.round(ratio * currentTrack.duration);
    setTrackPosition(newPos);
  };

  // Calculate dynamic dimensions per page using spring physics
  const isExpanded = notchState !== 'collapsed';
  let targetWidth = 120;
  let targetHeight = 32;

  if (isExpanded) {
    if (activePage === 0) {
      // Media: wider for 24-band visualizer, controls & marquee
      targetWidth = 460;
      targetHeight = 98;
    } else if (activePage === 1) {
      // Focus + Calendar
      targetWidth = 420;
      targetHeight = 56;
    } else if (activePage === 2) {
      // System & Live (expands down if Camera Mirror is active)
      targetWidth = 440;
      targetHeight = isMirrorOpen ? 144 : 56;
    } else if (activePage === 3) {
      // Shelf + Clipboard
      targetWidth = 440;
      targetHeight = 56;
    } else if (activePage === 4) {
      // Quick Toggles
      targetWidth = 440;
      targetHeight = 56;
    }
  }

  return (
    <div
      ref={notchRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative z-50 flex flex-col items-center select-none"
    >
      {/* Notch Pill Container with Spring Physics (stiffness: 300, damping: 28) */}
      <motion.div
        animate={{
          width: targetWidth,
          height: targetHeight,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 28,
          mass: 0.8,
        }}
        className={`relative rounded-b-2xl bg-black/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex flex-col items-center justify-between overflow-hidden cursor-default text-white ${
          isDragOverCollapsed ? 'border-2 border-dashed border-sky-400/80 bg-sky-950/40' : ''
        }`}
        style={{ borderTop: 'none' }}
      >
        {/* Subtle glass reflection highlight */}
        <div className="absolute top-0 inset-x-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* ─────────────────────────────────────────────────────────────
            COLLAPSED STATE:
            - When music playing: Album art (20x20, rounded 5px) on left + 5-bar mini visualizer on right
            - When paused/idle: Clean pill with digital pet eyes
        ───────────────────────────────────────────────────────────── */}
        {!isExpanded ? (
          <div className="w-full h-full flex items-center justify-between px-2.5">
            {isPlaying ? (
              <>
                {/* 20x20 album art thumbnail (rounded 5px) */}
                <div
                  className="w-5 h-5 rounded-[5px] flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
                  style={{ background: currentTrack.albumArt }}
                >
                  <Disc className="w-3 h-3 text-white/90 animate-spin" style={{ animationDuration: '4s' }} />
                </div>

                {/* Center Pet Eyes */}
                <div className="flex-1 flex items-center justify-center">
                  <PetEyes isHovered={false} notchRef={notchRef} />
                </div>

                {/* 5-bar mini visualizer on the right (3px bars, 2px gap) */}
                <div className="w-6 h-4 flex items-center justify-center shrink-0">
                  <AudioVisualizerBars
                    isPlaying={isPlaying}
                    dominantColor={currentTrack.dominantColor}
                    width={25}
                    height={16}
                    variant="mini-5bar"
                  />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PetEyes isHovered={false} notchRef={notchRef} />
              </div>
            )}
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
              EXPANDED STATE: The 5 Full Pages with Slot-Machine Slide
          ───────────────────────────────────────────────────────────── */
          <div className="w-full h-full flex flex-col justify-between p-2.5 pb-1 relative">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={activePage}
                initial={{
                  x: slideDirection === 'right' ? 12 : -12,
                  opacity: 0,
                }}
                animate={{
                  x: 0,
                  opacity: 1,
                }}
                exit={{
                  x: slideDirection === 'right' ? -12 : 12,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.18,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="w-full flex-1 flex flex-col justify-between"
              >
                {/* ═════════════════════════════════════════════════════════════
                    PAGE 0: MEDIA
                    Album art 44x44, Marquee Title, Seeker, Controls, 24 Mirrored Bars
                ═════════════════════════════════════════════════════════════ */}
                {activePage === 0 && (
                  <div className="w-full flex flex-col justify-between gap-1.5 h-full">
                    {/* Top row: 44x44 art, title+artist marquee, controls */}
                    <div className="flex items-center justify-between gap-3 w-full">
                      {/* Album art 44x44 */}
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 shadow-md border border-white/10"
                        style={{ background: currentTrack.albumArt }}
                      >
                        <Disc className={`w-5 h-5 text-white/80 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                      </div>

                      {/* Title + Artist with Marquee scroll */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="overflow-hidden w-full whitespace-nowrap relative h-4">
                          <div className="animate-marquee font-semibold text-xs text-white">
                            {currentTrack.title}
                          </div>
                        </div>
                        <div className="text-[10px] text-white/50 truncate font-mono">
                          {currentTrack.artist}
                        </div>
                      </div>

                      {/* Transport Controls (prev / play-pause / next) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => triggerTrackChange((currentTrackIdx - 1 + tracks.length) % tracks.length)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        >
                          <SkipBack className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white shadow-sm transition-all"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <button
                          onClick={() => triggerTrackChange((currentTrackIdx + 1) % tracks.length)}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar with elapsed & total time (click & drag to seek) */}
                    <div className="flex items-center gap-2 w-full text-[10px] font-mono text-white/60">
                      <span className="tabular-nums">{formatTime(trackPosition)}</span>
                      <div
                        onClick={handleSeeker}
                        className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative flex items-center group py-1"
                      >
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{
                            width: `${(trackPosition / currentTrack.duration) * 100}%`,
                            backgroundColor: currentTrack.dominantColor,
                          }}
                        />
                        <div
                          className="absolute w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity -ml-1 pointer-events-none"
                          style={{ left: `${(trackPosition / currentTrack.duration) * 100}%` }}
                        />
                      </div>
                      <span className="tabular-nums">{formatTime(currentTrack.duration)}</span>
                    </div>

                    {/* Full-width 24 rounded bars mirrored from vertical centre */}
                    <div className="w-full h-5 flex items-center justify-center overflow-hidden">
                      <AudioVisualizerBars
                        isPlaying={isPlaying}
                        dominantColor={currentTrack.dominantColor}
                        width={440}
                        height={20}
                        variant="full-mirrored"
                      />
                    </div>
                  </div>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    PAGE 1: FOCUS + CALENDAR
                    25:00 Timer with play button, 14:00 Standup with Join button
                ═════════════════════════════════════════════════════════════ */}
                {activePage === 1 && (
                  <div className="flex items-center justify-between gap-3 w-full h-full my-auto">
                    {/* Pomodoro Timer */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] shrink-0">
                      <Timer className="w-3.5 h-3.5 text-teal-400" />
                      <span className="font-mono text-xs font-semibold tabular-nums text-white">
                        {formatTime(pomoSeconds)}
                      </span>
                      <button
                        onClick={() => setIsPomoRunning(!isPomoRunning)}
                        className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        {isPomoRunning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
                      </button>
                    </div>

                    {/* Next Event Glance & Join */}
                    <div className="flex-1 flex items-center justify-between gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="font-mono text-[11px] text-white/90 truncate">14:00 Standup</span>
                      </div>

                      <button
                        onClick={() => {
                          setJoinedMeeting(true);
                          setTimeout(() => setJoinedMeeting(false), 2000);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono transition-colors shrink-0 ${
                          joinedMeeting
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        <Video className="w-3 h-3" />
                        <span>{joinedMeeting ? 'Joined' : 'Join'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    PAGE 2: SYSTEM
                    CPU%, RAM, Network, MIC & CAM pills (solid vs dim), Real Camera Mirror
                ═════════════════════════════════════════════════════════════ */}
                {activePage === 2 && (
                  <div className="flex flex-col justify-center gap-2 w-full h-full my-auto">
                    <div className="flex items-center justify-between gap-3 w-full">
                      {/* Compact Telemetry Text */}
                      <div className="flex items-center gap-2 font-mono text-[10px] text-white/70 shrink-0">
                        <span>CPU 12%</span>
                        <span className="text-white/20">·</span>
                        <span>RAM 8.9MB</span>
                        <span className="text-white/20">·</span>
                        <span>48MB/s</span>
                      </div>

                      {/* MIC & CAM pills (Active: solid color + pulsing dot; Inactive: dim outline, no dot) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* MIC Pill */}
                        <button
                          onClick={() => setIsMicLive(!isMicLive)}
                          className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                            isMicLive
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'border border-white/10 text-white/30'
                          }`}
                        >
                          {isMicLive && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                          <span>MIC</span>
                        </button>

                        {/* CAM Pill */}
                        <button
                          onClick={() => setIsCamLive(!isCamLive)}
                          className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors ${
                            isCamLive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'border border-white/10 text-white/30'
                          }`}
                        >
                          {isCamLive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          <span>CAM</span>
                        </button>
                      </div>

                      {/* Mirror Button (Expands camera view) */}
                      <button
                        onClick={() => setIsMirrorOpen(!isMirrorOpen)}
                        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] transition-colors shrink-0 ${
                          isMirrorOpen
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        <Camera className="w-3 h-3" />
                        <span>Mirror</span>
                      </button>
                    </div>

                    {/* Camera Preview (Mirrored horizontally, 16:9, rounded 10px) */}
                    {isMirrorOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 80 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full flex items-center justify-center rounded-[10px] overflow-hidden bg-black/80 border border-white/10 relative"
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
                        <div className="absolute top-1.5 right-2 font-mono text-[9px] text-teal-400 bg-black/60 px-1.5 py-0.5 rounded">
                          16:9 Mirror
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    PAGE 3: SHELF + CLIPBOARD
                    File chip, Last clipboard text, Quick notes scratchpad (400ms tooltip, 300ms green flash)
                ═════════════════════════════════════════════════════════════ */}
                {activePage === 3 && (
                  <div className="flex items-center justify-between gap-2.5 w-full h-full my-auto">
                    {/* File Chip */}
                    <div
                      onClick={() => handleCopy(files[0], 'file')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-colors shrink-0 max-w-[140px] group relative ${
                        copiedChip === 'file' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="font-mono text-[10px] text-white/90 truncate">{files[0]}</span>

                      {/* 400ms Hover Tooltip showing full text */}
                      <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-black/90 border border-white/10 font-mono text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-400 pointer-events-none z-30">
                        {files[0]}
                      </div>
                    </div>

                    {/* Clipboard History Chip */}
                    <div
                      onClick={() => handleCopy(clipboardText, 'clip')}
                      className={`flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer transition-colors min-w-0 group relative ${
                        copiedChip === 'clip' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="font-mono text-[10px] text-white/80 truncate">{clipboardText}</span>

                      {/* 400ms Hover Tooltip */}
                      <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-black/90 border border-white/10 font-mono text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity delay-400 pointer-events-none z-30">
                        {clipboardText}
                      </div>
                    </div>

                    {/* Quick Notes Scratchpad */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] shrink-0">
                      <FileEdit className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {isEditingNote ? (
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          onBlur={() => setIsEditingNote(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingNote(false)}
                          autoFocus
                          className="bg-transparent font-mono text-[10px] text-white outline-none w-20"
                        />
                      ) : (
                        <span
                          onClick={() => setIsEditingNote(true)}
                          className="font-mono text-[10px] text-white/80 cursor-text truncate max-w-[80px]"
                        >
                          {noteText}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    PAGE 4: QUICK TOGGLES
                    Wi-Fi, Bluetooth, DND, Battery levels, Micro-Volume, Micro-Brightness
                ═════════════════════════════════════════════════════════════ */}
                {activePage === 4 && (
                  <div className="flex items-center justify-between gap-2 w-full h-full my-auto">
                    {/* Wi-Fi Toggle */}
                    <button
                      onClick={() => setIsWifiOn(!isWifiOn)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors shrink-0 ${
                        isWifiOn ? 'text-white hover:bg-white/10' : 'text-white/30 hover:text-white/50'
                      }`}
                    >
                      {isWifiOn ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
                    </button>

                    {/* Bluetooth Toggle */}
                    <button
                      onClick={() => setIsBtOn(!isBtOn)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors shrink-0 ${
                        isBtOn ? 'text-white hover:bg-white/10' : 'text-white/30 hover:text-white/50'
                      }`}
                    >
                      <Bluetooth className="w-3.5 h-3.5" />
                    </button>

                    {/* DND Toggle */}
                    <button
                      onClick={() => setIsDndOn(!isDndOn)}
                      className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors shrink-0 ${
                        isDndOn ? 'text-amber-300 hover:bg-white/10' : 'text-white/30 hover:text-white/50'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                    </button>

                    {/* Battery Levels: System 94% + Accessory 88% */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] text-[10px] font-mono text-white/80 shrink-0">
                      <div className="flex items-center gap-1">
                        <BatteryCharging className="w-3 h-3 text-emerald-400" />
                        <span>94%</span>
                      </div>
                      <span className="text-white/20">·</span>
                      <div className="flex items-center gap-1">
                        <Headphones className="w-3 h-3 text-teal-400" />
                        <span>88%</span>
                      </div>
                    </div>

                    {/* Micro-Expanding Volume Slider */}
                    <MicroSlider
                      icon={<Volume2 className="w-3.5 h-3.5" />}
                      activeIcon={isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : undefined}
                      value={isMuted ? 0 : volume}
                      onChange={(v) => {
                        setVolume(v);
                        if (isMuted) setIsMuted(false);
                      }}
                      onIconClick={() => setIsMuted(!isMuted)}
                    />

                    {/* Micro-Expanding Brightness Slider */}
                    <MicroSlider
                      icon={<Sun className="w-3.5 h-3.5" />}
                      value={brightness}
                      onChange={(b) => setBrightness(b)}
                      min={10}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* ─────────────────────────────────────────────────────────────
                PAGE NAVIGATION DOTS (5 Dots, Clickable, Active One Elongated)
            ───────────────────────────────────────────────────────────── */}
            <div className="w-full flex items-center justify-center gap-1.5 py-1 z-20">
              {[0, 1, 2, 3, 4].map((idx) => (
                <button
                  key={idx}
                  onClick={() => switchPage(idx)}
                  className={`h-1 rounded-full transition-all duration-200 cursor-pointer ${
                    activePage === idx ? 'w-4 bg-white/90 shadow-sm' : 'w-1 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Page ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Marquee Animation CSS Keyframe */}
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          15% { transform: translateX(0%); }
          85% { transform: translateX(-40%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marqueeScroll 8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};
