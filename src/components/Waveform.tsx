"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface WaveformProps {
  isPlaying?: boolean;
  barCount?: number;
  height?: number;
  className?: string;
  color?: 'cyan' | 'purple' | 'green' | 'gradient';
}

export default function Waveform({
  isPlaying = false,
  barCount = 40,
  height = 60,
  className,
  color = 'gradient'
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initialize bars with random heights
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: barCount }, () => Math.random() * 0.5 + 0.3);
    }

    const barWidth = canvas.offsetWidth / barCount;
    const spacing = 2;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, height);

      barsRef.current.forEach((barHeight, i) => {
        const x = i * barWidth;
        const normalizedHeight = barHeight * height;
        const y = (height - normalizedHeight) / 2;

        // Create gradient for each bar
        let gradient;
        if (color === 'gradient') {
          gradient = ctx.createLinearGradient(x, y, x, y + normalizedHeight);
          gradient.addColorStop(0, '#22d3ee'); // cyan
          gradient.addColorStop(1, '#a855f7'); // purple
        } else {
          const colors = {
            cyan: '#22d3ee',
            purple: '#a855f7',
            green: '#4ade80'
          };
          gradient = colors[color];
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - spacing, normalizedHeight);

        // Animate bars if playing
        if (isPlaying) {
          // Smooth wave motion
          barsRef.current[i] += (Math.random() - 0.5) * 0.15;

          // Keep bars within bounds
          if (barsRef.current[i] > 1) barsRef.current[i] = 1;
          if (barsRef.current[i] < 0.2) barsRef.current[i] = 0.2;
        } else {
          // Slowly decay to resting state
          const restingHeight = 0.3;
          barsRef.current[i] += (restingHeight - barsRef.current[i]) * 0.05;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, barCount, height, color]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("w-full rounded-lg", className)}
      style={{ height: `${height}px` }}
    />
  );
}
