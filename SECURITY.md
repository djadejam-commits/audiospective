# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

**DO NOT** open public issues for security vulnerabilities.

### How to Report

**Email:** security@your-domain.com (or create a GitHub Security Advisory)

**Include:**
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if applicable)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 5 business days
- **Fix timeline:** Based on severity
  - **Critical:** 7 days
  - **High:** 14 days
  - **Medium:** 30 days
  - **Low:** Next release cycle

---

## Security Measures

### Authentication & Authorization

**Implemented:**
- ✅ OAuth 2.0 with Spotify
- ✅ JWT-based sessions (NextAuth)
- ✅ Token refresh mechanism (proactive + JIT)
- ✅ Secure token storage (database, encrypted at rest)

**User Responsibilities:**
- Use strong Spotify passwords
- Enable 2FA on Spotify account
- Do not share access tokens

### Data Protection

**At Rest:**
- Database credentials stored in environment variables
- Tokens encrypted in database (NextAuth handles this)
- No plaintext passwords (OAuth only)

**In Transit:**
- HTTPS enforced in production
- Secure cookies (`httpOnly`, `sameSite`, `secure` flags)
- No sensitive data in URL parameters

### API Security

**Implemented:**
- ✅ QStash signature verification for webhook endpoints
- ✅ CRON_SECRET for manual job triggers
- ✅ Session-based authentication for all protected routes
- ✅ SQL injection prevention (Prisma parameterization)
- ✅ XSS prevention (React escaping)

**Planned (Not Yet Implemented):**
- ⚠️ Rate limiting (Priority: Critical)
- ⚠️ CORS configuration (Priority: Critical)
- ⚠️ Content Security Policy (Priority: High)
- ⚠️ Input validation with Zod (Priority: High)

### Infrastructure

**Deployed On:**
- Vercel (serverless, isolated execution)
- Upstash Redis (TLS-encrypted connections)
- Neon/Supabase PostgreSQL (TLS-encrypted)

**Environment Variables:**
- Stored in Vercel Environment Variables (encrypted at rest)
- Never committed to version control
- Accessed only at runtime

---

## Known Vulnerabilities

### Critical (Requires Immediate Fix)

1. **No Rate Limiting** (OWASP API4:2023)
   - **Impact:** API abuse, DoS attacks
   - **Mitigation:** Implement Upstash Rate Limiting
   - **Status:** Planned for v1.1

2. **Missing Security Headers** (OWASP API8:2023)
   - **Impact:** XSS, clickjacking vulnerabilities
   - **Mitigation:** Configure `next.config.mjs` headers
   - **Status:** Planned for v1.1

3. **No Input Validation** (OWASP API3:2023)
   - **Impact:** Injection attacks, data corruption
   - **Mitigation:** Implement Zod schema validation
   - **Status:** Planned for v1.1

### High Priority

4. **GET Endpoint for Cron Job**
   - **Impact:** Secret leakage in logs/browser cache
   - **Mitigation:** Remove GET handler in production
   - **Status:** Planned for v1.1

5. **No CSRF Protection for API Routes**
   - **Impact:** Cross-site request forgery
   - **Mitigation:** Implement CSRF tokens
   - **Status:** Under review

### Medium Priority

6. **SQLite in Development**
   - **Impact:** Not suitable for production (file locking)
   - **Mitigation:** Migrate to PostgreSQL before launch
   - **Status:** Documented in deployment guide

---

## Security Best Practices

### For Contributors

1. **Never commit secrets**
   ```bash
   # .gitignore already has:
   .env*
   ```

2. **Use environment variables**
   ```typescript
   // ❌ Bad
   const API_KEY = "sk_live_12345";

   // ✅ Good
   const API_KEY = process.env.SPOTIFY_CLIENT_SECRET;
   ```

3. **Sanitize user input**
   ```typescript
   // ✅ Good
   import { z } from 'zod';
   const schema = z.object({ title: z.string().max(100) });
   const validated = schema.parse(userInput);
   ```

4. **Avoid logging sensitive data**
   ```typescript
   // ❌ Bad
   console.log('Token:', accessToken);

   // ✅ Good
   console.log('Token refresh successful');
   ```

### For Deployers

1. **Generate strong secrets**
   ```bash
   openssl rand -base64 32
   ```

2. **Enable HTTPS**
   - Vercel enforces this automatically
   - Self-hosted: Use Let's Encrypt

3. **Rotate secrets regularly**
   - `NEXTAUTH_SECRET`: Every 90 days
   - Spotify credentials: When compromised

4. **Monitor for vulnerabilities**
   ```bash
   npm audit
   npx snyk test
   ```

---

## Incident Response

### If You Discover a Breach

1. **Immediately notify security team**
2. **Do not disclose publicly** until patch is available
3. **Document:**
   - What was accessed
   - When it occurred
   - How it happened
   - Affected users

### Post-Incident Actions

1. **Rotate all secrets**
2. **Notify affected users** (if personal data exposed)
3. **Publish post-mortem** (after fix deployed)
4. **Update security measures**

---

## Compliance

### GDPR (EU Users)

**Data Collected:**
- Spotify user ID (required for OAuth)
- Email address (optional, from Spotify)
- Display name (optional, from Spotify)
- Profile picture URL (optional, from Spotify)
- Listening history (tracks, artists, albums, play times)

**User Rights:**
- **Access:** View all stored data via dashboard
- **Rectification:** Update profile via Spotify
- **Erasure:** Account deletion endpoint (planned)
- **Portability:** Export as CSV/JSON
- **Restriction:** Disable archival (pause account)

**Data Retention:**
- Active users: Indefinite (until account deletion)
- Inactive users: 1 year (planned cleanup job)
- Shareable reports: 30 days or until manually deleted

**Legal Basis:**
- Consent (user initiates Spotify OAuth)
- Contract (providing the service)

### CCPA (California Users)

**User Rights:**
- Right to know what data is collected
- Right to delete personal information
- Right to opt-out of data sale (we don't sell data)

---

## Dependencies

### Keeping Dependencies Secure

**Automated Checks:**
```yaml
# .github/workflows/security.yml
- run: npm audit --production
- run: npx snyk test
```

**Manual Updates:**
```bash
npm outdated
npm update
```

**High-Risk Dependencies:**
- `next-auth` - Authentication (critical)
- `prisma` - Database access (critical)
- `@upstash/qstash` - Background jobs (high)

---

## Security Contacts

**Project Maintainer:** [Your Name]
**Email:** security@your-domain.com
**GitHub:** @your-username

**Response Hours:** Monday-Friday, 9am-5pm UTC
**Emergency:** Within 24 hours (weekends/holidays)

---

## Acknowledgments

We appreciate security researchers who responsibly disclose vulnerabilities. Contributors will be acknowledged in our Hall of Fame:

- *(No vulnerabilities reported yet)*

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Spotify Security Best Practices](https://developer.spotify.com/documentation/general/guides/authorization/)

---

**Last Updated:** December 3, 2025
**Version:** 1.0
