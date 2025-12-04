#!/usr/bin/env node
/**
 * Performance Test Script
 *
 * Tests API endpoint performance with and without caching
 * Measures response times for optimized endpoints
 *
 * Usage: node scripts/test-performance.js [userId]
 */

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
// const userId = process.argv[2] || 'test-user-id'; // Reserved for future use

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Measure response time for a single request
 */
async function measureRequest(url, options = {}) {
  const start = performance.now();
  try {
    const response = await fetch(url, options);
    const end = performance.now();
    const duration = Math.round(end - start);

    if (!response.ok) {
      return {
        success: false,
        duration,
        status: response.status,
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      duration,
      status: response.status,
      data,
    };
  } catch (error) {
    const end = performance.now();
    return {
      success: false,
      duration: Math.round(end - start),
      error: error.message,
    };
  }
}

/**
 * Test an endpoint multiple times to measure caching impact
 */
async function testEndpoint(name, url, iterations = 3) {
  console.log(`\n${colors.bright}${colors.blue}Testing: ${name}${colors.reset}`);
  console.log(`${colors.cyan}URL: ${url}${colors.reset}`);
  console.log(`${colors.cyan}Iterations: ${iterations}${colors.reset}\n`);

  const results = [];

  for (let i = 0; i < iterations; i++) {
    const result = await measureRequest(url);
    results.push(result);

    const statusIcon = result.success ? '✓' : '✗';
    const statusColor = result.success ? colors.green : colors.yellow;
    const cacheLabel = i === 0 ? '(uncached)' : '(cached)';

    console.log(
      `  ${statusIcon} Request ${i + 1}: ${statusColor}${result.duration}ms${colors.reset} ${cacheLabel}`
    );

    if (!result.success) {
      console.log(`     Error: ${result.error}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Calculate stats
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length === 0) {
    console.log(`\n  ${colors.yellow}⚠ All requests failed${colors.reset}`);
    return { name, results, success: false };
  }

  const durations = successfulResults.map(r => r.duration);
  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const min = Math.min(...durations);
  const max = Math.max(...durations);

  const firstRequest = results[0].success ? results[0].duration : null;
  const cachedRequests = results.slice(1).filter(r => r.success);
  const avgCached = cachedRequests.length > 0
    ? Math.round(cachedRequests.reduce((sum, r) => sum + r.duration, 0) / cachedRequests.length)
    : null;

  console.log(`\n  ${colors.bright}Stats:${colors.reset}`);
  console.log(`    Average: ${avg}ms`);
  console.log(`    Min: ${min}ms`);
  console.log(`    Max: ${max}ms`);

  if (firstRequest && avgCached) {
    const improvement = Math.round(((firstRequest - avgCached) / firstRequest) * 100);
    console.log(`    ${colors.green}Cache improvement: ${improvement}% faster${colors.reset}`);
  }

  return {
    name,
    results,
    stats: { avg, min, max, firstRequest, avgCached },
    success: true,
  };
}

/**
 * Test health endpoint (baseline)
 */
async function testHealthEndpoint() {
  return testEndpoint(
    'Health Check',
    `${baseUrl}/api/health`,
    3
  );
}

/**
 * Main test suite
 */
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  Spotify Time Machine - Performance Test${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`\nBase URL: ${baseUrl}`);
  console.log(`Testing caching improvements...\n`);

  const startTime = Date.now();
  const testResults = [];

  // Test 1: Health endpoint (baseline)
  try {
    const healthResult = await testHealthEndpoint();
    testResults.push(healthResult);
  } catch (error) {
    console.log(`\n${colors.yellow}⚠ Health check failed: ${error.message}${colors.reset}`);
  }

  // Note: Other endpoints require authentication, so we'll just test health for now
  // In a real test, you'd get a session token and test authenticated endpoints

  const endTime = Date.now();
  const totalDuration = Math.round((endTime - startTime) / 1000);

  // Summary
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}  Test Summary${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);

  const successfulTests = testResults.filter(t => t.success).length;
  const totalTests = testResults.length;

  console.log(`Tests run: ${totalTests}`);
  console.log(`Successful: ${colors.green}${successfulTests}${colors.reset}`);
  console.log(`Failed: ${totalTests - successfulTests}`);
  console.log(`Duration: ${totalDuration}s\n`);

  // Show improvement summary
  if (successfulTests > 0) {
    console.log(`${colors.bright}Cache Performance:${colors.reset}\n`);
    testResults.forEach(result => {
      if (result.success && result.stats.firstRequest && result.stats.avgCached) {
        const improvement = Math.round(
          ((result.stats.firstRequest - result.stats.avgCached) / result.stats.firstRequest) * 100
        );
        console.log(
          `  ${result.name}: ${colors.green}${improvement}% faster${colors.reset} (${result.stats.firstRequest}ms → ${result.stats.avgCached}ms)`
        );
      }
    });
  }

  console.log(`\n${colors.bright}Note:${colors.reset} Additional endpoints require authentication.`);
  console.log(`To test /api/stats, /api/top-tracks, etc., use the application UI or Postman.\n`);
}

// Run tests
runTests().catch(error => {
  console.error(`\n${colors.yellow}Fatal error: ${error.message}${colors.reset}\n`);
  process.exit(1);
});
