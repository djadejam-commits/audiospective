'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';

// [Previous interface definitions remain the same...]
interface Stats {
  totalPlays: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  estimatedListeningHours: number;
  firstPlayAt?: string;
  lastPlayAt?: string;
}

interface Track {
  id: string;
  name: string;
  durationMs: number;
  album: { name: string; imageUrl?: string } | null;
  artists: Array<{ id: string; name: string }>;
}

interface Play {
  id: string;
  playedAt: string;
  track: Track;
}

interface TopTrack {
  playCount: number;
  track: Track;
}

interface TopArtist {
  playCount: number;
  artist: { id: string; name: string };
}

interface Activity {
  date: string;
  count: number;
}

interface Genre {
  genre: string;
  count: number;
  percentage: number;
}

interface Comparison {
  thisWeek: any;
  lastWeek: any;
  changes: any;
  topTracksThisWeek: any[];
}

type DateRange = '1d' | '7d' | '30d' | 'all';
type Tab = 'overview' | 'genres' | 'comparison';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { toasts, success, error, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPlays, setRecentPlays] = useState<Play[]>([]);
  const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
  const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [hourlyDistribution, setHourlyDistribution] = useState<number[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [_shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      loadDashboardData();
    }
  }, [status, dateRange, activeTab]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const requests: Promise<Response>[] = [
        fetch('/api/stats'),
        fetch('/api/recent-plays?limit=20'),
        fetch('/api/top-tracks?limit=10'),
        fetch('/api/top-artists?limit=10'),
        fetch(`/api/activity?range=${dateRange}`)
      ];

      if (activeTab === 'genres') {
        requests.push(fetch(`/api/genres?range=${dateRange}`));
      }

      if (activeTab === 'comparison') {
        requests.push(fetch('/api/comparison'));
      }

      const responses = await Promise.all(requests);

      // Check if any responses failed (401, 500, etc.)
      const hasError = responses.some(r => !r.ok);
      if (hasError) {
        console.error('One or more API requests failed');
        return;
      }

      const data = await Promise.all(responses.map(r => r.json()));

      setStats(data[0]);
      setRecentPlays(data[1].plays || []);
      setTopTracks(data[2].topTracks || []);
      setTopArtists(data[3].topArtists || []);
      setActivity(data[4].activity || []);
      setHourlyDistribution(data[4].hourlyDistribution || []);

      if (activeTab === 'genres' && data[5]) {
        setGenres(data[5].topGenres || []);
      }

      if (activeTab === 'comparison' && data[5]) {
        setComparison(data[5]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: 'csv' | 'json') {
    try {
      const response = await fetch(`/api/export?format=${format}&range=${dateRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spotify-history-${dateRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      success(`Exported as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error('Export failed:', err);
      error('Export failed. Please try again.');
    }
  }

  async function handleShare() {
    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${session?.user?.name}'s Listening Report`,
          dateRange: dateRange
        })
      });

      const data = await response.json();
      if (data.shareUrl) {
        setShareUrl(data.shareUrl);
        // Copy to clipboard
        await navigator.clipboard.writeText(data.shareUrl);
        success('Share link copied to clipboard!');
      } else {
        error(data.error || 'Failed to create share link');
      }
    } catch (err) {
      console.error('Share failed:', err);
      error('Share failed. Please try again.');
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your music history...</p>
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
            You need to be signed in to view your dashboard.
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

  const maxActivityCount = Math.max(...activity.map(a => a.count), 1);
  const maxHourlyCount = Math.max(...hourlyDistribution, 1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎵 My Music History
            </h1>
            <div className="flex gap-2 flex-wrap">
              {/* Export Dropdown */}
              <div className="relative group">
                <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                  📥 Export
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-t-lg"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-b-lg"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
              >
                🔗 Share
              </button>

              <Link
                href="/test"
                className="px-4 py-2 text-sm border border-green-600 text-green-600 rounded-full hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
              >
                Run Archive
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('genres')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'genres'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Genres
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'comparison'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Week Comparison
          </button>
        </div>

        {/* Date Range Filter (except for comparison tab) */}
        {activeTab !== 'comparison' && (
          <div className="mb-6 flex gap-2">
            {(['1d', '7d', '30d', 'all'] as DateRange[]).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                {range === '1d' && 'Today'}
                {range === '7d' && 'Last 7 Days'}
                {range === '30d' && 'Last 30 Days'}
                {range === 'all' && 'All Time'}
              </button>
            ))}
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-200 dark:border-zinc-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Plays</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalPlays.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-200 dark:border-zinc-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unique Tracks</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.uniqueTracks.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-200 dark:border-zinc-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unique Artists</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.uniqueArtists.toLocaleString()}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-gray-200 dark:border-zinc-800">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Listening Hours</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ~{stats.estimatedListeningHours.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Activity Charts - keeping existing code */}
            {activity.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Listening Activity
                </h2>
                <div className="flex items-end gap-1 h-32">
                  {activity.map((day) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                        style={{
                          height: `${(day.count / maxActivityCount) * 100}%`,
                          minHeight: day.count > 0 ? '4px' : '0'
                        }}
                        title={`${day.date}: ${day.count} plays`}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-500 rotate-45 origin-top-left mt-2">
                        {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hourly Distribution */}
            {hourlyDistribution.some(h => h > 0) && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Listening Patterns by Hour
                </h2>
                <div className="flex items-end gap-1 h-24">
                  {hourlyDistribution.map((count, hour) => (
                    <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{
                          height: `${(count / maxHourlyCount) * 100}%`,
                          minHeight: count > 0 ? '2px' : '0'
                        }}
                        title={`${hour}:00 - ${count} plays`}
                      />
                      {hour % 3 === 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {hour}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 text-center mt-2">
                  Hours (24h format)
                </div>
              </div>
            )}

            {/* Recent Plays & Top Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Plays */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Recent Plays
                  </h2>

                  {recentPlays.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No listening history yet
                      </p>
                      <Link href="/test" className="text-green-600 hover:underline">
                        Run your first archive →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentPlays.map((play) => (
                        <div
                          key={play.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {play.track.album?.imageUrl ? (
                            <img
                              src={play.track.album.imageUrl}
                              alt={play.track.album.name}
                              className="w-12 h-12 rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                              🎵
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 dark:text-white truncate">
                              {play.track.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {play.track.artists.map(a => a.name).join(', ')}
                            </div>
                          </div>

                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(play.playedAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Top Tracks */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Top Tracks
                  </h2>

                  {topTracks.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      No data yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {topTracks.slice(0, 5).map((item, index) => (
                        <div key={item.track.id} className="flex items-center gap-3">
                          <div className="text-lg font-bold text-gray-400 w-6">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              {item.track.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {item.track.artists.map(a => a.name).join(', ')}
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-green-600">
                            {item.playCount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Artists */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Top Artists
                  </h2>

                  {topArtists.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      No data yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {topArtists.slice(0, 5).map((item, index) => (
                        <div key={item.artist.id} className="flex items-center gap-3">
                          <div className="text-lg font-bold text-gray-400 w-6">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              {item.artist.name}
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-green-600">
                            {item.playCount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Genres Tab */}
        {activeTab === 'genres' && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Genre Breakdown
            </h2>

            {genres.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-12">
                No genre data available. Genres are fetched from artist metadata.
              </p>
            ) : (
              <div className="space-y-3">
                {genres.map((genre, index) => (
                  <div key={genre.genre} className="flex items-center gap-4">
                    <div className="text-lg font-bold text-gray-400 w-8">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white capitalize">
                          {genre.genre}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {genre.count} plays ({genre.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                          style={{ width: `${Math.min(genre.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && comparison && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                This Week vs Last Week
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Plays</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {comparison.thisWeek.totalPlays}
                  </div>
                  <div className={`text-sm mt-1 ${
                    comparison.changes.totalPlays.value >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparison.changes.totalPlays.value >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(comparison.changes.totalPlays.value)} ({comparison.changes.totalPlays.percentage.toFixed(1)}%)
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unique Tracks</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {comparison.thisWeek.uniqueTracks}
                  </div>
                  <div className={`text-sm mt-1 ${
                    comparison.changes.uniqueTracks.value >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparison.changes.uniqueTracks.value >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(comparison.changes.uniqueTracks.value)}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unique Artists</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {comparison.thisWeek.uniqueArtists}
                  </div>
                  <div className={`text-sm mt-1 ${
                    comparison.changes.uniqueArtists.value >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparison.changes.uniqueArtists.value >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(comparison.changes.uniqueArtists.value)}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Plays/Day</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {comparison.thisWeek.avgPlaysPerDay.toFixed(1)}
                  </div>
                  <div className={`text-sm mt-1 ${
                    comparison.changes.avgPlaysPerDay.value >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparison.changes.avgPlaysPerDay.value >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(comparison.changes.avgPlaysPerDay.value).toFixed(1)}
                  </div>
                </div>
              </div>

              {comparison.topTracksThisWeek.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Top Tracks This Week
                  </h3>
                  <div className="space-y-2">
                    {comparison.topTracksThisWeek.map((track, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800 rounded">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{track.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{track.artists}</div>
                        </div>
                        <div className="text-sm font-semibold text-green-600">{track.playCount} plays</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
