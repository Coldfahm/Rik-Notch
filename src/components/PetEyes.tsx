import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

interface PetEyesProps {
  isHovered: boolean;
  notchRef: React.RefObject<HTMLDivElement | null>;
}

export const PetEyes: React.FC<PetEyesProps> = ({ isHovered, notchRef }) => {
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [isLookingAround, setIsLookingAround] = useState(false);
  const [saccadeOffset, setSaccadeOffset] = useState({ x: 0, y: 0 });

  const lastCursorPosRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(Date.now());
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saccadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Cursor Tracking Math using atan2 & Euclidean distance clamping
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const dxMove = Math.abs(e.clientX - lastCursorPosRef.current.x);
      const dyMove = Math.abs(e.clientY - lastCursorPosRef.current.y);

      // If cursor moved at least 1px, reset idle timer
      if (dxMove > 1 || dyMove > 1) {
        lastMoveTimeRef.current = now;
        setIsLookingAround(false);
      }
      lastCursorPosRef.current = { x: e.clientX, y: e.clientY };

      if (!notchRef.current || isHovered) return;

      const rect = notchRef.current.getBoundingClientRect();
      // Center of the notch where the eyes sit
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height / 2;

      // Mathematical derivation:
      // Delta vector to cursor
      const dx = e.clientX - eyeCenterX;
      const dy = e.clientY - eyeCenterY;

      // Direction angle in radians: θ = atan2(dy, dx)
      const angle = Math.atan2(dy, dx);

      // Distance: d = √(dx² + dy²)
      const distance = Math.hypot(dx, dy);

      // Clamped radius: max 3.5px offset inside a 10px eye socket
      const MAX_OFFSET = 3.4;
      const SENSITIVITY_RADIUS = 240; // Full deflection reached at 240px
      const clampedRadius = Math.min(MAX_OFFSET, (distance / SENSITIVITY_RADIUS) * MAX_OFFSET);

      // Cartesian coordinates: x = r * cos(θ), y = r * sin(θ)
      const targetX = clampedRadius * Math.cos(angle);
      const targetY = clampedRadius * Math.sin(angle);

      setPupilOffset({ x: targetX, y: targetY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [notchRef, isHovered]);

  // 2. Idle Organism Loop: 2000ms delta = 0 triggers blinking & organic saccades
  useEffect(() => {
    const idleCheckInterval = setInterval(() => {
      const timeSinceMove = Date.now() - lastMoveTimeRef.current;

      // Rule 3: If cursor delta is 0 for 2000ms
      if (timeSinceMove >= 2000 && !isHovered) {
        setIsLookingAround(true);
      }
    }, 400);

    return () => clearInterval(idleCheckInterval);
  }, [isHovered]);

  // 3. Periodic Blink Animation (Y-scale blink)
  useEffect(() => {
    const scheduleNextBlink = () => {
      // Natural random blink interval between 2.5s and 5.5s
      const delay = Math.random() * 3000 + 2500;
      blinkTimerRef.current = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 150); // 150ms blink duration
      }, delay);
    };

    scheduleNextBlink();
    return () => {
      if (blinkTimerRef.current) clearTimeout(blinkTimerRef.current);
    };
  }, []);

  // 4. Organic Saccadic Micro-Offsets when Idle
  useEffect(() => {
    if (!isLookingAround || isHovered) {
      setSaccadeOffset({ x: 0, y: 0 });
      return;
    }

    const triggerSaccade = () => {
      // Generate small random glances
      const randomAngle = Math.random() * Math.PI * 2;
      const randomRadius = Math.random() * 2.8;
      setSaccadeOffset({
        x: Math.cos(randomAngle) * randomRadius,
        y: Math.sin(randomAngle) * randomRadius,
      });

      const nextDelay = Math.random() * 2200 + 1400;
      saccadeTimerRef.current = setTimeout(triggerSaccade, nextDelay);
    };

    triggerSaccade();
    return () => {
      if (saccadeTimerRef.current) clearTimeout(saccadeTimerRef.current);
    };
  }, [isLookingAround, isHovered]);

  // Combine cursor tracking offset or idle saccade
  const activeX = isLookingAround ? saccadeOffset.x : pupilOffset.x;
  const activeY = isLookingAround ? saccadeOffset.y : pupilOffset.y;

  return (
    <div className="flex items-center justify-center gap-2.5 h-full w-full pointer-events-none select-none">
      {/* Left Eye */}
      <motion.div
        animate={{
          scaleY: isBlinking ? 0.08 : 1,
        }}
        transition={{
          duration: 0.12,
          ease: 'easeInOut',
        }}
        className="w-2.5 h-4 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow-[0_0_8px_rgba(255,255,255,0.4)]"
      >
        {/* Left Pupil */}
        <motion.div
          animate={{
            x: activeX,
            y: activeY,
          }}
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 28,
            mass: 0.3,
          }}
          className="w-1.5 h-1.5 rounded-full bg-[#0a0f1d]"
        />
      </motion.div>

      {/* Right Eye */}
      <motion.div
        animate={{
          scaleY: isBlinking ? 0.08 : 1,
        }}
        transition={{
          duration: 0.12,
          ease: 'easeInOut',
        }}
        className="w-2.5 h-4 rounded-full bg-white/90 flex items-center justify-center overflow-hidden shadow-[0_0_8px_rgba(255,255,255,0.4)]"
      >
        {/* Right Pupil */}
        <motion.div
          animate={{
            x: activeX,
            y: activeY,
          }}
          transition={{
            type: 'spring',
            stiffness: 450,
            damping: 28,
            mass: 0.3,
          }}
          className="w-1.5 h-1.5 rounded-full bg-[#0a0f1d]"
        />
      </motion.div>
    </div>
  );
};
