'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Music, BarChart3, Shield, Sparkles, LogOut, Disc3 } from 'lucide-react';
import RippleEffect from '@/components/RippleEffect';
import ParticleField from '@/components/ParticleField';
import Waveform from '@/components/Waveform';

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="relative min-h-screen bg-audio-dark overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-subtle-glow pointer-events-none z-0" />
      <ParticleField particleCount={30} className="opacity-20" />

      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-16">
            {/* Logo */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center shadow-neon-purple animate-pulse">
                <Disc3 className="text-white w-8 h-8 animate-spin-slow" />
              </div>
              <h1 className="text-7xl font-bold tracking-tight text-gradient">
                Audiospective
              </h1>
            </div>

            <p className="text-2xl text-gray-400 mb-4">
              Your Complete Spotify Listening History
            </p>
            <p className="text-lg text-gray-500">
              Automatically archived every hour. Never lose a track.
            </p>

            {/* Decorative Waveform */}
            <div className="mt-8 max-w-2xl mx-auto">
              <Waveform isPlaying={true} height={60} barCount={50} />
            </div>
          </div>

          {/* Auth Status Card */}
          {status === 'loading' && (
            <div className="glass-panel rounded-3xl p-8 mb-12 text-center relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-cyan/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full bg-brand-gradient mx-auto mb-4 flex items-center justify-center shadow-neon-cyan animate-pulse">
                  <Music className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-400 text-lg">Loading your sonic universe...</p>
              </div>
            </div>
          )}

          {status === 'authenticated' && session?.user && (
            <div className="glass-panel rounded-3xl p-8 mb-12 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-purple/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-brand-green shadow-neon-green animate-pulse" />
                  <p className="text-white font-semibold text-xl">
                    Welcome back, {session.user.name || session.user.email}!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <RippleEffect>
                    <Link
                      href="/dashboard"
                      className="px-6 py-4 bg-brand-gradient text-white font-semibold rounded-2xl hover:shadow-neon-purple transition-all text-center block"
                    >
                      <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                      Dashboard
                    </Link>
                  </RippleEffect>

                  <RippleEffect>
                    <Link
                      href="/test"
                      className="px-6 py-4 glass-panel text-brand-cyan font-semibold rounded-2xl hover:bg-white/10 transition-all text-center block"
                    >
                      <Sparkles className="w-5 h-5 mx-auto mb-1" />
                      Test Archive
                    </Link>
                  </RippleEffect>

                  <RippleEffect>
                    <Link
                      href="/me"
                      className="px-6 py-4 glass-panel text-white font-semibold rounded-2xl hover:bg-white/10 transition-all text-center block"
                    >
                      <Music className="w-5 h-5 mx-auto mb-1" />
                      Profile
                    </Link>
                  </RippleEffect>

                  <RippleEffect>
                    <button
                      onClick={() => signOut()}
                      className="px-6 py-4 glass-panel text-gray-400 font-semibold rounded-2xl hover:bg-white/10 hover:text-white transition-all text-center w-full"
                    >
                      <LogOut className="w-5 h-5 mx-auto mb-1" />
                      Sign Out
                    </button>
                  </RippleEffect>
                </div>
              </div>
            </div>
          )}

          {status === 'unauthenticated' && (
            <div className="text-center mb-12">
              <RippleEffect>
                <button
                  onClick={() => signIn('spotify')}
                  className="px-12 py-5 bg-brand-gradient text-white font-bold text-lg rounded-full hover:shadow-neon-purple transition-all inline-flex items-center gap-3"
                >
                  <Music className="w-6 h-6" />
                  Sign in with Spotify
                </button>
              </RippleEffect>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-panel rounded-3xl p-6 hover:bg-white/5 transition-all group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-cyan/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-brand-cyan/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Music className="w-7 h-7 text-brand-cyan" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">Never Lose Your History</h3>
                <p className="text-sm text-gray-400">
                  Spotify only shows 50 recent tracks. We archive everything, forever.
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 hover:bg-white/5 transition-all group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-purple/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-brand-purple/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7 text-brand-purple" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">Deep Analytics</h3>
                <p className="text-sm text-gray-400">
                  Discover your top tracks, artists, genres, and listening patterns with beautiful visualizations.
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 hover:bg-white/5 transition-all group relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-green/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-brand-green/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-brand-green" />
                </div>
                <h3 className="font-bold text-white text-lg mb-2">Privacy First</h3>
                <p className="text-sm text-gray-400">
                  Your data stays with you. We never share or sell your listening history.
                </p>
              </div>
            </div>
          </div>

          {/* Status Banner */}
          <div className="glass-panel rounded-3xl p-6 border border-brand-cyan/20 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-cyan/10 blur-3xl rounded-full" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-cyan/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-brand-cyan animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Phase 2 Complete! 🎉</h3>
                <p className="text-gray-400 mb-3">
                  Background polling system is ready. Your listening history will be archived automatically every hour.
                </p>
                {status === 'authenticated' ? (
                  <p className="text-sm text-gray-500">
                    Visit{' '}
                    <Link href="/test" className="text-brand-cyan hover:underline font-semibold">
                      /test
                    </Link>
                    {' '}to try manual archival or{' '}
                    <Link href="/dashboard" className="text-brand-cyan hover:underline font-semibold">
                      /dashboard
                    </Link>
                    {' '}to view your stats.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Sign in above to start archiving your listening history.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <a
              href="https://github.com/anthropics/claude-code"
              className="text-sm text-gray-500 hover:text-brand-cyan transition-colors inline-flex items-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Built with Claude Code</span>
              <Sparkles className="w-4 h-4" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
