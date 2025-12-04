# Git Hooks Configuration

This directory contains Git hooks managed by [Husky](https://typicode.github.io/husky/).

## Hooks Overview

### Pre-commit Hook

**File:** `.husky/pre-commit`

**Purpose:** Runs before each commit to ensure code quality

**What it does:**
1. **Lints staged files** - Runs ESLint with auto-fix on staged `.js`, `.jsx`, `.ts`, `.tsx` files
2. **Type checks** - Runs TypeScript compiler in no-emit mode to catch type errors

**When it runs:** Automatically before every `git commit`

**How to skip (not recommended):**
```bash
git commit --no-verify -m "your message"
```

### Commit-msg Hook

**File:** `.husky/commit-msg`

**Purpose:** Enforces conventional commit message format

**What it does:**
- Validates commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) specification
- Ensures commit messages are descriptive and properly categorized

**Valid commit message format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples of valid commit messages:**
```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve token refresh bug"
git commit -m "docs: update API documentation"
git commit -m "test: add tests for archive-user function"
git commit -m "refactor: extract service layer from API routes"
git commit -m "chore: update dependencies"
```

**Allowed types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `build` - Changes to build system or dependencies
- `ci` - Changes to CI configuration
- `chore` - Other changes (maintenance, etc.)
- `revert` - Reverts a previous commit

**Examples of invalid commit messages:**
```bash
❌ git commit -m "fixed stuff"
❌ git commit -m "WIP"
❌ git commit -m "update"
❌ git commit -m "FEAT: new feature" (type must be lowercase)
```

## Configuration Files

### `commitlint.config.js`
Configures the commit message linter rules.

### `package.json` (lint-staged section)
Configures which commands run on staged files before commit.

## Installation

Hooks are automatically installed when you run:
```bash
npm install
```

This runs the `prepare` script which executes `husky`.

## Troubleshooting

### Hook not running
1. Ensure hooks are executable:
   ```bash
   chmod +x .husky/pre-commit
   chmod +x .husky/commit-msg
   ```

2. Reinstall hooks:
   ```bash
   rm -rf .husky/_
   npm run prepare
   ```

### Commit blocked by lint errors
1. **Fix the errors manually:**
   ```bash
   npm run lint -- --fix
   ```

2. **Stage the fixes:**
   ```bash
   git add .
   ```

3. **Try committing again:**
   ```bash
   git commit -m "your message"
   ```

### Commit blocked by type errors
1. **Check type errors:**
   ```bash
   npx tsc --noEmit
   ```

2. **Fix the errors** in your editor

3. **Try committing again**

### Invalid commit message
If your commit is rejected due to an invalid message:

1. **Review the error message** - it will tell you what's wrong

2. **Fix the message format:**
   ```bash
   git commit -m "feat: your descriptive message"
   ```

## Bypassing Hooks (Emergency Only)

In emergencies, you can bypass hooks with:
```bash
git commit --no-verify -m "emergency fix"
```

**Warning:** This should only be used in emergencies. Bypassing hooks can lead to:
- Breaking code being committed
- CI/CD failures
- Production issues

## Best Practices

1. **Write descriptive commit messages** - Explain the "why", not just the "what"
2. **Keep commits focused** - One logical change per commit
3. **Fix lint/type errors immediately** - Don't accumulate technical debt
4. **Don't skip hooks** - They exist to protect code quality

## Related Documentation

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/lint-staged/lint-staged)
- [commitlint Documentation](https://commitlint.js.org/)
