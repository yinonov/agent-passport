# Agent Passport

**The identity layer for the agent internet.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/nickarino/agent-passport/pulls)
[![npm](https://img.shields.io/badge/npm-coming%20soon-orange.svg)](#roadmap)

> One portable file carries your context, preferences, and rules across every AI.

---

## The Problem

Context fragmentation. Every AI starts from zero. Every. Single. Time.

You tell Claude your tech stack. You explain your coding preferences to ChatGPT. You re-describe your role to Gemini. You correct Copilot's assumptions -- again. Your context is scattered across a dozen platforms, locked in chat logs that expire, forgotten the moment a session ends.

Your identity in the AI world is shattered into fragments that no single tool can see. And every new conversation costs you the same ten minutes of setup you already did yesterday.

## The Solution

Agent Passport is an open file format, a local runtime, and a family of clients that carry your context everywhere. Your `.agentpassport` file is like `.env` but for who you are -- your preferences, expertise, constraints, and rules, structured and portable.

**You stay in control.** Every piece of captured context passes through a review queue before it becomes part of your passport. Nothing is shared without your explicit approval. Everything runs locally.

## Architecture

Agent Passport is built on three layers:

```
┌─────────────────────────────────────────────────────────┐
│  CLIENTS          Chrome Extension  ·  CLI  ·  SDK      │
│                   VS Code  ·  Terminal  ·  Any Agent     │
├─────────────────────────────────────────────────────────┤
│  RUNTIME          MemoryStore  ·  PassportGenerator     │
│                   MemoryExtractor  ·  Review Queue       │
├─────────────────────────────────────────────────────────┤
│  FORMAT           .agentpassport file  (JSON + schema)  │
│                   ~/.agent-passport/  (local store)      │
└─────────────────────────────────────────────────────────┘
```

**Format** -- The `.agentpassport` file is a JSON document with a schema version and an array of structured items. Drop one in any project directory, and every tool knows who you are.

**Runtime** -- The core library manages extraction, review, storage, and prompt generation. It works the same whether called from a browser extension, a CLI, or an SDK.

**Clients** -- The extension, CLI, SDK, and future integrations all read and write the same format through the same runtime. Add a client, and every passport works with it immediately.

## Monorepo Structure

```
agent-passport/
├── packages/
│   ├── schema/       # Zod schemas and TypeScript types for passport data
│   ├── core/         # MemoryStore, PassportGenerator, MemoryExtractor
│   ├── cli/          # CLI tool (`passport` command) for terminal workflows
│   └── sdk/          # SDK for AI agents to read passports programmatically
├── apps/
│   ├── extension/    # Chrome MV3 extension with popup, service worker, content scripts
│   └── web/          # Landing page and documentation site
└── docs/             # Architecture, vision, roadmap, contributing guides
```

For detailed technical architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Quick Start

```bash
# Install and build
pnpm install && pnpm build

# CLI
npx passport init
npx passport add "I prefer TypeScript with strict mode" --category PREFERENCE
npx passport approve <id>
npx passport inject --target claude

# SDK
import { PassportClient } from '@agent-passport/sdk'
const passport = new PassportClient()
await passport.load()
const context = passport.toSystemPrompt({ scope: 'React project' })

# Extension
# Load apps/extension/dist as unpacked extension in Chrome
```

## Supported Platforms

| Platform | Client | Status |
|----------|--------|--------|
| ChatGPT | Extension | Planned |
| Claude | Extension, CLI | Planned |
| Gemini | Extension | Planned |
| Perplexity | Extension | Planned |
| GitHub Copilot | Extension | Planned |
| VS Code | SDK | Planned |
| Terminal | CLI | In Progress |
| Any Agent | SDK | In Progress |

## Privacy & Trust

Agent Passport is built on a local-first architecture:

- **Your data stays on your device.** Passport data is stored in local files (`~/.agent-passport/`) and `chrome.storage.local`. Nothing leaves your machine unless you explicitly export it.
- **Review queue by default.** No context is added to your passport without your approval.
- **Minimal permissions.** The extension requests only the permissions it needs. The CLI and SDK read only from your local filesystem.
- **No network calls.** Zero telemetry, zero analytics, zero tracking. The code is open source and auditable.
- **Open source.** Every line of code is available for inspection under the MIT license.

## Roadmap

| Phase | Focus | Timeline |
|-------|-------|----------|
| **Phase 1** | Extension MVP + CLI + SDK -- capture, review, inject across all clients | Q2 2026 |
| **Phase 2** | Team Passports -- shared context, role-based access, encrypted sync | Q3 2026 |
| **Phase 3** | Agent Protocol -- standardized API for agents to request passport access with consent | Q4 2026 |
| **Phase 4** | Passport Network -- federated discovery, enterprise SSO, cross-org sharing | 2027 |

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full roadmap.

## Contributing

We welcome contributions of all kinds. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on getting started, development workflows for the CLI, SDK, and extension, and the pull request process.

## License

MIT -- see [LICENSE](LICENSE) for details.
