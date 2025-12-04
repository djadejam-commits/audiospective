'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';

export default function TestPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runArchiveTest() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-archive');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Archive test failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Archive Test</h1>
        <p className="mb-4">You need to be signed in to test the archival system.</p>
        <Link href="/api/auth/signin" className="text-blue-600 hover:underline">
          Sign in with Spotify
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Archive System Test</h1>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm">
          <strong>Note:</strong> This endpoint manually triggers the archive worker for your account.
          It will fetch your recently played tracks from Spotify and store them in the database.
        </p>
      </div>

      <button
        onClick={runArchiveTest}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Running Archive...' : 'Run Archive Test'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="font-bold text-red-800">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h2 className="font-bold text-green-800 mb-2">Archive Result</h2>
            <p>Status: <strong>{result.archiveResult.status}</strong></p>
            {result.archiveResult.songsArchived !== undefined && (
              <p>Songs Archived: <strong>{result.archiveResult.songsArchived}</strong></p>
            )}
            {result.archiveResult.reason && (
              <p>Reason: <strong>{result.archiveResult.reason}</strong></p>
            )}
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <h2 className="font-bold mb-2">Stats</h2>
            <p>Total Play Events: <strong>{result.stats.totalPlayEvents}</strong></p>
            <p>Consecutive Failures: <strong>{result.stats.consecutiveFailures}</strong></p>
            {result.stats.lastPolledAt && (
              <p>Last Polled: <strong>{new Date(result.stats.lastPolledAt).toLocaleString()}</strong></p>
            )}
            {result.stats.lastSuccessfulScrobble && (
              <p>Last Successful: <strong>{new Date(result.stats.lastSuccessfulScrobble).toLocaleString()}</strong></p>
            )}
          </div>

          {result.recentPlays.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded">
              <h2 className="font-bold mb-2">Recent Plays</h2>
              <ul className="space-y-2">
                {result.recentPlays.map((play: any, i: number) => (
                  <li key={i} className="text-sm">
                    <strong>{play.track.name}</strong> by {play.track.artists}
                    <br />
                    <span className="text-gray-600">
                      {play.track.album} • {new Date(play.playedAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <details className="p-4 bg-gray-50 border border-gray-200 rounded">
            <summary className="font-bold cursor-pointer">Raw Response</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
