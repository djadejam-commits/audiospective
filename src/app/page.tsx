'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-green-50 to-white dark:from-black dark:to-zinc-900">
      <main className="max-w-2xl px-8 py-16 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
          Spotify Time Machine
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Your complete Spotify listening history, automatically archived every hour.
        </p>

        {status === 'loading' && (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        )}

        {status === 'authenticated' && session?.user && (
          <div className="mb-8 p-4 bg-green-50 dark:bg-green-950 border-2 border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-900 dark:text-green-100 font-semibold mb-2">
              ✅ Signed in as {session.user.name || session.user.email}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
              >
                View Dashboard
              </Link>
              <Link
                href="/test"
                className="px-6 py-2 border border-green-600 text-green-600 font-semibold rounded-full hover:bg-green-50 dark:hover:bg-green-950 transition-colors"
              >
                Test Archive
              </Link>
              <Link
                href="/me"
                className="px-6 py-2 border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400 font-semibold rounded-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={() => signOut()}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {status === 'unauthenticated' && (
          <div className="mb-8">
            <button
              onClick={() => signIn('spotify')}
              className="px-8 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
            >
              Sign in with Spotify
            </button>
          </div>
        )}

        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-3 text-left">
            <span className="text-2xl">🎵</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Never Lose Your History</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Spotify only shows 50 recent tracks. We archive everything.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-left">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Detailed Statistics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See your top tracks, artists, and listening patterns over time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-left">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Privacy First</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your data stays with you. We never share or sell your listening history.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Phase 2 Complete!</strong> Background polling system is ready.
            {status === 'authenticated' ? (
              <>
                {' '}Go to{' '}
                <Link href="/test" className="underline hover:no-underline font-semibold">
                  /test
                </Link>
                {' '}to try manual archival.
              </>
            ) : (
              ' Sign in to start archiving your listening history.'
            )}
          </p>
        </div>

        <div className="mt-8 text-xs text-gray-500 dark:text-gray-400">
          <a href="https://github.com/anthropics/claude-code" className="hover:underline" target="_blank" rel="noopener noreferrer">
            Built with Claude Code
          </a>
        </div>
      </main>
    </div>
  );
}
