"use client";

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-16 h-8 rounded-full glass-panel p-1 transition-all hover:bg-white/10 group"
      aria-label="Toggle theme"
    >
      {/* Track */}
      <div
        className={cn(
          "absolute inset-1 rounded-full bg-brand-gradient transition-transform",
          theme === 'light' ? 'translate-x-0' : 'translate-x-8'
        )}
      />

      {/* Icons Container */}
      <div className="relative z-10 flex items-center justify-between px-1">
        <Sun
          className={cn(
            "w-4 h-4 transition-colors",
            theme === 'light' ? 'text-white' : 'text-gray-500'
          )}
        />
        <Moon
          className={cn(
            "w-4 h-4 transition-colors",
            theme === 'dark' ? 'text-white' : 'text-gray-500'
          )}
        />
      </div>

      {/* Sliding Ball */}
      <div
        className={cn(
          "absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-300",
          theme === 'light' ? 'left-1' : 'left-9'
        )}
      />
    </button>
  );
}
