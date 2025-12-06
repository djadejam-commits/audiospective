'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Music, TrendingUp, Eye, Sparkles, Home } from 'lucide-react';
import ParticleField from '@/components/ParticleField';
import RippleEffect from '@/components/RippleEffect';

interface ReportData {
  totalPlays: number;
  userName: string;
  topTracks: Array<{
    name: string;
    artists: string;
    playCount: number;
  }>;
  generatedAt: string;
}

interface Report {
  title: string;
  description: string | null;
  reportData: ReportData;
  createdAt: string;
  viewCount: number;
  userName: string;
}

export default function SharePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareId) {
      loadReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  async function loadReport() {
    try {
      const response = await fetch(`/api/share?id=${shareId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('Report not found or has been made private');
        } else {
          setError('Failed to load report');
        }
        return;
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-audio-dark overflow-hidden relative flex items-center justify-center">
        <div className="fixed inset-0 bg-subtle-glow pointer-events-none z-0" />
        <ParticleField particleCount={30} className="opacity-20" />
        <div className="text-center relative z-10">
          <div className="w-16 h-16 rounded-full bg-brand-gradient mx-auto mb-4 flex items-center justify-center shadow-neon-cyan animate-pulse">
            <Music className="w-8 h-8 text-white animate-spin-slow" />
          </div>
          <p className="text-gray-400 text-lg">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-audio-dark overflow-hidden relative flex items-center justify-center p-8">
        <div className="fixed inset-0 bg-subtle-glow pointer-events-none z-0" />
        <ParticleField particleCount={30} className="opacity-20" />
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 text-center relative overflow-hidden z-10">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-purple/10 blur-3xl rounded-full" />
          <div className="relative z-10">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Report Not Found
            </h1>
            <p className="text-gray-400 mb-6">
              {error || 'This report does not exist or has been removed.'}
            </p>
            <RippleEffect>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-gradient text-white font-semibold rounded-full hover:shadow-neon-purple transition-all"
              >
                <Home className="w-5 h-5" />
                Go to Home
              </Link>
            </RippleEffect>
          </div>
        </div>
      </div>
    );
  }

  const createdDate = new Date(report.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-audio-dark overflow-hidden relative">
      <div className="fixed inset-0 bg-subtle-glow pointer-events-none z-0" />
      <ParticleField particleCount={40} className="opacity-20" />

      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Header */}
      <header className="glass-panel/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gradient flex items-center gap-2">
                <Music className="w-6 h-6 text-brand-cyan" />
                Shared Listening Report
              </h1>
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                <Eye className="w-4 h-4" />
                {report.viewCount} {report.viewCount === 1 ? 'view' : 'views'}
              </p>
            </div>
            <RippleEffect>
              <Link
                href="/"
                className="px-4 py-2 text-sm bg-brand-gradient text-white font-semibold rounded-full hover:shadow-neon-purple transition-all"
              >
                Create Your Own
              </Link>
            </RippleEffect>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Report Header Card */}
        <div className="glass-panel rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-purple/10 blur-3xl rounded-full" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-cyan/10 blur-3xl rounded-full" />
          <div className="relative z-10 text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-2">
              {report.title}
            </h2>
            {report.description && (
              <p className="text-gray-400 text-lg">
                {report.description}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Shared by {report.userName} • {createdDate}
            </p>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 relative z-10">
            <div className="text-center p-6 glass-panel rounded-2xl border border-brand-green/20 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-green/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 text-sm text-brand-green font-medium mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Total Plays
                </div>
                <div className="text-4xl font-bold text-white">
                  {report.reportData.totalPlays.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-center p-6 glass-panel rounded-2xl border border-brand-cyan/20 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-cyan/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 text-sm text-brand-cyan font-medium mb-1">
                  <Music className="w-4 h-4" />
                  Top Tracks
                </div>
                <div className="text-4xl font-bold text-white">
                  {report.reportData.topTracks.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Tracks */}
        {report.reportData.topTracks.length > 0 && (
          <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-purple/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-gradient mb-6 flex items-center gap-2">
                <Music className="w-6 h-6 text-brand-purple" />
                Top Tracks
              </h3>

              <div className="space-y-3">
                {report.reportData.topTracks.map((track, index) => (
                  <RippleEffect key={index}>
                    <div className="flex items-center gap-4 p-4 rounded-2xl glass-panel hover:bg-white/10 transition-all group cursor-pointer">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-neon-purple group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-xl">
                          {index + 1}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-lg truncate">
                          {track.name}
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                          {track.artists}
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        <div className="text-lg font-bold text-brand-green">
                          {track.playCount}
                        </div>
                        <div className="text-xs text-gray-500">
                          plays
                        </div>
                      </div>
                    </div>
                  </RippleEffect>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <div className="inline-block glass-panel rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-cyan/10 blur-3xl rounded-full" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-brand-purple/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-2">
                Want to track your own listening history?
              </h3>
              <p className="text-gray-400 mb-6">
                Connect your Spotify account and start building your music time machine
              </p>
              <RippleEffect>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-brand-gradient text-white font-semibold rounded-full hover:shadow-neon-purple transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Get Started Free
                </Link>
              </RippleEffect>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          <p>Powered by Audiospective</p>
        </div>
      </footer>
    </div>
  );
}
