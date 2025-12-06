import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Security Headers */
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Prevent DNS prefetching for enhanced privacy
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Enforce HTTPS in production (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Enable XSS protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Disable browser features we don't use
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          // Content Security Policy (CSP)
          // Updated: 2025-12-06 - Fixed worker-src for Sentry web workers
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com", // unsafe-inline needed for Next.js, Vercel Analytics
              "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Tailwind
              "img-src 'self' https://i.scdn.co https://*.spotifycdn.com https://*.fbcdn.net https://authjs.dev data: blob:", // Spotify images + profile pics + NextAuth provider logos
              "font-src 'self' data:",
              "connect-src 'self' https://api.spotify.com https://accounts.spotify.com https://*.upstash.io https://*.sentry.io https://vitals.vercel-insights.com https://va.vercel-scripts.com", // API endpoints + Analytics
              "media-src 'self'",
              "worker-src 'self' blob:", // CRITICAL: Allow Sentry web workers to prevent CSP violations
              "object-src 'none'",
              "frame-ancestors 'none'", // Prevent embedding
              "base-uri 'self'",
              "form-action 'self' http://localhost:3000 http://127.0.0.1:3000 https://*.vercel.app",
              ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []), // Only upgrade in production
              "report-uri /api/csp-report" // Send CSP violations to Sentry for monitoring
            ].filter(Boolean).join('; ')
          }
        ]
      },
      {
        // CORS headers for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXTAUTH_URL || 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400' // 24 hours
          }
        ]
      }
    ];
  },

  /* Image optimization (for Spotify album art) */
  images: {
    domains: [
      'i.scdn.co',
      'mosaic.scdn.co',
      'lineup-images.scdn.co'
    ],
    formats: ['image/avif', 'image/webp']
  },

  /* Environment validation */
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
  },

  /* Production optimizations */
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header (security)
  generateEtags: true, // Enable ETags for caching

  /* TypeScript and ESLint */
  typescript: {
    // Don't fail build on type errors (we'll catch in CI)
    ignoreBuildErrors: false
  },
  eslint: {
    // Don't fail build on lint errors (we'll catch in CI)
    ignoreDuringBuilds: false
  }
};

/**
 * Sentry Integration
 *
 * Sentry is now enabled! It will:
 * - Capture errors in development and production
 * - Upload source maps for better debugging
 * - Track performance metrics
 *
 * See SENTRY-SETUP.md for detailed configuration options
 */

export default withSentryConfig(nextConfig, {
 // For all available options, see:
 // https://www.npmjs.com/package/@sentry/webpack-plugin#options

 org: "ade-tokuta",

 project: "audiospective",

 // Only print logs for uploading source maps in CI
 silent: !process.env.CI,

 // For all available options, see:
 // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

 // Upload a larger set of source maps for prettier stack traces (increases build time)
 widenClientFileUpload: true,

 // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
 // This can increase your server load as well as your hosting bill.
 // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
 // side errors will fail.
 tunnelRoute: "/monitoring",

 // Automatically tree-shake Sentry logger statements to reduce bundle size
 disableLogger: true,

 // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
 // See the following for more information:
 // https://docs.sentry.io/product/crons/
 // https://vercel.com/docs/cron-jobs
 automaticVercelMonitors: true
});