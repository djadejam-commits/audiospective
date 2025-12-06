"use client";

import React, { useState, useCallback } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface RippleEffectProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export default function RippleEffect({
  children,
  className = '',
  color = 'rgba(34, 211, 238, 0.4)'
}: RippleEffectProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const addRipple = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple: Ripple = {
      id: Date.now(),
      x,
      y
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  }, []);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseDown={addRipple}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none rounded-full animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '0px',
            height: '0px',
            backgroundColor: color,
            transform: 'translate(-50%, -50%)',
            animation: 'ripple 600ms ease-out'
          }}
        />
      ))}
      {children}

      <style jsx>{`
        @keyframes ripple {
          to {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
