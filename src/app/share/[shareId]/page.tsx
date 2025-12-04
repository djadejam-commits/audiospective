'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-black dark:via-zinc-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-black dark:via-zinc-900 dark:to-black flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-8 text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Report Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'This report does not exist or has been removed.'}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
          >
            Go to Home
          </Link>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-black dark:via-zinc-900 dark:to-black">
      {/* Header */}
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                🎵 Shared Listening Report
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {report.viewCount} {report.viewCount === 1 ? 'view' : 'views'}
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
            >
              Create Your Own
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Report Header Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 mb-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {report.title}
            </h2>
            {report.description && (
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {report.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              Shared by {report.userName} • {createdDate}
            </p>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-900">
              <div className="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
                Total Plays
              </div>
              <div className="text-4xl font-bold text-green-900 dark:text-green-300">
                {report.reportData.totalPlays.toLocaleString()}
              </div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-900">
              <div className="text-sm text-blue-700 dark:text-blue-400 font-medium mb-1">
                Top Tracks
              </div>
              <div className="text-4xl font-bold text-blue-900 dark:text-blue-300">
                {report.reportData.topTracks.length}
              </div>
            </div>
          </div>
        </div>

        {/* Top Tracks */}
        {report.reportData.topTracks.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🎧 Top Tracks
            </h3>

            <div className="space-y-4">
              {report.reportData.topTracks.map((track, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-600 dark:to-emerald-700 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                      {track.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {track.artists}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {track.playCount}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      plays
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-8 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Want to track your own listening history?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect your Spotify account and start building your music time machine
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-zinc-800 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Powered by Spotify Time Machine</p>
        </div>
      </footer>
    </div>
  );
}
