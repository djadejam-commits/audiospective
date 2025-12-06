// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://6d0b8174a99ec95b2685eb16fa39afc1@o4510474603528192.ingest.us.sentry.io/4510474635051008",

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Before send hook to capture and enhance CSP violations
  // Prevents incidents like INC-2025-12-06-001 (CSP worker-src violation)
  beforeSend(event, _hint) {
    // Check if this is a CSP violation
    if (event.exception?.values?.[0]?.value?.includes('Content Security Policy')) {
      // Add custom tag for easy filtering in Sentry
      event.tags = {
        ...event.tags,
        csp_violation: true,
        incident_prevention: 'INC-2025-12-06-001'
      };

      // Increase severity for CSP violations
      event.level = 'error';

      // Add breadcrumb for context
      event.breadcrumbs = [
        ...(event.breadcrumbs || []),
        {
          type: 'info',
          category: 'csp',
          message: 'CSP violation detected - check next.config.mjs headers',
          level: 'warning'
        }
      ];
    }

    return event;
  }
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;