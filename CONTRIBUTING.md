# Contributing to Audiospective

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Requirements](#testing-requirements)
6. [Pull Request Process](#pull-request-process)
7. [Reporting Bugs](#reporting-bugs)
8. [Suggesting Features](#suggesting-features)

---

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior includes:**
- Harassment, trolling, or insulting comments
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** or **pnpm**
- **Git**
- **Spotify Developer Account** (for API credentials)

### Initial Setup

1. **Fork the repository**
   ```bash
   gh repo fork anthropics/audiospective
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/audiospective.git
   cd audiospective
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your Spotify credentials
   ```

5. **Initialize database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

---

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

**Examples:**
```bash
git checkout -b feature/add-playlist-export
git checkout -b fix/token-refresh-race-condition
git checkout -b docs/update-api-documentation
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

**Examples:**
```
feat(dashboard): add week-over-week comparison chart

Implemented a new comparison tab that shows listening
stats compared to the previous week.

Closes #42
```

```
fix(auth): prevent token refresh race condition

Added mutex to ensure only one token refresh happens
at a time for each user.

Fixes #138
```

---

## Coding Standards

### TypeScript

- **Strict mode:** Always enabled (`tsconfig.json`)
- **No `any`:** Use proper types or `unknown`
- **Explicit return types:** For public functions

**Example:**
```typescript
// ❌ Bad
export function processData(data: any) {
  return data.map(d => d.value);
}

// ✅ Good
export function processData(data: Track[]): number[] {
  return data.map(track => track.duration);
}
```

### Code Style

- **Prettier:** Automatic formatting on save
- **ESLint:** Follow Next.js recommended rules
- **Line length:** Max 100 characters
- **Indentation:** 2 spaces

Run linting before committing:
```bash
npm run lint
```

### File Organization

```
src/
├── app/              # Next.js pages and API routes
│   ├── api/          # API endpoints
│   └── (pages)/      # Page components
├── components/       # React components
│   ├── ui/           # Reusable UI components
│   └── features/     # Feature-specific components
├── lib/              # Core business logic
│   ├── services/     # Business services
│   ├── repositories/ # Data access layer
│   └── utils/        # Utility functions
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
└── config/           # Configuration files
```

### Naming Conventions

- **Components:** PascalCase (`UserProfile.tsx`)
- **Functions:** camelCase (`getUserStats()`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Files:** kebab-case (`user-profile.tsx`)

---

## Testing Requirements

### Test Coverage Goals

- **Unit tests:** 80% coverage
- **Integration tests:** Critical paths
- **E2E tests:** Main user flows

### Writing Tests

**Unit Test Example:**
```typescript
// src/lib/archive-user.test.ts
import { describe, it, expect } from 'vitest';
import { archiveUser } from './archive-user';

describe('archiveUser', () => {
  it('should archive recently played tracks', async () => {
    const result = await archiveUser('test-user-id');
    expect(result.status).toBe('success');
    expect(result.songsArchived).toBeGreaterThan(0);
  });
});
```

**E2E Test Example:**
```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign in with Spotify', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign in with Spotify');
  await expect(page).toHaveURL('/dashboard');
});
```

### Running Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## Pull Request Process

### Before Submitting

1. **Create an issue first** (for features)
2. **Update documentation** (if applicable)
3. **Add tests** (required for new features)
4. **Run linting and tests**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Commit messages follow conventions

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added
- [ ] Documentation updated
```

### Review Process

1. **Automated checks must pass** (linting, tests, build)
2. **At least 1 approval required**
3. **Address review comments**
4. **Squash and merge** (maintainers will handle)

---

## Reporting Bugs

### Before Reporting

1. **Check existing issues** (may already be reported)
2. **Verify bug exists** in latest version
3. **Gather reproduction steps**

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 13.4]
- Browser: [e.g., Chrome 115]
- Node version: [e.g., 20.5.0]

**Screenshots**
If applicable

**Additional Context**
Any other relevant information
```

---

## Suggesting Features

### Feature Request Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Mockups, examples, or references
```

### Feature Discussion

1. **Open an issue** with the feature request template
2. **Discuss with maintainers** (feasibility, scope)
3. **Get approval** before implementing
4. **Break into smaller PRs** (if large feature)

---

## Development Tips

### Debugging

**Enable verbose logging:**
```typescript
// src/lib/logger.ts
logger.level = 'debug';
```

**Inspect database:**
```bash
npx prisma studio
```

**Check background jobs:**
```bash
# View QStash logs at https://console.upstash.com
```

### Common Issues

**"Prisma Client not found"**
```bash
npx prisma generate
```

**"Token refresh failing"**
- Check Spotify credentials in `.env.local`
- Verify redirect URIs in Spotify Developer Dashboard

**"Database locked"**
- SQLite limitation, switch to PostgreSQL for development

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api)
- [Project Architecture](./docs/02_map/architecture.md)
- [API Documentation](./API.md)

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing! 🎵**
