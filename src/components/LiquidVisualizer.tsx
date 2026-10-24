import React, { useEffect, useRef } from 'react';

interface LiquidVisualizerProps {
  isPlaying: boolean;
  isFocused: boolean;
  width: number;
  height?: number;
  colorHex?: string;
}

export const LiquidVisualizer: React.FC<LiquidVisualizerProps> = ({
  isPlaying,
  isFocused,
  width,
  height = 14,
  colorHex = '#38bdf8',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Strict Rule 2.4: Must freeze instantly when app loses focus or paused
    if (!isFocused || !isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      // Draw quiet frozen line
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 2);
      ctx.lineTo(canvas.width, canvas.height - 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
      return;
    }

    let running = true;

    const render = () => {
      if (!running) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      phaseRef.current += 0.045;
      const t = phaseRef.current;

      // Draw direct GPU-style liquid ripple across the bottom edge
      ctx.beginPath();
      ctx.moveTo(0, h);

      const segments = 48;
      const dx = w / segments;

      for (let i = 0; i <= segments; i++) {
        const x = i * dx;
        // Low-frequency organic liquid wave formula
        const normX = x / w;
        const envelope = Math.sin(normX * Math.PI); // Taper at endpoints
        const wave1 = Math.sin(t * 1.8 + normX * 8.0) * 3.5;
        const wave2 = Math.sin(t * 2.6 - normX * 12.0) * 2.0;
        const wave3 = Math.cos(t * 0.9 + normX * 4.0) * 1.5;

        const y = h - 3 - (wave1 + wave2 + wave3) * envelope;
        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineTo(w, h);
      ctx.closePath();

      // Liquid gradient fill
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.15)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.35)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Sharp glowing meniscus crest line
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const x = i * dx;
        const normX = x / w;
        const envelope = Math.sin(normX * Math.PI);
        const wave1 = Math.sin(t * 1.8 + normX * 8.0) * 3.5;
        const wave2 = Math.sin(t * 2.6 - normX * 12.0) * 2.0;
        const wave3 = Math.cos(t * 0.9 + normX * 4.0) * 1.5;
        const y = h - 3 - (wave1 + wave2 + wave3) * envelope;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, isFocused, width, height, colorHex]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute bottom-0 left-0 right-0 pointer-events-none rounded-b-2xl overflow-hidden"
      style={{ filter: 'drop-shadow(0 -1px 3px rgba(56, 189, 248, 0.3))' }}
    />
  );
};
