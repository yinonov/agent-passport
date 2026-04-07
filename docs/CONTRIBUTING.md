# Contributing to Agent Passport

Welcome! Agent Passport is open source and contributions are warmly encouraged. This guide will get you from zero to a merged PR.

---

## Table of Contents

1. [Setup](#setup)
2. [Development Workflow](#development-workflow)
3. [Project Structure](#project-structure)
4. [PR Process](#pr-process)
5. [Code Style](#code-style)
6. [Testing Guidelines](#testing-guidelines)
7. [Reporting Issues](#reporting-issues)

---

## Setup

### Prerequisites

- Node.js ≥ 18 ([nvm](https://github.com/nvm-sh/nvm) recommended)
- pnpm ≥ 9 (`npm install -g pnpm`)
- Git

### Clone and Install

```bash
git clone https://github.com/agent-passport/agent-passport.git
cd agent-passport
pnpm install
```

### Build All Packages

```bash
pnpm build
```

### Type Check

```bash
pnpm type-check
```

---

## Development Workflow

### Working on a Package

```bash
# Watch mode for schema
cd packages/schema
pnpm dev

# Watch mode for core
cd packages/core
pnpm dev

# Watch mode for extension
cd apps/extension
pnpm dev
```

### Loading the Extension in Chrome

1. Run `pnpm build` in `apps/extension`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `apps/web/agent-passport/apps/extension` (the directory containing `manifest.json`)

After making changes, run `pnpm build` again and click the refresh icon on the extension card.

### Running the Landing Page

```bash
cd apps/web
npx serve . --listen 3000
```

---

## Project Structure

```
agent-passport/
├── packages/
│   ├── schema/     # Zod types — edit this when changing data shapes
│   └── core/       # Business logic — MemoryStore, PassportGenerator, MemoryExtractor
└── apps/
    ├── extension/  # Chrome extension
    │   └── src/
    │       ├── background/   # Service worker
    │       ├── content/      # Content scripts + injector
    │       ├── popup/        # Popup UI
    │       └── options/      # Options page
    └── web/        # Static landing page (index.html only)
```

---

## PR Process

1. **Fork** the repository and create a branch: `git checkout -b feat/your-feature`
2. Make your changes, following the code style guidelines below
3. Run `pnpm type-check` — all packages must pass with zero errors
4. Run `pnpm build` — all packages must build successfully
5. Write a clear commit message (imperative mood: "Add platform support for X", not "Added...")
6. Open a Pull Request against `main`
7. Fill out the PR description:
   - **What** does this PR do?
   - **Why** is this change needed?
   - **How** was it tested?
8. A maintainer will review within a few days

### PR Guidelines

- Keep PRs focused. One concern per PR.
- If your change affects the `schema` package, ensure `core` and `extension` are updated to match.
- If you add a new AI platform, add it to: `manifest.json` host permissions, `content-script.ts` platform detection, `injector.ts` selectors, `popup.ts` platform names, and `options.html` platform toggles.
- Don't include `dist/` or `node_modules/` in your PR.

---

## Code Style

We follow these conventions throughout the codebase:

**TypeScript**
- Strict mode is mandatory — `"strict": true` in all tsconfigs
- No `any` types without an explanatory comment
- Use `unknown` instead of `any` at external boundaries
- Prefer `type` over `interface` for object shapes; use `interface` for classes
- Prefer `const` over `let`; avoid `var`
- Prefer early returns over nested conditionals

**Naming**
- Files: `PascalCase` for classes (`MemoryStore.ts`), `camelCase` for utilities
- Classes: `PascalCase`
- Variables and functions: `camelCase`
- Enums and enum members: `SCREAMING_SNAKE_CASE`
- CSS classes: `kebab-case`

**Imports**
- Use `.js` extensions in TypeScript imports (required for ESM)
- Group imports: external packages, then internal workspace packages, then local files
- No default exports from library code; use named exports

**Comments**
- Comment only when the code cannot speak for itself
- No `// TODO` comments in merged code — open an issue instead

**Formatting**
- 2-space indentation
- Single quotes for strings
- Trailing commas in multi-line arrays and objects
- 80-character line limit (soft guideline, use judgment)

---

## Testing Guidelines

The project does not yet have a test runner configured. Until it does:

- **Core logic** (`packages/core`) should be tested manually by importing and running the classes in a Node.js REPL
- **Extension behavior** should be tested by loading the unpacked extension in Chrome and exercising each feature
- When a test framework is added (Jest or Vitest), all new core logic must have unit tests
- Edge cases to always consider:
  - Empty input / empty memory store
  - Malformed JSON in import
  - Memory with expiry in the past
  - Multiple rapid extractions from the same element (throttle behavior)

---

## Reporting Issues

Open a GitHub Issue with:

1. **Description** — what happened vs. what you expected
2. **Steps to reproduce** — numbered list
3. **Platform** — which AI platform were you on?
4. **Browser and OS** — Chrome version, OS version
5. **Extension version** — visible in `chrome://extensions`
6. **Console errors** — from the extension's background service worker and/or content script

For security issues, please email the maintainers directly rather than opening a public issue.

---

Thank you for contributing to the open AI memory commons. 🛂
