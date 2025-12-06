"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface HeatmapProps {
  data?: number[][]; // 7 days x 24 hours
  className?: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ActivityHeatmap({ data, className }: HeatmapProps) {
  // Generate mock data if not provided (for demo purposes)
  const heatmapData = data || Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => Math.floor(Math.random() * 100))
  );

  // Find max value for normalization
  const maxValue = Math.max(...heatmapData.flat());

  // Get color intensity based on value
  const getIntensityColor = (value: number) => {
    if (value === 0) return 'bg-audio-highlight/30';

    const intensity = value / maxValue;

    if (intensity > 0.8) return 'bg-brand-purple shadow-neon-purple';
    if (intensity > 0.6) return 'bg-brand-cyan/80';
    if (intensity > 0.4) return 'bg-brand-cyan/60';
    if (intensity > 0.2) return 'bg-brand-cyan/40';
    return 'bg-brand-cyan/20';
  };

  return (
    <div className={cn("glass-panel rounded-3xl p-8", className)}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-brand-purple shadow-neon-purple animate-pulse" />
          Activity Heatmap
        </h2>
        <p className="text-sm text-gray-400">
          Your listening patterns across the week
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-2 min-w-full">
          {/* Hour Labels */}
          <div className="flex gap-1 pl-12">
            {HOURS.filter((_, i) => i % 3 === 0).map((hour) => (
              <div
                key={hour}
                className="text-xs text-gray-500 w-16 text-center"
              >
                {hour}h
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          {heatmapData.map((dayData, dayIndex) => (
            <div key={dayIndex} className="flex items-center gap-2">
              {/* Day Label */}
              <div className="w-10 text-xs font-medium text-gray-400">
                {DAYS[dayIndex]}
              </div>

              {/* Hour Cells */}
              <div className="flex gap-1">
                {dayData.map((value, hourIndex) => (
                  <div
                    key={hourIndex}
                    className={cn(
                      "w-7 h-7 rounded-md transition-all duration-300 hover:scale-110 cursor-pointer group relative",
                      getIntensityColor(value)
                    )}
                    title={`${DAYS[dayIndex]} ${hourIndex}:00 - ${value} plays`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 glass-panel rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="font-semibold text-white">{value} plays</div>
                      <div className="text-gray-400">{DAYS[dayIndex]} {hourIndex}:00</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
            <span className="text-xs text-gray-500">Less</span>
            <div className="flex gap-1">
              {[0, 20, 40, 60, 80, 100].map((intensity) => (
                <div
                  key={intensity}
                  className={cn(
                    "w-4 h-4 rounded",
                    getIntensityColor(intensity)
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
