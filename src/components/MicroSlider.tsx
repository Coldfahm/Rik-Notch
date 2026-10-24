import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface MicroSliderProps {
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  onIconClick?: () => void;
  accentClass?: string;
}

export const MicroSlider: React.FC<MicroSliderProps> = ({
  icon,
  activeIcon,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  onIconClick,
  accentClass = 'bg-white',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showTransientValue, setShowTransientValue] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerTransientDisplay = useCallback(() => {
    setShowTransientValue(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowTransientValue(false);
    }, 1200);
  }, []);

  // 1. Triple-Input: Wheel Scroll (Adjust by step increments)
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation(); // Do not trigger parent category switch
    e.preventDefault();

    const delta = e.deltaY < 0 ? step : -step;
    const clamped = Math.max(min, Math.min(max, value + delta));
    onChange(clamped);
    triggerTransientDisplay();
  };

  // Helper to compute value from pointer coordinate
  const computeValueFromPointer = (clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const rawVal = min + ratio * (max - min);
    const stepped = Math.round(rawVal / step) * step;
    return Math.max(min, Math.min(max, stepped));
  };

  // 2. Triple-Input: Click to jump & Pointer Down to begin Drag
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);

    const newVal = computeValueFromPointer(e.clientX);
    onChange(newVal);
    triggerTransientDisplay();
  };

  // 3. Triple-Input: Drag
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();

    const newVal = computeValueFromPointer(e.clientX);
    onChange(newVal);
    triggerTransientDisplay();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      e.stopPropagation();
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
      triggerTransientDisplay();
    }
  };

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const percentage = Math.round(((value - min) / (max - min)) * 100);
  const isExpanded = isHovered || isDragging;

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!isDragging) setIsHovered(false);
      }}
      animate={{
        width: isExpanded ? 134 : 32,
      }}
      transition={{
        type: 'spring',
        stiffness: 450,
        damping: 30,
        mass: 0.6,
      }}
      className="relative h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.08] flex items-center px-1.5 overflow-hidden select-none"
    >
      {/* Icon button (Left) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onIconClick?.();
          triggerTransientDisplay();
        }}
        className="w-5 h-5 flex items-center justify-center shrink-0 text-white/80 hover:text-white transition-colors cursor-pointer"
      >
        {activeIcon || icon}
      </button>

      {/* Expanded Slider Track & Transient Value */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.8 }}
            transition={{ duration: 0.12 }}
            className="flex-1 flex items-center gap-2 pl-1.5 pr-1 min-w-0"
          >
            {/* Interactive Track */}
            <div
              ref={trackRef}
              onWheel={handleWheel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative flex-1 h-3 flex items-center cursor-pointer py-1"
            >
              {/* Background Track */}
              <div className="w-full h-1 bg-white/[0.15] rounded-full overflow-hidden">
                <div
                  className={`h-full ${accentClass} transition-all duration-75`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Thumb */}
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-sm pointer-events-none transform -translate-x-1/2"
                style={{ left: `${percentage}%` }}
              />
            </div>

            {/* Transient Value text (ONLY visible when actively hovering/adjusting) */}
            <AnimatePresence>
              {(showTransientValue || isDragging) && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.1 }}
                  className="font-mono text-[10px] text-white/90 tabular-nums shrink-0 min-w-[24px] text-right"
                >
                  {value}%
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
