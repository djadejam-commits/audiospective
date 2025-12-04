'use client';

// src/app/global-error.tsx
// Catches errors in the root layout (last resort error handler)
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div>
              <h1 className="text-6xl font-bold text-red-600">Oops!</h1>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Something went critically wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We've been notified and are looking into it.
              </p>
              {error.digest && (
                <p className="mt-1 text-xs text-gray-500 font-mono">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="mt-8 space-y-4">
              <button
                onClick={reset}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Try again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Go to homepage
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
