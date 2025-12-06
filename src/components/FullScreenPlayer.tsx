"use client";

import React, { useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, Heart, Share2, Repeat, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Waveform from './Waveform';

interface Track {
  name: string;
  artists: string;
  album: string;
  imageUrl?: string;
  duration: number;
}

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  track?: Track;
}

export default function FullScreenPlayer({
  isOpen,
  onClose,
  track = {
    name: 'Midnight City',
    artists: 'M83',
    album: 'Hurry Up, We\'re Dreaming',
    imageUrl: undefined,
    duration: 245 // seconds
  }
}: FullScreenPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(125);
  const [volume, setVolume] = useState(75);
  const [isLiked, setIsLiked] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / track.duration) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-audio-dark/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-300">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all group"
      >
        <X className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
      </button>

      <div className="max-w-5xl w-full">
        {/* Album Art Section */}
        <div className="relative mb-12">
          {/* Blurred Background */}
          <div
            className="absolute inset-0 -z-10 blur-3xl opacity-50 scale-110"
            style={{
              background: track.imageUrl
                ? `url(${track.imageUrl})`
                : 'linear-gradient(135deg, #22d3ee 0%, #a855f7 100%)'
            }}
          />

          {/* Album Art */}
          <div className="relative max-w-lg mx-auto">
            {track.imageUrl ? (
              <img
                src={track.imageUrl}
                alt={track.album}
                className="w-full aspect-square rounded-3xl shadow-2xl shadow-brand-purple/50"
              />
            ) : (
              <div className="w-full aspect-square rounded-3xl bg-brand-gradient shadow-2xl shadow-brand-purple/50 flex items-center justify-center">
                <div className="text-9xl">🎵</div>
              </div>
            )}

            {/* Floating particles effect */}
            <div className="absolute -inset-4 -z-10">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-brand-cyan/50 shadow-neon-cyan animate-pulse"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Track Info */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gradient mb-3">{track.name}</h1>
          <p className="text-2xl text-gray-400">{track.artists}</p>
          <p className="text-lg text-gray-500 mt-1">{track.album}</p>
        </div>

        {/* Waveform Visualizer */}
        <div className="mb-8">
          <Waveform isPlaying={isPlaying} height={80} barCount={60} />
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="relative h-2 bg-audio-highlight rounded-full overflow-hidden group cursor-pointer">
            <div
              className="absolute inset-y-0 left-0 bg-brand-gradient shadow-neon-cyan transition-all"
              style={{ width: `${progress}%` }}
            />
            {/* Hover thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, marginLeft: '-8px' }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(track.duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              isShuffle
                ? "text-brand-cyan shadow-neon-cyan"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all group">
            <SkipBack className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-20 h-20 rounded-full bg-brand-gradient shadow-neon-purple flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white fill-white" />
            ) : (
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            )}
          </button>

          <button className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/10 transition-all group">
            <SkipForward className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => setIsRepeat(!isRepeat)}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              isRepeat
                ? "text-brand-cyan shadow-neon-cyan"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Like & Share */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isLiked
                  ? "text-brand-purple shadow-neon-purple"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Heart className={cn("w-5 h-5", isLiked && "fill-brand-purple")} />
            </button>
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-gray-400" />
            <div className="w-32 h-2 bg-audio-highlight rounded-full overflow-hidden relative group">
              <div
                className="absolute inset-y-0 left-0 bg-brand-gradient transition-all"
                style={{ width: `${volume}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${volume}%`, marginLeft: '-6px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
