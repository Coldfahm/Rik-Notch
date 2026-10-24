import React, { useEffect, useRef } from 'react';

interface AudioVisualizerBarsProps {
  isPlaying: boolean;
  dominantColor: string; // Hex or rgb
  width: number;
  height: number;
  variant?: 'full-mirrored' | 'mini-5bar';
}

export const AudioVisualizerBars: React.FC<AudioVisualizerBarsProps> = ({
  isPlaying,
  dominantColor,
  width,
  height,
  variant = 'full-mirrored',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Audio simulation state (mimics WASAPI / rustfft 24-band engine with attack 0.6 / release 0.12)
  const smoothedBandsRef = useRef<number[]>(new Array(variant === 'mini-5bar' ? 5 : 24).fill(0));
  const peakEnergyRef = useRef<number>(1.0);
  const currentColorRef = useRef<string>(dominantColor);
  const targetColorRef = useRef<string>(dominantColor);
  const colorLerpProgressRef = useRef<number>(1.0);
  const pauseEaseRef = useRef<number>(1.0); // 1.0 down to 0.0 over 300ms

  // Update target color with 400ms crossfade
  useEffect(() => {
    if (dominantColor !== targetColorRef.current) {
      targetColorRef.current = dominantColor;
      colorLerpProgressRef.current = 0.0;
    }
  }, [dominantColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTimestamp = performance.now();
    const numBands = variant === 'mini-5bar' ? 5 : 24;

    const render = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      // Color crossfade interpolation over 400ms
      if (colorLerpProgressRef.current < 1.0) {
        colorLerpProgressRef.current = Math.min(1.0, colorLerpProgressRef.current + dt / 0.4);
      }

      // Handle pause easing over 300ms
      if (!isPlaying) {
        pauseEaseRef.current = Math.max(0.0, pauseEaseRef.current - dt / 0.3);
      } else {
        pauseEaseRef.current = Math.min(1.0, pauseEaseRef.current + dt / 0.1);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (pauseEaseRef.current <= 0.001) {
        // Stop the animation loop once the paused bars have faded out.
        return;
      }

      // Audio frequency simulation (24 log-spaced bands with attack/release smoothing)
      const attack = 0.60;
      const release = 0.12;
      let frameMaxEnergy = 0.01;

      for (let i = 0; i < numBands; i++) {
        // Dynamic harmonic distribution
        const t = now * 0.003;
        const normBand = i / numBands;
        const rawWave =
          Math.sin(t * 2.8 + i * 0.6) * 0.4 +
          Math.cos(t * 1.5 - i * 0.8) * 0.35 +
          Math.sin(t * 4.2 + normBand * 3.14) * 0.25;
        const rawEnergy = Math.max(0.05, Math.abs(rawWave) * (1.1 - normBand * 0.3));

        if (rawEnergy > frameMaxEnergy) frameMaxEnergy = rawEnergy;

        // Adapting peak decay (~2.0s decay)
        if (frameMaxEnergy > peakEnergyRef.current) {
          peakEnergyRef.current = frameMaxEnergy;
        } else {
          peakEnergyRef.current = Math.max(0.2, peakEnergyRef.current * 0.995);
        }

        const normalized = Math.min(1.0, rawEnergy / peakEnergyRef.current) * pauseEaseRef.current;
        let curr = smoothedBandsRef.current[i] || 0;

        if (normalized > curr) {
          curr += (normalized - curr) * attack;
        } else {
          curr -= (curr - normalized) * release;
        }
        smoothedBandsRef.current[i] = curr;
      }

      // Render styles
      if (variant === 'mini-5bar') {
        // Mini 5-bar visualiser: 3px bars, 2px gap
        const barWidth = 3;
        const gap = 2;
        const totalW = 5 * barWidth + 4 * gap;
        const startX = (canvas.width - totalW) / 2;
        const maxH = canvas.height - 2;

        ctx.fillStyle = targetColorRef.current || '#2dd4bf';

        for (let i = 0; i < 5; i++) {
          const val = smoothedBandsRef.current[i] || 0.1;
          const barH = Math.max(2, val * maxH);
          const x = startX + i * (barWidth + gap);
          const y = canvas.height - barH;

          // Draw rounded bar
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, 1.5);
          ctx.fill();
        }
      } else {
        // Full-width 24 rounded bars mirrored from vertical centre
        const barCount = 24;
        const barGap = 3;
        const totalGaps = (barCount - 1) * barGap;
        const availableW = canvas.width - 24; // padding
        const barWidth = Math.max(2, (availableW - totalGaps) / barCount);
        const startX = 12;
        const centerY = canvas.height / 2;
        const maxHalfH = canvas.height * 0.44;

        ctx.fillStyle = targetColorRef.current || '#2dd4bf';

        for (let i = 0; i < barCount; i++) {
          const val = smoothedBandsRef.current[i] || 0.05;
          const halfH = Math.max(1.5, val * maxHalfH);
          const x = startX + i * (barWidth + barGap);
          const topY = centerY - halfH;
          const fullH = halfH * 2;

          ctx.beginPath();
          ctx.roundRect(x, topY, barWidth, fullH, barWidth / 2);
          ctx.fill();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, variant, dominantColor, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none"
    />
  );
};
