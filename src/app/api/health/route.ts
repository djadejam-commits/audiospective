// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { hasRedis, hasQStash, env } from '@/config/env';

/**
 * Health Check Endpoint
 *
 * Returns 200 if all critical services are healthy
 * Returns 503 if any critical service is down
 *
 * Used by:
 * - Load balancers (determine if instance is healthy)
 * - Monitoring tools (Datadog, Pingdom, UptimeRobot)
 * - CI/CD pipelines (verify deployment success)
 *
 * This endpoint is NOT rate-limited (see src/middleware.ts)
 */

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    database: ServiceHealth;
    redis?: ServiceHealth;
    spotify?: ServiceHealth;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();

  try {
    // Simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check Redis connectivity (if configured)
 */
async function checkRedis(): Promise<ServiceHealth | undefined> {
  if (!hasRedis) return undefined;

  const start = Date.now();

  try {
    // Ping Redis
    const result = await redis.ping();

    if (result === 'PONG') {
      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    }

    return {
      status: 'unhealthy',
      error: 'Unexpected response from Redis'
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check Spotify API connectivity
 */
async function checkSpotify(): Promise<ServiceHealth | undefined> {
  const start = Date.now();

  try {
    // Simple HEAD request to Spotify API (no auth needed)
    const response = await fetch('https://api.spotify.com/v1/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok || response.status === 401) {
      // 401 is expected (no auth), means API is reachable
      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    }

    return {
      status: 'unhealthy',
      error: `Spotify API returned ${response.status}`
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * GET /api/health
 *
 * Returns health status of the application and its dependencies
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Check all services in parallel
    const [database, redis, spotify] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkSpotify()
    ]);

    // Build health check response
    const health: HealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      services: {
        database,
        ...(redis && { redis }),
        ...(spotify && { spotify })
      }
    };

    // Determine overall status
    const unhealthyServices = Object.values(health.services).filter(
      (service) => service && service.status === 'unhealthy'
    );

    if (unhealthyServices.length > 0) {
      // If database is unhealthy, entire system is unhealthy
      if (database.status === 'unhealthy') {
        health.status = 'unhealthy';

        return NextResponse.json(health, {
          status: 503, // Service Unavailable
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
      }

      // If only optional services are unhealthy, mark as degraded
      health.status = 'degraded';
    }

    // Return healthy status
    return NextResponse.json(health, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
  } catch (error: any) {
    // Unexpected error during health check
    const errorHealth: HealthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      services: {
        database: {
          status: 'unhealthy',
          error: error.message
        }
      }
    };

    return NextResponse.json(errorHealth, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

/**
 * HEAD /api/health
 *
 * Lightweight health check (no response body)
 * Used by load balancers for frequent polling
 */
export async function HEAD() {
  try {
    // Quick database check only
    await prisma.$queryRaw`SELECT 1`;

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
