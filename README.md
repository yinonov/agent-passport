# 🛂 Agent Passport

> Every AI should already know you.

**Agent Passport** is a portable memory & permissions layer for AI agents. One passport. Every AI. Your context, everywhere.

[![CI](https://github.com/yinonov/agent-passport/actions/workflows/ci.yml/badge.svg)](https://github.com/yinonov/agent-passport/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What is Agent Passport?

You explain yourself to every AI, every session, every platform. Agent Passport solves this. It:

1. **Captures** your identity, skills, projects, and preferences as structured memories
2. **Stores** everything locally on your device (privacy-first, no cloud required)
3. **Injects** your context into ChatGPT, Claude, Perplexity, Gemini, and Grok with one click

---

## Monorepo Structure

```
agent-passport/
├── packages/
│   ├── schema/          # @agent-passport/schema — Zod types (MemoryItem, Passport, PassportPack, PermissionGrant)
│   └── core/            # @agent-passport/core — MemoryStore, PassportGenerator, MemoryExtractor
├── apps/
│   ├── extension/       # Chrome MV3 extension
│   └── web/             # Landing page → https://yinonov.github.io/agent-passport/
├── docs/
│   ├── VISION.md        # Manifesto
│   ├── ARCHITECTURE.md  # Technical architecture
│   └── ROADMAP.md       # Future plans
└── .github/workflows/   # CI + GitHub Pages deployment
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install & Build

```bash
pnpm install
pnpm build
```

### Development

```bash
# Build all packages in watch mode
pnpm dev

# Build just the extension
cd apps/extension && pnpm build

# Build just the web app
cd apps/web && pnpm build
```

### Load the Extension

1. Run `cd apps/extension && pnpm build`
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** → select `apps/extension/dist`

---

## Supported AI Platforms

| Platform | URL | Status |
|---|---|---|
| 🤖 ChatGPT | chat.openai.com / chatgpt.com | ✅ |
| 🧠 Claude | claude.ai | ✅ |
| 🔍 Perplexity | perplexity.ai | ✅ |
| ✨ Gemini | gemini.google.com | ✅ |
| ⚡ Grok | grok.x.ai | ✅ |

---

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full technical details.

**Key packages:**

- **`@agent-passport/schema`** — Zod schemas and TypeScript types
- **`@agent-passport/core`** — `MemoryStore` (CRUD), `PassportGenerator` (system prompt builder), `MemoryExtractor` (auto-extraction)

---

## Privacy

- 🏠 **Local-first** — all data stays in `chrome.storage.local`, encrypted by Chrome
- 🚫 **No cloud sync** — no servers, no telemetry, no tracking
- 🔍 **Open source** — fully auditable

---

## Docs

- [Vision Manifesto](docs/VISION.md) — why we're building this
- [Architecture](docs/ARCHITECTURE.md) — how it works under the hood
- [Roadmap](docs/ROADMAP.md) — where we're going

---

## Contributing

PRs and issues welcome! See the [roadmap](docs/ROADMAP.md) for planned features.

---

## License

MIT © 2026 yinon
