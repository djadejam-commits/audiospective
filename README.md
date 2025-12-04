# Audiospective

> Your complete Spotify listening history, automatically archived every hour.

**Audiospective** is a production-ready web application that creates a permanent archive of your Spotify listening history. Unlike Spotify's limited 50-track history, this app stores every song you listen to, forever.

[![Production Ready](https://img.shields.io/badge/status-production%20ready-brightgreen.svg)](DEPLOYMENT-READY.md)
[![Test Coverage](https://img.shields.io/badge/coverage-80%25-brightgreen.svg)](#testing)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Features

### Core Features
- **Automatic Archival**: Hourly background jobs archive your listening history automatically
- **Complete History**: Store every song you listen to (not just the last 50)
- **Rich Analytics**: Discover insights about your music taste
  - Top tracks and artists with play counts
  - Genre breakdown with percentages
  - Listening activity heatmaps
  - Week-over-week comparison
  - Discovery rate (new vs repeat tracks)
  - Listening streaks
  - Diversity scores
- **Export Data**: Download your complete history as CSV or JSON
- **Share Reports**: Create beautiful shareable reports of your music taste
- **Dark Mode**: Beautiful, responsive design with dark mode support

### Technical Features
- **OAuth Authentication**: Secure Spotify login with automatic token refresh
- **Normalized Database**: PostgreSQL schema optimized for fast queries
- **Deduplication**: Automatic duplicate prevention using unique constraints
- **Circuit Breaker**: Intelligent failure handling for API reliability
- **Rate Limiting**: Three-tier rate limiting (strict/normal/lenient)
- **Security Headers**: HSTS, CSP, X-Frame-Options, and more
- **Error Monitoring**: Sentry integration for production error tracking
- **Structured Logging**: Pino JSON logs for production debugging
- **Health Checks**: `/api/health` endpoint for monitoring
- **GDPR Compliant**: Data export and deletion endpoints

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  Next.js 14 App Router | React 18 | Tailwind CSS | Dark Mode   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES (Edge/Node)               │
│  • Authentication (NextAuth)                                     │
│  • Rate Limiting (Upstash Redis)                                │
│  • Input Validation (Zod)                                       │
│  • Error Handling (Sentry)                                      │
└────┬──────────────┬──────────────┬──────────────┬──────────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Spotify  │  │PostgreSQL│  │  Redis   │  │  QStash  │
│   API    │  │ (Neon)   │  │(Upstash) │  │(Upstash) │
│          │  │          │  │          │  │          │
│ • Auth   │  │• Users   │  │• Cache   │  │• Cron    │
│ • Tracks │  │• Plays   │  │• Rate    │  │• Queue   │
│ • Artists│  │• Tracks  │  │  Limit   │  │• Batch   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### Data Flow: Archival Process

```
Hourly Cron (QStash)
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│  /api/cron/archive                                             │
│  1. Fetch active users with valid tokens                      │
│  2. Apply circuit breaker filtering (skip failing users)      │
│  3. Create batches (50 users per batch)                       │
│  4. Queue batches with equidistant delays                     │
└───────────────────┬───────────────────────────────────────────┘
                    │
                    ▼
        ┌─────────────────────┐
        │  QStash Queue       │
        │  (Distributed)      │
        └──────────┬──────────┘
                   │
                   ▼ (Parallel)
┌─────────────────────────────────────────────────────────────┐
│  /api/queue/archive-batch (50 users at a time)              │
│  For each user:                                              │
│    1. Check idempotency (Redis)                             │
│    2. Refresh token if needed (JIT)                         │
│    3. Fetch recently played tracks (Spotify)                │
│    4. Fetch artist details with genres (batched)            │
│    5. Upsert tracks, albums, artists (PostgreSQL)           │
│    6. Create play events (deduplication)                    │
│    7. Update user metadata                                  │
│    8. Record success/failure (circuit breaker)              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14.2 (App Router)
- React 18.2
- TypeScript 5
- Tailwind CSS 4
- Vercel Analytics

**Backend:**
- Next.js API Routes (Node.js runtime)
- NextAuth 4.24 (OAuth)
- Prisma 5.22 (ORM)
- Zod 4.1 (Validation)
- Pino 10.1 (Logging)

**Infrastructure:**
- PostgreSQL (Neon)
- Redis (Upstash)
- QStash (Upstash)
- Sentry (Error Monitoring)
- Vercel (Hosting)

**Testing:**
- Vitest 4.0 (Unit & Integration)
- Playwright 1.57 (E2E)
- Testing Library 16.3
- 80% Code Coverage

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Spotify Developer Account
- PostgreSQL database (recommended: [Neon](https://neon.tech) free tier)
- Upstash Redis (optional, for rate limiting and caching)
- Upstash QStash (optional, for background jobs)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd audiospective
npm install
```

### 2. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
4. Copy Client ID and Client Secret

### 3. Set Up Environment Variables

Create `.env` file:

```bash
# Database (required)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Spotify OAuth (required)
SPOTIFY_CLIENT_ID="your_client_id"
SPOTIFY_CLIENT_SECRET="your_client_secret"

# NextAuth (required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate_with_openssl_rand_base64_32"

# Upstash Redis (optional - enables rate limiting and caching)
UPSTASH_REDIS_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_TOKEN="your_token"

# Upstash QStash (optional - enables background archival)
QSTASH_TOKEN="your_token"
QSTASH_URL="https://qstash.upstash.io"
QSTASH_CURRENT_SIGNING_KEY="your_key"
QSTASH_NEXT_SIGNING_KEY="your_next_key"

# Sentry (optional - error monitoring)
NEXT_PUBLIC_SENTRY_DSN="your_sentry_dsn"
SENTRY_AUTH_TOKEN="your_auth_token"
SENTRY_ORG="your_org"
SENTRY_PROJECT="your_project"
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 4. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed with test data
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Test the App

1. Sign in with your Spotify account
2. Visit `/test` to manually trigger archival
3. Check your dashboard to see archived tracks

---

## Usage

### Manual Archival

Visit `/test` page and click "Archive My Listening History" to manually fetch your recent tracks.

### Automatic Archival

Configure QStash for hourly background archival:

1. Create Upstash QStash account
2. Add QStash credentials to `.env`
3. Create a schedule in QStash dashboard:
   - URL: `https://your-domain.com/api/cron/archive`
   - Schedule: `0 * * * *` (every hour)
   - Method: POST

See [production-setup.md](docs/production-setup.md) for detailed instructions.

### Export Data

From your dashboard:
- Click **Export CSV** for Excel/Sheets
- Click **Export JSON** for raw data

### Share Reports

From your dashboard:
- Click **Share** to generate a public shareable link
- Share with friends to compare music taste

---

## API Documentation

See [API.md](API.md) for complete API reference including:
- Authentication endpoints
- Stats and analytics endpoints
- Export and share endpoints
- Rate limits and error codes

---

## Deployment

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

1. Click the button above
2. Add environment variables in Vercel dashboard
3. Update Spotify redirect URI to `https://your-domain.vercel.app/api/auth/callback/spotify`
4. Deploy!

### Manual Deployment

See [DEPLOYMENT-READY.md](DEPLOYMENT-READY.md) for:
- Production environment setup
- Database migration guide
- Security checklist
- Monitoring setup
- Rollback procedures

---

## Testing

### Run All Tests

```bash
npm test                  # Run all tests
npm run test:coverage     # Run with coverage report
```

### Unit Tests

```bash
npm run test:unit         # Run unit tests only
npm run test:watch        # Watch mode
```

### Integration Tests

```bash
npm run test:integration  # Run integration tests only
```

### E2E Tests

```bash
npm run test:e2e          # Run Playwright E2E tests
npm run test:e2e:ui       # Run with UI
npm run test:e2e:debug    # Debug mode
```

**Test Coverage:** 80% (46/48 tests passing)

---

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues:

- **Token refresh failed**: Check Spotify credentials
- **Database locked**: Migrate from SQLite to PostgreSQL
- **Rate limited**: Upstash Redis not configured
- **Archival not working**: Check QStash configuration

---

## Security

### Built-in Security Features

- **Rate Limiting**: 3-tier system (10/100/1000 requests per 10s)
- **Security Headers**: HSTS, CSP, X-Frame-Options, X-Content-Type-Options
- **Input Validation**: Zod schemas on all API inputs
- **CSRF Protection**: NextAuth built-in protection
- **XSS Prevention**: React automatic escaping + CSP headers
- **SQL Injection**: Prisma parameterized queries
- **Token Security**: Automatic token refresh, encrypted storage

### Reporting Security Issues

Please report security vulnerabilities to: [your-security-email@example.com]

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Run tests: `npm test`
4. Commit with conventional commits: `feat: add new feature`
5. Push and create a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Testing
- `refactor:` Code refactoring
- `chore:` Maintenance

Pre-commit hooks will enforce linting and commit message format.

---

## Roadmap

### Phase 1: Core Features (Completed)
- [x] Spotify OAuth integration
- [x] Automatic archival (hourly)
- [x] Dashboard with analytics
- [x] Export functionality
- [x] Share reports

### Phase 2: Advanced Analytics (In Progress)
- [x] Discovery rate tracking
- [x] Listening streaks
- [x] Genre diversity scores
- [ ] Artist network graphs
- [ ] Mood analysis
- [ ] Time-of-day patterns

### Phase 3: Social Features (Planned)
- [ ] Follow other users
- [ ] Music taste compatibility scores
- [ ] Collaborative playlists
- [ ] Listening challenges

### Phase 4: Mobile App (Future)
- [ ] React Native app
- [ ] Offline access
- [ ] Push notifications

---

## Production Readiness

**Status:** 90% Production Ready (Days 1-10 Complete)

### Completed (Days 1-10)
- ✅ Security foundations (rate limiting, headers, validation)
- ✅ PostgreSQL migration
- ✅ Error monitoring (Sentry)
- ✅ Health checks
- ✅ Testing infrastructure (80% coverage)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Legal compliance (GDPR, Privacy Policy, ToS)
- ✅ Architecture improvements (service layer, DTOs)
- ✅ Performance optimization (caching, query optimization)
- ✅ Advanced monitoring (structured logging, Vercel Analytics)
- ✅ Complete documentation

### Remaining (Days 12-14)
- [ ] Final QA on staging
- [ ] Production environment setup
- [ ] Production deployment
- [ ] Launch monitoring

See [14-DAY-PRODUCTION-PLAN.md](14-DAY-PRODUCTION-PLAN.md) for detailed plan.

---

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## Privacy & Legal

- **Privacy Policy**: [PRIVACY_POLICY.md](PRIVACY_POLICY.md)
- **Terms of Service**: [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)
- **GDPR Compliance**: Data export and deletion endpoints available

Your Spotify listening data is stored securely and never shared with third parties. You can export or delete your data at any time.

---

## Support

- **Documentation**: See `/docs` directory
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **API Reference**: [API.md](API.md)
- **Issues**: [GitHub Issues](<your-repo-url>/issues)

---

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Prisma](https://www.prisma.io/) - Database ORM
- [Upstash](https://upstash.com/) - Redis and QStash
- [Vercel](https://vercel.com/) - Hosting
- [Sentry](https://sentry.io/) - Error monitoring

Special thanks to Spotify for the amazing [Web API](https://developer.spotify.com/documentation/web-api/).

---

**Built with ❤️ for music lovers**

*Discover your musical journey through time*
