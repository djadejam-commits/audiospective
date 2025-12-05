'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

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

      // Check if any responses failed (401, 500, etc.)
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
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be signed in to view your profile.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Profile
            </h1>
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Dashboard
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-8 mb-8">
          <div className="flex items-start gap-6">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'Profile'}
                className="w-24 h-24 rounded-full border-4 border-green-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-4xl font-bold">
                {session.user.name?.[0] || 'U'}
              </div>
            )}

            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {session.user.name || 'Music Lover'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {session.user.email}
              </p>

              {diversity && (
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-semibold">
                  🏆 {diversity.badge}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Plays</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalPlays.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unique Tracks</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.uniqueTracks.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unique Artists</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.uniqueArtists.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Listening Hours</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ~{stats.estimatedListeningHours.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Streaks */}
          {streaks && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🔥 Listening Streaks
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-lg border border-orange-200 dark:border-orange-900">
                  <div>
                    <div className="text-sm text-orange-700 dark:text-orange-400">Current Streak</div>
                    <div className="text-3xl font-bold text-orange-900 dark:text-orange-300">
                      {streaks.currentStreak} days
                    </div>
                  </div>
                  {streaks.isActiveToday && (
                    <div className="text-2xl">🔥</div>
                  )}
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {streaks.longestStreak} days
                    </div>
                  </div>
                  <div className="text-2xl">🏆</div>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Active Days</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {streaks.totalDaysActive}
                    </div>
                  </div>
                  <div className="text-2xl">📅</div>
                </div>
              </div>
            </div>
          )}

          {/* Diversity Score */}
          {diversity && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🎨 Listening Diversity
              </h3>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Diversity Score</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {diversity.diversityScore}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${diversity.diversityScore}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-900">
                <div className="text-2xl mb-2">🏆 {diversity.badge}</div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {diversity.interpretation}
                </p>
              </div>

              <div className="mt-4">
                <Link
                  href="/dashboard"
                  className="text-sm text-green-600 hover:underline"
                >
                  View detailed analytics →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="mt-8 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Account Settings
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-zinc-800">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Spotify Connection</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Connected and active</div>
              </div>
              <div className="text-green-600">✓</div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-zinc-800">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Automatic Archival</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stats?.lastPlayAt
                    ? `Last archived: ${new Date(stats.lastPlayAt).toLocaleString()}`
                    : 'Not yet archived'}
                </div>
              </div>
              <Link
                href="/test"
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
              >
                Run Now
              </Link>
            </div>

            <div className="flex justify-between items-center py-3">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Sign Out</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Disconnect your Spotify account</div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 text-sm border border-red-600 text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
