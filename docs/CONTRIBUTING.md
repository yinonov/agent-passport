# Contributing to Agent Passport

Thank you for your interest in contributing to Agent Passport. This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 18 or later
- pnpm 8 or later
- Git
- Chrome or Chromium-based browser (for extension testing)

### Setup

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/agent-passport.git
cd agent-passport

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
agent-passport/
├── packages/
│   ├── schema/       # Zod schemas and TypeScript types for passport data
│   ├── core/         # Business logic (MemoryStore, PassportGenerator, MemoryExtractor)
│   ├── cli/          # CLI tool (`passport` command) for terminal workflows
│   └── sdk/          # SDK for AI agents to read passports programmatically
├── apps/
│   ├── extension/    # Chrome MV3 extension
│   └── web/          # Landing page
└── docs/             # Documentation
```

Packages have dependencies that flow in one direction: `extension`, `cli`, and `sdk` depend on `core`, which depends on `schema`. The `web` app is independent.

## Development Workflow

### Building

```bash
# Build everything
pnpm build

# Build a specific package
pnpm build:schema
pnpm build:core
pnpm build:cli
pnpm build:sdk
pnpm build:extension
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm test:schema
pnpm test:core
pnpm test:cli
pnpm test:sdk
```

### Running the CLI Locally

To test CLI changes during development:

```bash
# Build and run directly
cd packages/cli && pnpm build && node dist/index.js help

# Or use the full command set
cd packages/cli && pnpm build
node dist/index.js init
node dist/index.js add "I prefer functional React components" --category PREFERENCE
node dist/index.js list
node dist/index.js inject --target claude
```

The CLI reads and writes to `~/.agent-passport/passport.json`. During development, you can set the `AGENT_PASSPORT_HOME` environment variable to use a test directory instead of your real passport.

### SDK Testing Approach

The SDK is tested with unit tests that mock the filesystem. Tests verify:

- File resolution (walking up directories to find `.agentpassport` files)
- Passport loading and Zod validation
- Middleware composition and execution order
- `toSystemPrompt()` output formatting for different scopes and platforms
- Error handling for missing, malformed, or incompatible passport files

To run SDK tests:

```bash
cd packages/sdk && pnpm test
```

When writing new SDK tests, avoid touching the real filesystem. Use in-memory mocks or temporary directories that are cleaned up after each test.

### Testing the Extension

1. Run `pnpm build:extension`
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select `apps/extension/dist`
5. Navigate to a supported AI platform to test

For faster iteration during extension development:

- The extension uses Vite for building. Run `pnpm dev:extension` if a watch mode is available, or rebuild with `pnpm build:extension` after changes.
- After rebuilding, click the refresh icon on the extension card in `chrome://extensions` to reload.
- Use Chrome DevTools to inspect the service worker (click "Inspect views: service worker" on the extension card) and content scripts (open DevTools on the AI platform page).
- The popup can be inspected by right-clicking the extension icon and selecting "Inspect popup."

### Making Changes

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the appropriate package(s).

3. Add or update tests to cover your changes.

4. Ensure everything builds and tests pass:
   ```bash
   pnpm build && pnpm test
   ```

5. Commit your changes with a clear message:
   ```bash
   git commit -m "Add extraction support for Gemini platform"
   ```

## Pull Request Process

1. **Keep PRs focused.** One feature or fix per pull request. Small PRs are reviewed faster.

2. **Write a clear description.** Explain what your change does, why it's needed, and how it works. Include screenshots for UI changes.

3. **Ensure CI passes.** All tests must pass and the build must succeed before a PR will be reviewed.

4. **Respond to feedback.** Reviewers may request changes. Please address or discuss all comments.

5. **Squash if needed.** We may ask you to squash commits for a clean history before merging.

## Code Style

### TypeScript

- **Strict mode.** All packages use `"strict": true` in their TypeScript configuration.
- **No `any`.** Use `unknown` and narrow with type guards instead. The `any` type defeats the purpose of TypeScript.
- **Explicit return types** on exported functions.
- **Prefer `const`** over `let`. Never use `var`.
- **Use descriptive names.** `passportEntry` over `pe`. `extractedFacts` over `ef`.

### General

- Keep functions small and focused.
- Prefer pure functions where possible.
- Comment the *why*, not the *what*. Code should be self-documenting.
- No console.log in production code. Use structured logging when needed.

## Testing Expectations

- All new functionality must include tests.
- Bug fixes should include a regression test.
- Aim for meaningful test coverage, not 100% line coverage. Test behavior, not implementation details.
- Tests should be deterministic. No network calls, no timers, no randomness.

## What to Work On

- Check the [issue tracker](https://github.com/nickarino/agent-passport/issues) for open issues.
- Issues labeled `good first issue` are a great starting point.
- If you want to work on something significant, open an issue first to discuss the approach.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold a welcoming, inclusive, and respectful environment for everyone.

## Questions?

Open a [discussion](https://github.com/nickarino/agent-passport/discussions) or reach out in an issue. We're happy to help you get started.
