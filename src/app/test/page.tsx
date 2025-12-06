'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Music, TrendingUp, AlertCircle, CheckCircle, Info, Clock, RefreshCw } from 'lucide-react';
import ParticleField from '@/components/ParticleField';
import RippleEffect from '@/components/RippleEffect';
import Sidebar from '@/components/Sidebar';

interface ArchiveStatus {
  status: 'idle' | 'pending' | 'completed';
  message: string;
  archiveRequested: boolean;
  archiveRequestedAt: string | null;
  lastPolledAt: string | null;
  totalPlayEvents: number;
  estimatedCompletionSeconds: number | null;
}

export default function TestPage() {
  const { data: session, status: authStatus } = useSession();
  const [requesting, setRequesting] = useState(false);
  const [status, setStatus] = useState<ArchiveStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Poll status when archive is pending
  useEffect(() => {
    if (!status?.archiveRequested) return;

    const checkStatus = async () => {
      try {
        const response = await fetch('/api/archive/status');
        const data = await response.json();
        setStatus(data);

        // Update progress based on estimated completion
        if (data.estimatedCompletionSeconds) {
          const progressPercent = Math.max(0, Math.min(95, 100 - (data.estimatedCompletionSeconds / 90 * 100)));
          setProgress(Math.floor(progressPercent));
        }

        // Stop polling when completed
        if (!data.archiveRequested) {
          setProgress(100);
        }
      } catch (err: unknown) {
        console.error('Failed to check status:', err);
      }
    };

    // Check immediately
    checkStatus();

    // Poll every 3 seconds while pending
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [status?.archiveRequested]);

  // Initial status check
  useEffect(() => {
    if (session) {
      fetch('/api/archive/status')
        .then(res => res.json())
        .then(data => setStatus(data))
        .catch(err => console.error('Failed to load status:', err));
    }
  }, [session]);

  async function requestArchive() {
    setRequesting(true);
    setError(null);
    setProgress(0);

    try {
      const response = await fetch('/api/archive/request', {
        method: 'POST'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request archive');
      }

      // Refresh status
      const statusResponse = await fetch('/api/archive/status');
      const statusData = await statusResponse.json();
      setStatus(statusData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setRequesting(false);
    }
  }

  async function refreshStatus() {
    try {
      const response = await fetch('/api/archive/status');
      const data = await response.json();
      setStatus(data);
    } catch (err: unknown) {
      console.error('Failed to refresh status:', err);
    }
  }

  if (authStatus === 'loading') {
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

  const isPending = status?.archiveRequested || false;
  const isCompleted = status?.status === 'completed';

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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gradient">Archive System Test</h1>
            <RippleEffect>
              <button
                onClick={refreshStatus}
                className="p-2 glass-panel rounded-lg hover:bg-white/10 transition-all"
                title="Refresh status"
              >
                <RefreshCw className="w-5 h-5 text-brand-cyan" />
              </button>
            </RippleEffect>
          </div>
          <p className="text-gray-400 mb-8">Manually trigger archiving of your Spotify listening history</p>

          <div className="mb-6 glass-panel rounded-2xl p-6 border border-brand-cyan/20 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-cyan/10 blur-2xl rounded-full" />
            <div className="relative z-10 flex items-start gap-3">
              <Info className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300 space-y-2">
                <p>
                  <strong className="text-brand-cyan">How it works:</strong> Click the button below to request archiving.
                  Your request will be prioritized and processed by the cron job within the next few minutes.
                </p>
                <p className="text-xs text-gray-400">
                  This fetches your last 50 recently played tracks from Spotify (~60-90 seconds to process).
                </p>
              </div>
            </div>
          </div>

          {/* Status Display */}
          {status && (
            <div className="mb-6 glass-panel rounded-2xl p-6 border border-brand-purple/20 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-purple/10 blur-2xl rounded-full" />
              <div className="relative z-10">
                <h2 className="font-bold text-brand-purple mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Current Status
                </h2>
                <div className="space-y-2 text-gray-300">
                  <p>Total Play Events: <strong className="text-white">{status.totalPlayEvents}</strong></p>
                  {status.lastPolledAt && (
                    <p>Last Archived: <strong className="text-brand-cyan">{new Date(status.lastPolledAt).toLocaleString()}</strong></p>
                  )}
                  {status.archiveRequestedAt && isPending && (
                    <p>Requested: <strong className="text-brand-yellow">{new Date(status.archiveRequestedAt).toLocaleString()}</strong></p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <RippleEffect>
            <button
              onClick={requestArchive}
              disabled={requesting || isPending}
              className="px-6 py-3 bg-brand-gradient text-white font-semibold rounded-xl hover:shadow-neon-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Clock className="w-5 h-5 animate-spin-slow" />
                  Archive In Progress...
                </>
              ) : requesting ? (
                <>
                  <Music className="w-5 h-5 animate-spin-slow" />
                  Requesting...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Request Archive
                </>
              )}
            </button>
          </RippleEffect>

          {/* Progress Display */}
          {isPending && (
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
                  {status?.estimatedCompletionSeconds
                    ? `Estimated time remaining: ~${status.estimatedCompletionSeconds} seconds`
                    : 'Processing your request...'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  The cron job runs continuously. Your request has been prioritized.
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isCompleted && !isPending && status.lastPolledAt && (
            <div className="mt-6 glass-panel rounded-2xl p-6 border border-brand-green/30 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-brand-green/10 blur-2xl rounded-full" />
              <div className="relative z-10 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold text-brand-green mb-1">Archive Completed</h2>
                  <p className="text-gray-300">
                    Your listening history has been successfully archived. You now have <strong className="text-white">{status.totalPlayEvents}</strong> play events stored.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    View your data on the <Link href="/dashboard" className="text-brand-cyan hover:underline">Dashboard</Link>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
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
        </div>
      </main>
    </div>
  );
}
