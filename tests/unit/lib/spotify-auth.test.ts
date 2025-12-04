// tests/unit/lib/spotify-auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshAccessToken, TokenRefreshError } from '@/lib/spotify-auth';

// Mock global fetch
global.fetch = vi.fn();

describe('Spotify Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
    process.env.SPOTIFY_CLIENT_SECRET = 'test-client-secret';
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh token', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await refreshAccessToken('old-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        'https://accounts.spotify.com/api/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );
    });

    it('should keep old refresh token if not rotated', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        // No refresh_token in response (not rotated)
        expires_in: 3600
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await refreshAccessToken('old-refresh-token');

      expect(result.refreshToken).toBe('old-refresh-token');
    });

    it('should update refresh token if rotated by Spotify', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'rotated-refresh-token', // Spotify rotated the token
        expires_in: 3600
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await refreshAccessToken('old-refresh-token');

      expect(result.refreshToken).toBe('rotated-refresh-token');
    });

    it('should throw TokenRefreshError on 400 response', async () => {
      const mockError = {
        error: 'invalid_grant',
        error_description: 'Refresh token has been revoked'
      };

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => mockError
      });

      await expect(refreshAccessToken('invalid-token')).rejects.toThrow(TokenRefreshError);
      await expect(refreshAccessToken('invalid-token')).rejects.toThrow(
        'Token refresh failed: Refresh token has been revoked'
      );
    });

    it('should include error code in TokenRefreshError', async () => {
      const mockError = {
        error: 'invalid_grant',
        error_description: 'Invalid refresh token'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError
      });

      try {
        await refreshAccessToken('invalid-token');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(TokenRefreshError);
        expect(error.code).toBe('invalid_grant');
      }
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(refreshAccessToken('token')).rejects.toThrow('Network error');
    });

    it('should handle malformed JSON response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error('Malformed JSON'); }
      });

      await expect(refreshAccessToken('token')).rejects.toThrow(TokenRefreshError);
    });

    it('should calculate correct expiration timestamp', async () => {
      const beforeCall = Math.floor(Date.now() / 1000);

      const mockResponse = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600 // 1 hour
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await refreshAccessToken('token');
      const afterCall = Math.floor(Date.now() / 1000);

      // expiresAt should be roughly current time + 3600 seconds
      expect(result.expiresAt).toBeGreaterThanOrEqual(beforeCall + 3600);
      expect(result.expiresAt).toBeLessThanOrEqual(afterCall + 3600);
    });

    it('should send correct credentials in request body', async () => {
      const mockResponse = {
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await refreshAccessToken('my-refresh-token');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const bodyParams = new URLSearchParams(fetchCall[1].body);

      expect(bodyParams.get('grant_type')).toBe('refresh_token');
      expect(bodyParams.get('refresh_token')).toBe('my-refresh-token');
      expect(bodyParams.get('client_id')).toBe('test-client-id');
      expect(bodyParams.get('client_secret')).toBe('test-client-secret');
    });

    it('should handle Spotify API errors with missing error_description', async () => {
      const mockError = {
        error: 'server_error'
        // No error_description
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError
      });

      await expect(refreshAccessToken('token')).rejects.toThrow('Token refresh failed: server_error');
    });
  });
});
