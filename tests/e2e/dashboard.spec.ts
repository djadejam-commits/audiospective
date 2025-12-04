// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard (Unauthenticated)', () => {
  test('should redirect to sign-in when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/me');

    // Should redirect away from /me
    await page.waitForURL(/\/|api\/auth\/signin/, { timeout: 5000 });

    // Should not show dashboard content
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/me');
  });

  test('home page should load successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Page should have a title
    await expect(page).toHaveTitle(/.+/);
  });

  test('should have responsive meta tags', async ({ page }) => {
    await page.goto('/');

    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });
});

test.describe('API Endpoints', () => {
  test('/api/health should return health status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('environment');
    expect(data).toHaveProperty('services');
  });

  test('/api/stats should require authentication', async ({ request }) => {
    const response = await request.get('/api/stats');
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Not authenticated');
  });

  test('/api/share should require authentication for POST', async ({ request }) => {
    const response = await request.post('/api/share', {
      data: { title: 'Test Report' }
    });
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data.error).toBe('Not authenticated');
  });
});

test.describe('Error Handling', () => {
  test('should show 404 page for non-existent routes', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');
    expect(response?.status()).toBe(404);
  });

  test('should handle malformed API requests', async ({ request }) => {
    const response = await request.post('/api/share', {
      data: 'invalid json'
    });

    // Should return an error (either 400 or 401)
    expect([400, 401]).toContain(response.status());
  });
});
