// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show sign in page when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should redirect to home or show sign-in option
    await expect(page).toHaveURL(/\//);

    // Look for sign-in button or link
    const signInButton = page.getByRole('link', { name: /sign in|login/i });
    await expect(signInButton).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to NextAuth sign-in when clicking sign in', async ({ page }) => {
    await page.goto('/');

    // Click sign in button
    const signInButton = page.getByRole('link', { name: /sign in|login/i });
    await signInButton.click();

    // Should navigate to NextAuth sign-in page
    await expect(page).toHaveURL(/\/api\/auth\/signin/);
  });

  test('should show Spotify as sign-in provider', async ({ page }) => {
    await page.goto('/api/auth/signin');

    // Look for Spotify sign-in button
    const spotifyButton = page.getByRole('button', { name: /spotify/i });
    await expect(spotifyButton).toBeVisible();
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/me');

    // Should redirect to sign-in or home
    await page.waitForURL(/\/|api\/auth\/signin/, { timeout: 5000 });
  });

  test('should not have CSP violations on homepage', async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have no CSP violations
    expect(consoleErrors).toHaveLength(0);
  });

  test('should not have auth errors during sign-in navigation', async ({ page }) => {
    // Listen for network errors
    const failedRequests: string[] = [];
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();

      // Track auth endpoint failures
      if (url.includes('/api/auth') && (status === 400 || status === 500)) {
        failedRequests.push(`${url} - ${status}`);
      }
    });

    await page.goto('/');
    const signInButton = page.getByRole('link', { name: /sign in|login/i });
    await signInButton.click();

    // Should have no failed auth requests
    expect(failedRequests).toHaveLength(0);
  });
});

test.describe('Authenticated State (Mocked)', () => {
  // Note: Full OAuth testing requires real Spotify credentials
  // These tests verify the UI behaves correctly

  test('health check endpoint should be accessible', async ({ page }) => {
    const response = await page.goto('/api/health');
    expect(response?.status()).toBe(200);

    const data = await response?.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('environment');
  });
});

test.describe('Security Headers & CSP (Regression Prevention)', () => {
  // These tests prevent incidents like INC-2025-12-06-001

  test('should have worker-src in CSP headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    const csp = headers?.['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain('worker-src');
    expect(csp).toContain('blob:');
  });

  test('should have report-uri for CSP violations', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    const csp = headers?.['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain('report-uri');
    expect(csp).toContain('/api/csp-report');
  });

  test('CSP should allow necessary domains', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    const csp = headers?.['content-security-policy'];
    expect(csp).toBeDefined();

    // Should allow Spotify images
    expect(csp).toContain('i.scdn.co');
    expect(csp).toContain('spotifycdn.com');

    // Should allow OAuth profile images
    expect(csp).toContain('fbcdn.net');

    // Should allow Sentry
    expect(csp).toContain('sentry.io');
  });

  test('should have security headers configured', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    // Basic security headers
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers?.['referrer-policy']).toBe('strict-origin-when-cross-origin');

    // HSTS in production
    if (process.env.NODE_ENV === 'production') {
      expect(headers?.['strict-transport-security']).toBeDefined();
    }
  });

  test('Sentry should initialize without CSP violations', async ({ page }) => {
    const cspViolations: string[] = [];

    // Monitor for CSP violations
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('content security policy')) {
        cspViolations.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit for Sentry to initialize
    await page.waitForTimeout(2000);

    // Should have no CSP violations from Sentry initialization
    const sentryViolations = cspViolations.filter(v =>
      v.toLowerCase().includes('sentry') || v.toLowerCase().includes('worker')
    );

    expect(sentryViolations).toHaveLength(0);
  });
});

test.describe('Domain Configuration (Regression Prevention)', () => {
  // These tests prevent domain mismatch issues like INC-2025-12-06-001

  test('auth session endpoint should be accessible', async ({ page }) => {
    const response = await page.goto('/api/auth/session');

    // Should return 200 (with null session when not authenticated)
    expect(response?.status()).toBe(200);
  });

  test('auth providers endpoint should be accessible', async ({ page }) => {
    const response = await page.goto('/api/auth/providers');

    expect(response?.status()).toBe(200);

    const data = await response?.json();
    expect(data).toHaveProperty('spotify');
  });

  test('should not get 400/500 errors on auth endpoints', async ({ page }) => {
    const authErrors: Array<{ url: string; status: number }> = [];

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();

      if (url.includes('/api/auth') && (status === 400 || status === 500)) {
        authErrors.push({ url, status });
      }
    });

    // Navigate through sign-in flow
    await page.goto('/');
    await page.goto('/api/auth/signin');
    await page.goto('/api/auth/session');

    // Should have no auth errors
    expect(authErrors).toHaveLength(0);
  });
});
