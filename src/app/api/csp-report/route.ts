// src/app/api/csp-report/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * POST /api/csp-report
 *
 * Endpoint for browser to send Content Security Policy violation reports.
 * Violations are logged to Sentry for monitoring and alerting.
 *
 * Prevents incidents like INC-2025-12-06-001 (CSP worker-src violation)
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_reporting
 */
export async function POST(req: NextRequest) {
  try {
    const report = await req.json();

    // Log CSP violation to Sentry
    Sentry.captureMessage('Content Security Policy Violation', {
      level: 'error',
      tags: {
        csp_violation: true,
        incident_prevention: 'INC-2025-12-06-001',
        violated_directive: report['csp-report']?.['violated-directive'] || 'unknown',
        blocked_uri: report['csp-report']?.['blocked-uri'] || 'unknown'
      },
      extra: {
        report: report['csp-report'],
        documentUri: report['csp-report']?.['document-uri'],
        violatedDirective: report['csp-report']?.['violated-directive'],
        effectiveDirective: report['csp-report']?.['effective-directive'],
        blockedUri: report['csp-report']?.['blocked-uri'],
        originalPolicy: report['csp-report']?.['original-policy'],
        sourceFile: report['csp-report']?.['source-file'],
        lineNumber: report['csp-report']?.['line-number']
      }
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 CSP Violation Report:');
      console.warn(JSON.stringify(report, null, 2));
    }

    // Return 204 No Content (standard response for reporting endpoints)
    return new NextResponse(null, { status: 204 });

  } catch (error: unknown) {
    console.error('[CSP Report] Error processing report:', error);

    // Still return 204 to prevent browser from retrying
    return new NextResponse(null, { status: 204 });
  }
}

/**
 * OPTIONS /api/csp-report
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
