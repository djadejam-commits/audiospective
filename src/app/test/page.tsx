'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import { Play, Music, TrendingUp, AlertCircle, CheckCircle, Info, Home } from 'lucide-react';
import ParticleField from '@/components/ParticleField';
import RippleEffect from '@/components/RippleEffect';
import Sidebar from '@/components/Sidebar';

export default function TestPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function runArchiveTest() {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    // Simulate progress (archive typically takes 70-85 seconds)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev; // Cap at 95% until complete
        return prev + 1;
      });
    }, 800); // Update every 800ms

    try {
      const response = await fetch('/api/test-archive');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Archive test failed');
      }

      setProgress(100);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-audio-dark overflow-hidden relative flex items-center justify-center">
        <div className="fixed inset-0 bg-subtle-glow pointer-events-none z-0" />
        <ParticleField particleCount={30} className="opacity-20" />
        <div className="text-center relative z-10">
          <div className="w-16 h-16 rounded-full bg-brand-gradient mx-auto mb-4 flex items-center justify-center shadow-neon-cyan animate-pulse">
            <Music className="w-8 h-8 text-white animate-spin-slow" />
          </div>
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-audio-dark overflow-hidden relative">
        <div className="fixed inset-0 bg-subtle-glow pointer-events-none z-0" />
        <ParticleField particleCount={30} className="opacity-20" />
        <div className="flex items-center justify-center min-h-screen p-8 relative z-10">
          <div className="glass-panel rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-cyan/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <h1 className="text-2xl font-bold text-gradient mb-4">Archive Test</h1>
              <p className="mb-6 text-gray-400">You need to be signed in to test the archival system.</p>
              <RippleEffect>
                <Link
                  href="/api/auth/signin"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-gradient text-white font-semibold rounded-full hover:shadow-neon-purple transition-all"
                >
                  <Music className="w-5 h-5" />
                  Sign in with Spotify
                </Link>
              </RippleEffect>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-audio-dark overflow-hidden relative">
      <div className="fixed inset-0 bg-subtle-glow pointer-events-none z-0" />
      <ParticleField particleCount={40} className="opacity-20" />
      <Sidebar />

      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <main className="flex-1 lg:ml-72 p-4 lg:p-8 z-10 relative min-h-screen pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gradient mb-2">Archive System Test</h1>
          <p className="text-gray-400 mb-8">Manually trigger the archive worker to test the system</p>

          <div className="mb-6 glass-panel rounded-2xl p-6 border border-brand-cyan/20 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-cyan/10 blur-2xl rounded-full" />
            <div className="relative z-10 flex items-start gap-3">
              <Info className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-300">
                  <strong className="text-brand-cyan">Note:</strong> This endpoint manually triggers the archive worker for your account.
                  It will fetch your recently played tracks from Spotify and store them in the database.
                </p>
              </div>
            </div>
          </div>

          <RippleEffect>
            <button
              onClick={runArchiveTest}
              disabled={loading}
              className="px-6 py-3 bg-brand-gradient text-white font-semibold rounded-xl hover:shadow-neon-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              {loading ? 'Running Archive...' : 'Run Archive Test'}
            </button>
          </RippleEffect>

          {loading && (
            <div className="mt-6 glass-panel rounded-2xl p-6 border border-brand-cyan/30 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-cyan/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-brand-cyan animate-spin-slow" />
                    <span className="font-semibold text-white">Archiving your listening history...</span>
                  </div>
                  <span className="text-brand-cyan font-bold">{progress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-audio-highlight rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-gradient transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="text-sm text-gray-400 mt-3">
                  This usually takes 60-90 seconds. Fetching tracks from Spotify and saving to database...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 glass-panel rounded-2xl p-6 border border-red-500/30 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-red-500/10 blur-2xl rounded-full" />
              <div className="relative z-10 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-red-400 mb-1">Error</h2>
                  <p className="text-gray-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-4">
              <div className="glass-panel rounded-2xl p-6 border border-brand-green/30 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-green/10 blur-2xl rounded-full" />
                <div className="relative z-10">
                  <h2 className="font-bold text-brand-green mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Archive Result
                  </h2>
                  <div className="space-y-2 text-gray-300">
                    <p>Status: <strong className="text-white">{result.archiveResult.status}</strong></p>
                    {result.archiveResult.songsArchived !== undefined && (
                      <p>Songs Archived: <strong className="text-brand-cyan">{result.archiveResult.songsArchived}</strong></p>
                    )}
                    {result.archiveResult.reason && (
                      <p>Reason: <strong className="text-white">{result.archiveResult.reason}</strong></p>
                    )}
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-6 border border-brand-purple/20 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-purple/10 blur-2xl rounded-full" />
                <div className="relative z-10">
                  <h2 className="font-bold text-brand-purple mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Stats
                  </h2>
                  <div className="space-y-2 text-gray-300">
                    <p>Total Play Events: <strong className="text-white">{result.stats.totalPlayEvents}</strong></p>
                    <p>Consecutive Failures: <strong className="text-white">{result.stats.consecutiveFailures}</strong></p>
                    {result.stats.lastPolledAt && (
                      <p>Last Polled: <strong className="text-brand-cyan">{new Date(result.stats.lastPolledAt).toLocaleString()}</strong></p>
                    )}
                    {result.stats.lastSuccessfulScrobble && (
                      <p>Last Successful: <strong className="text-brand-green">{new Date(result.stats.lastSuccessfulScrobble).toLocaleString()}</strong></p>
                    )}
                  </div>
                </div>
              </div>

              {result.recentPlays.length > 0 && (
                <div className="glass-panel rounded-2xl p-6 border border-brand-cyan/20 relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-cyan/10 blur-2xl rounded-full" />
                  <div className="relative z-10">
                    <h2 className="font-bold text-brand-cyan mb-4 flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Recent Plays
                    </h2>
                    <ul className="space-y-3">
                      {result.recentPlays.map((play: any, i: number) => (
                        <RippleEffect key={i}>
                          <li className="text-sm glass-panel p-4 rounded-xl hover:bg-white/10 transition-all">
                            <strong className="text-white">{play.track.name}</strong> <span className="text-gray-400">by {play.track.artists}</span>
                            <br />
                            <span className="text-gray-500 text-xs">
                              {play.track.album} • {new Date(play.playedAt).toLocaleString()}
                            </span>
                          </li>
                        </RippleEffect>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <details className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-purple/10 blur-2xl rounded-full" />
                <summary className="font-bold cursor-pointer text-gray-300 hover:text-white transition-colors relative z-10">Raw Response</summary>
                <pre className="mt-4 text-xs overflow-auto text-gray-400 font-mono relative z-10">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
