'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import RippleEffect from '@/components/RippleEffect';
import ParticleField from '@/components/ParticleField';
import { Music, Play, TrendingUp, Award, LogOut, User, Clock, Calendar, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserStats {
  totalPlays: number;
  uniqueTracks: number;
  uniqueArtists: number;
  estimatedListeningHours: number;
  firstPlayAt?: string;
  lastPlayAt?: string;
}

interface Streaks {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  isActiveToday: boolean;
}

interface Diversity {
  diversityScore: number;
  badge: string;
  interpretation: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [streaks, setStreaks] = useState<Streaks | null>(null);
  const [diversity, setDiversity] = useState<Diversity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      loadProfileData();
    }
  }, [status]);

  async function loadProfileData() {
    setLoading(true);
    try {
      const [statsRes, streaksRes, diversityRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/analytics/streaks'),
        fetch('/api/analytics/diversity?range=all')
      ]);

      if (!statsRes.ok || !streaksRes.ok || !diversityRes.ok) {
        console.error('One or more API requests failed');
        return;
      }

      const [statsData, streaksData, diversityData] = await Promise.all([
        statsRes.json(),
        streaksRes.json(),
        diversityRes.json()
      ]);

      setStats(statsData);
      setStreaks(streaksData);
      setDiversity(diversityData);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <>
        <Sidebar />
        <div className="min-h-screen flex items-center justify-center lg:ml-72 relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-brand-gradient mx-auto mb-6 flex items-center justify-center shadow-neon-cyan animate-pulse">
              <User className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-400 text-lg">Loading your profile...</p>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Sidebar />
        <div className="min-h-screen flex items-center justify-center p-8 lg:ml-72 relative z-10">
          <div className="text-center glass-panel p-12 rounded-3xl max-w-md">
            <div className="w-20 h-20 rounded-full bg-brand-gradient mx-auto mb-6 flex items-center justify-center shadow-neon-purple">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-gradient">Sign in Required</h1>
            <p className="text-gray-400 mb-8">
              You need to be signed in to view your profile.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-brand-gradient text-white rounded-full hover:shadow-neon-cyan transition-all font-medium"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />

      <main className="flex-1 lg:ml-72 p-4 lg:p-8 z-10 relative min-h-screen pt-20 lg:pt-8">
        {/* Profile Header */}
        <div className="glass-panel rounded-3xl p-8 mb-8 relative overflow-hidden">
          <ParticleField particleCount={15} className="opacity-30" />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-purple/10 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Image */}
            {session.user.image ? (
              <div className="relative">
                <img
                  src={session.user.image}
                  alt={session.user.name || 'Profile'}
                  className="w-32 h-32 rounded-full border-4 border-brand-gradient shadow-neon-purple"
                />
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center shadow-neon-cyan">
                  <Music className="w-5 h-5 text-white" />
                </div>
              </div>
            ) : (
              <div className="relative w-32 h-32 rounded-full bg-brand-gradient flex items-center justify-center text-white text-5xl font-bold shadow-neon-purple">
                {session.user.name?.[0] || 'U'}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-audio-surface border-2 border-brand-cyan flex items-center justify-center">
                  <Music className="w-5 h-5 text-brand-cyan" />
                </div>
              </div>
            )}

            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-4xl font-bold text-gradient mb-2">
                {session.user.name || 'Music Lover'}
              </h2>
              <p className="text-gray-400 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" />
                {session.user.email}
              </p>

              {diversity && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gradient text-white rounded-full font-semibold shadow-neon-purple">
                  <Award className="w-5 h-5" />
                  {diversity.badge}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              <RippleEffect>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 glass-panel rounded-xl hover:bg-white/10 transition-all text-white font-medium flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Dashboard
                </Link>
              </RippleEffect>
              <RippleEffect>
                <Link
                  href="/"
                  className="px-6 py-3 glass-panel rounded-xl hover:bg-white/10 transition-all text-gray-400 hover:text-white font-medium text-center"
                >
                  Home
                </Link>
              </RippleEffect>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-panel rounded-2xl p-6 hover:bg-white/5 transition-all relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-cyan/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Total Plays</div>
                  <Play className="w-4 h-4 text-brand-cyan" />
                </div>
                <div className="text-4xl font-bold text-white">
                  {stats.totalPlays.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 hover:bg-white/5 transition-all relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-purple/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Unique Tracks</div>
                  <Music className="w-4 h-4 text-brand-purple" />
                </div>
                <div className="text-4xl font-bold text-white">
                  {stats.uniqueTracks.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 hover:bg-white/5 transition-all relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-green/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Artists</div>
                  <TrendingUp className="w-4 h-4 text-brand-green" />
                </div>
                <div className="text-4xl font-bold text-white">
                  {stats.uniqueArtists.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 hover:bg-white/5 transition-all relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-orange/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-400">Hours</div>
                  <Clock className="w-4 h-4 text-brand-orange" />
                </div>
                <div className="text-4xl font-bold text-white">
                  ~{stats.estimatedListeningHours.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Streaks & Diversity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Streaks */}
          {streaks && (
            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-orange/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-orange shadow-neon-green animate-pulse" />
                  Listening Streaks
                </h3>

                <div className="space-y-4">
                  <div className={cn(
                    "p-6 rounded-2xl border-2 relative overflow-hidden",
                    streaks.isActiveToday
                      ? "bg-gradient-to-br from-brand-orange/20 to-red-500/20 border-brand-orange"
                      : "glass-panel border-transparent"
                  )}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Current Streak</div>
                        <div className="text-4xl font-bold text-gradient">
                          {streaks.currentStreak} days
                        </div>
                      </div>
                      {streaks.isActiveToday && (
                        <div className="text-5xl animate-pulse">🔥</div>
                      )}
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Longest Streak</div>
                        <div className="text-3xl font-bold text-white">
                          {streaks.longestStreak} days
                        </div>
                      </div>
                      <div className="text-4xl">🏆</div>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Total Active Days</div>
                        <div className="text-3xl font-bold text-white">
                          {streaks.totalDaysActive}
                        </div>
                      </div>
                      <Calendar className="w-10 h-10 text-brand-cyan" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diversity Score */}
          {diversity && (
            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-purple/10 blur-3xl rounded-full" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-purple shadow-neon-purple animate-pulse" />
                  Listening Diversity
                </h3>

                <div className="mb-8">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Diversity Score
                    </span>
                    <span className="text-2xl font-bold text-gradient">
                      {diversity.diversityScore}/100
                    </span>
                  </div>
                  <div className="w-full h-4 bg-audio-highlight rounded-full overflow-hidden">
                    <div
                      className="h-4 bg-brand-gradient rounded-full transition-all shadow-neon-cyan"
                      style={{ width: `${diversity.diversityScore}%` }}
                    />
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-brand-purple/30 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-brand-purple/10 blur-2xl rounded-full" />
                  <div className="relative z-10">
                    <div className="text-4xl mb-3 flex items-center gap-3">
                      <Award className="w-10 h-10 text-brand-purple" />
                      {diversity.badge}
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {diversity.interpretation}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/dashboard"
                    className="text-brand-cyan hover:underline inline-flex items-center gap-2"
                  >
                    View detailed analytics
                    <TrendingUp className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-cyan/10 blur-3xl rounded-full" />
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-brand-cyan shadow-neon-cyan animate-pulse" />
              Account Settings
            </h3>

            <div className="space-y-4">
              <div className="glass-panel p-6 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white mb-1">Spotify Connection</div>
                  <div className="text-sm text-gray-400">Connected and active</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-brand-green shadow-neon-green" />
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white mb-1">Automatic Archival</div>
                  <div className="text-sm text-gray-400">
                    {stats?.lastPlayAt
                      ? `Last archived: ${new Date(stats.lastPlayAt).toLocaleString()}`
                      : 'Not yet archived'}
                  </div>
                </div>
                <RippleEffect>
                  <Link
                    href="/test"
                    className="px-6 py-3 bg-brand-gradient text-white rounded-xl hover:shadow-neon-purple transition-all font-medium"
                  >
                    Run Now
                  </Link>
                </RippleEffect>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white mb-1">Sign Out</div>
                  <div className="text-sm text-gray-400">Disconnect your Spotify account</div>
                </div>
                <RippleEffect>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-6 py-3 glass-panel border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/10 transition-all font-medium flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </RippleEffect>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
