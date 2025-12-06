"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Library,
  BarChart2,
  User,
  Settings,
  Disc3,
  SkipBack,
  Play,
  SkipForward,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Waveform from "./Waveform";
import ThemeToggle from "./ThemeToggle";

interface MenuItem {
  name: string;
  icon: React.ElementType;
  href: string;
}

export default function Sidebar() {
  const [active, setActive] = useState("Dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const menuItems: MenuItem[] = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Profile", icon: User, href: "/me" },
    { name: "Library", icon: Library, href: "/library" },
    { name: "Analytics", icon: BarChart2, href: "/analytics" },
    { name: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] w-12 h-12 rounded-xl bg-audio-surface/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen w-72 bg-audio-surface/30 backdrop-blur-xl border-r border-white/5 flex flex-col z-50 transition-transform duration-300",
        // Mobile: slide in/out
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Logo / Brand */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center shadow-neon-purple">
          <Disc3 className="text-white w-5 h-5 animate-spin-slow" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gradient">
          Audiospective
        </h1>
      </div>

      {/* Theme Toggle */}
      <div className="px-8 mb-4">
        <ThemeToggle />
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4">
          Menu
        </div>
        {menuItems.map((item) => {
          const isActive = active === item.name;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setActive(item.name)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive
                  ? "bg-brand-gradient text-white shadow-neon-cyan"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover:text-white"
                )}
              />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Now Playing Mini Player */}
      <div className="p-4 mt-auto">
        <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
          {/* Background Glow */}
          <div className="absolute -right-10 -top-10 w-24 h-24 bg-brand-purple/20 blur-2xl rounded-full pointer-events-none" />

          {/* Track Info */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-purple flex-shrink-0" />
            <div className="overflow-hidden">
              <h4 className="text-white text-sm font-semibold truncate">
                Midnight City
              </h4>
              <p className="text-xs text-gray-400 truncate">M83</p>
            </div>
          </div>

          {/* Animated Waveform */}
          <div className="relative z-10">
            <Waveform isPlaying={isPlaying} height={40} barCount={30} />
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between mt-1 px-1 relative z-10">
            <SkipBack className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
            <div
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <Play className="w-3 h-3 text-black fill-black ml-0.5" />
            </div>
            <SkipForward className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
