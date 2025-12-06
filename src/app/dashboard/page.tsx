'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import Sidebar from '@/components/Sidebar';
import ActivityHeatmap from '@/components/ActivityHeatmap';
import FullScreenPlayer from '@/components/FullScreenPlayer';
import RippleEffect from '@/components/RippleEffect';
import ParticleField from '@/components/ParticleField';
import {
  Play,
  Download,
  Share2,
  TrendingUp,
  Music,
  Sparkles,
  Clock,
  Calendar,
  Headphones,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [showPlayer, setShowPlayer] = useState(false);

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
      <>
        <Sidebar />
        <div className="min-h-screen flex items-center justify-center ml-72 relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-brand-gradient mx-auto mb-6 flex items-center justify-center shadow-neon-cyan animate-pulse">
              <Music className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-400 text-lg">Loading your sonic universe...</p>
          </div>
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Sidebar />
        <div className="min-h-screen flex items-center justify-center p-8 ml-72 relative z-10">
          <div className="text-center glass-panel p-12 rounded-3xl max-w-md">
            <div className="w-20 h-20 rounded-full bg-brand-gradient mx-auto mb-6 flex items-center justify-center shadow-neon-purple">
              <Headphones className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-gradient">Sign in Required</h1>
            <p className="text-gray-400 mb-8">
              Connect your Spotify account to access your personalized audio intelligence dashboard.
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

  // Prepare chart data
  const chartData = activity.map(a => ({
    date: new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    plays: a.count
  }));

  const hourlyChartData = hourlyDistribution.map((count, hour) => ({
    hour: `${hour}:00`,
    plays: count
  }));

  return (
    <>
      <Sidebar />

      <main className="flex-1 lg:ml-72 p-4 lg:p-8 z-10 relative min-h-screen pt-20 lg:pt-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-start flex-wrap gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">
                Audio Intelligence
              </h1>
              <p className="text-gray-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Welcome back, {session?.user?.name}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative group">
                <button className="px-6 py-3 glass-panel rounded-full hover:bg-white/10 transition-all flex items-center gap-2 text-brand-cyan font-medium">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <div className="absolute right-0 mt-2 w-48 glass-panel rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors"
                  >
                    Export as JSON
                  </button>
                </div>
              </div>

              <button
                onClick={handleShare}
                className="px-6 py-3 bg-brand-gradient rounded-full hover:shadow-neon-purple transition-all flex items-center gap-2 font-medium"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>

              <Link
                href="/test"
                className="px-6 py-3 glass-panel rounded-full hover:bg-white/10 transition-all flex items-center gap-2 text-brand-green font-medium"
              >
                <Play className="w-4 h-4" />
                Run Archive
              </Link>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="mb-8 flex gap-3 glass-panel p-2 rounded-2xl inline-flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === 'overview'
                ? 'bg-brand-gradient text-white shadow-neon-cyan'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('genres')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === 'genres'
                ? 'bg-brand-gradient text-white shadow-neon-cyan'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            Genres
          </button>
          <button
            onClick={() => setActiveTab('comparison')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === 'comparison'
                ? 'bg-brand-gradient text-white shadow-neon-cyan'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            )}
          >
            Week Comparison
          </button>
        </div>

        {/* Date Range Filter */}
        {activeTab !== 'comparison' && (
          <div className="mb-8 flex gap-2">
            {(['1d', '7d', '30d', 'all'] as DateRange[]).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
                  dateRange === range
                    ? 'bg-brand-gradient text-white shadow-neon-cyan'
                    : 'glass-panel text-gray-400 hover:bg-white/10 hover:text-white'
                )}
              >
                {range === '1d' && 'Today'}
                {range === '7d' && 'Last 7 Days'}
                {range === '30d' && 'Last 30 Days'}
                {range === 'all' && 'All Time'}
              </button>
            ))}
          </div>
        )}

        {/* Stats Grid - Compact Bento Cards */}
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

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Large Chart - 2/3 width */}
              <div className="lg:col-span-2 glass-panel rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-cyan shadow-neon-cyan animate-pulse" />
                    Live Activity Pulse
                  </h2>
                  <Calendar className="w-5 h-5 text-gray-500" />
                </div>

                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPlays" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(18, 18, 20, 0.9)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="plays"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fill="url(#colorPlays)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No activity data available
                  </div>
                )}
              </div>

              {/* Trending Now - 1/3 width */}
              <div className="glass-panel rounded-3xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-purple" />
                  Trending Now
                </h2>

                {topTracks.length === 0 ? (
                  <p className="text-gray-500 text-sm">No data yet</p>
                ) : (
                  <div className="space-y-4">
                    {topTracks.slice(0, 5).map((item, index) => (
                      <div key={item.track.id} className="flex items-center gap-3 group">
                        <div className={cn(
                          "text-xl font-bold w-6 text-center",
                          index === 0 ? "text-brand-cyan" :
                          index === 1 ? "text-brand-purple" :
                          index === 2 ? "text-brand-green" : "text-gray-600"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white truncate group-hover:text-brand-cyan transition-colors">
                            {item.track.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {item.track.artists.map(a => a.name).join(', ')}
                          </div>
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-brand-gradient/20 text-brand-cyan text-xs font-bold">
                          {item.playCount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hourly Distribution Chart */}
            {hourlyChartData.some(h => h.plays > 0) && (
              <div className="glass-panel rounded-3xl p-8 mb-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-brand-purple" />
                  Listening Patterns by Hour
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={hourlyChartData}>
                    <defs>
                      <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="hour"
                      stroke="#6b7280"
                      style={{ fontSize: '11px' }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(18, 18, 20, 0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="plays"
                      stroke="#a855f7"
                      strokeWidth={2}
                      fill="url(#colorHourly)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Activity Heatmap */}
            <ActivityHeatmap className="mb-8" />

            {/* Recent Plays & Top Artists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Plays - 2/3 */}
              <div className="lg:col-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden">
                {/* Background Particles */}
                <ParticleField particleCount={20} className="opacity-30" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Play className="w-6 h-6 text-brand-green" />
                      Recent Plays
                    </h2>
                    <RippleEffect>
                      <button
                        onClick={() => setShowPlayer(true)}
                        className="px-4 py-2 glass-panel rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 text-brand-cyan"
                      >
                        <Maximize2 className="w-4 h-4" />
                        <span className="text-sm">Full Player</span>
                      </button>
                    </RippleEffect>
                  </div>

                  {recentPlays.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-brand-gradient/20 mx-auto mb-4 flex items-center justify-center">
                        <Music className="w-8 h-8 text-brand-cyan" />
                      </div>
                      <p className="text-gray-500 mb-4">No listening history yet</p>
                      <Link href="/test" className="text-brand-cyan hover:underline text-sm">
                        Run your first archive →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentPlays.slice(0, 10).map((play) => (
                        <RippleEffect key={play.id}>
                          <div
                            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer"
                            onClick={() => setShowPlayer(true)}
                          >
                        {play.track.album?.imageUrl ? (
                          <img
                            src={play.track.album.imageUrl}
                            alt={play.track.album.name}
                            className="w-12 h-12 rounded-lg shadow-lg group-hover:shadow-neon-cyan transition-shadow"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center shadow-lg">
                            <Music className="w-6 h-6 text-white" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate group-hover:text-brand-cyan transition-colors">
                            {play.track.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {play.track.artists.map(a => a.name).join(', ')}
                          </div>
                        </div>

                            <div className="text-xs text-gray-600 whitespace-nowrap">
                              {new Date(play.playedAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </RippleEffect>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Artists - 1/3 */}
              <div className="glass-panel rounded-3xl p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-orange" />
                  Top Artists
                </h2>

                {topArtists.length === 0 ? (
                  <p className="text-gray-500 text-sm">No data yet</p>
                ) : (
                  <div className="space-y-4">
                    {topArtists.slice(0, 5).map((item, index) => (
                      <div key={item.artist.id} className="flex items-center gap-3 group">
                        <div className={cn(
                          "text-xl font-bold w-6 text-center",
                          index === 0 ? "text-brand-cyan" :
                          index === 1 ? "text-brand-purple" :
                          index === 2 ? "text-brand-green" : "text-gray-600"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white truncate group-hover:text-brand-cyan transition-colors">
                            {item.artist.name}
                          </div>
                        </div>
                        <div className="px-2 py-1 rounded-lg bg-brand-gradient/20 text-brand-cyan text-xs font-bold">
                          {item.playCount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Genres Tab */}
        {activeTab === 'genres' && (
          <div className="glass-panel rounded-3xl p-8">
            <h2 className="text-3xl font-bold text-gradient mb-8">
              Genre Breakdown
            </h2>

            {genres.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-brand-gradient/20 mx-auto mb-4 flex items-center justify-center">
                  <Music className="w-8 h-8 text-brand-purple" />
                </div>
                <p className="text-gray-500">
                  No genre data available. Genres are fetched from artist metadata.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {genres.map((genre, index) => (
                  <div key={genre.genre} className="group">
                    <div className="flex items-center gap-4 mb-2">
                      <div className={cn(
                        "text-2xl font-bold w-10 text-center",
                        index === 0 ? "text-brand-cyan" :
                        index === 1 ? "text-brand-purple" :
                        index === 2 ? "text-brand-green" : "text-gray-600"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-white capitalize text-lg group-hover:text-brand-cyan transition-colors">
                            {genre.genre}
                          </span>
                          <span className="text-sm text-gray-500">
                            {genre.count} plays ({genre.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-audio-highlight rounded-full overflow-hidden">
                          <div
                            className="h-3 bg-brand-gradient rounded-full transition-all duration-500 shadow-neon-cyan"
                            style={{ width: `${Math.min(genre.percentage, 100)}%` }}
                          />
                        </div>
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
            <div className="glass-panel rounded-3xl p-8">
              <h2 className="text-3xl font-bold text-gradient mb-8">
                This Week vs Last Week
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-cyan/10 blur-2xl rounded-full" />
                  <div className="relative z-10">
                    <div className="text-sm text-gray-500 mb-2">Total Plays</div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {comparison.thisWeek.totalPlays}
                    </div>
                    <div className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      comparison.changes.totalPlays.value >= 0 ? 'text-brand-green' : 'text-red-500'
                    )}>
                      {comparison.changes.totalPlays.value >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(comparison.changes.totalPlays.value)} ({comparison.changes.totalPlays.percentage.toFixed(1)}%)
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-purple/10 blur-2xl rounded-full" />
                  <div className="relative z-10">
                    <div className="text-sm text-gray-500 mb-2">Unique Tracks</div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {comparison.thisWeek.uniqueTracks}
                    </div>
                    <div className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      comparison.changes.uniqueTracks.value >= 0 ? 'text-brand-green' : 'text-red-500'
                    )}>
                      {comparison.changes.uniqueTracks.value >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(comparison.changes.uniqueTracks.value)}
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-green/10 blur-2xl rounded-full" />
                  <div className="relative z-10">
                    <div className="text-sm text-gray-500 mb-2">Unique Artists</div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {comparison.thisWeek.uniqueArtists}
                    </div>
                    <div className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      comparison.changes.uniqueArtists.value >= 0 ? 'text-brand-green' : 'text-red-500'
                    )}>
                      {comparison.changes.uniqueArtists.value >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(comparison.changes.uniqueArtists.value)}
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-orange/10 blur-2xl rounded-full" />
                  <div className="relative z-10">
                    <div className="text-sm text-gray-500 mb-2">Avg Plays/Day</div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {comparison.thisWeek.avgPlaysPerDay.toFixed(1)}
                    </div>
                    <div className={cn(
                      "text-sm font-medium flex items-center gap-1",
                      comparison.changes.avgPlaysPerDay.value >= 0 ? 'text-brand-green' : 'text-red-500'
                    )}>
                      {comparison.changes.avgPlaysPerDay.value >= 0 ? '↑' : '↓'}{' '}
                      {Math.abs(comparison.changes.avgPlaysPerDay.value).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {comparison.topTracksThisWeek.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-cyan" />
                    Top Tracks This Week
                  </h3>
                  <div className="space-y-3">
                    {comparison.topTracksThisWeek.map((track, index) => (
                      <div key={index} className="flex justify-between items-center p-4 glass-panel rounded-xl hover:bg-white/5 transition-all group">
                        <div>
                          <div className="font-bold text-white group-hover:text-brand-cyan transition-colors">{track.name}</div>
                          <div className="text-sm text-gray-500">{track.artists}</div>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-brand-gradient/20 text-brand-cyan text-sm font-bold">
                          {track.playCount} plays
                        </div>
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

      {/* Full Screen Player */}
      <FullScreenPlayer
        isOpen={showPlayer}
        onClose={() => setShowPlayer(false)}
        track={
          recentPlays[0]?.track
            ? {
                name: recentPlays[0].track.name,
                artists: recentPlays[0].track.artists.map(a => a.name).join(', '),
                album: recentPlays[0].track.album?.name || '',
                imageUrl: recentPlays[0].track.album?.imageUrl,
                duration: Math.floor(recentPlays[0].track.durationMs / 1000)
              }
            : undefined
        }
      />
    </>
  );
}
