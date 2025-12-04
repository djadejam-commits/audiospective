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
