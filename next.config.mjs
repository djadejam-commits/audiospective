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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for Next.js
              "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Tailwind
              "img-src 'self' https://i.scdn.co https://*.spotifycdn.com data: blob:", // Spotify images
              "font-src 'self' data:",
              "connect-src 'self' https://api.spotify.com https://accounts.spotify.com https://*.upstash.io https://*.sentry.io", // API endpoints
              "media-src 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'", // Prevent embedding
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests" // Automatically upgrade HTTP to HTTPS
            ].join('; ')
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

import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig(
  nextConfig,
  {
    // Sentry webpack plugin options
    silent: true, // Suppresses source map upload logs
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
  },
  {
    // Additional config options
    widenClientFileUpload: true,
    transpileClientSDK: true,
    hideSourceMaps: true,
    disableLogger: true,
  }
);
