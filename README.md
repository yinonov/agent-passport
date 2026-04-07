# 🛂 Agent Passport

[![License: MIT](https://img.shields.io/badge/License-MIT-6C63FF.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-a78bfa.svg)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)
[![Made with Love](https://img.shields.io/badge/made%20with-%E2%9D%A4-ff69b4.svg)](https://github.com/agent-passport/agent-passport)

> **Every AI should already know you.**

Agent Passport is a portable memory and permissions layer for the AI internet. It gives you a single identity — your preferences, projects, decisions, and constraints — that travels with you across every AI platform you use.

---

## Vision

You are a person with a job, opinions, and a life. You use AI constantly. And yet every AI you open treats you like a stranger. You re-explain your tech stack. You re-introduce your project. You repeat your preferences. Every. Single. Session.

Agent Passport ends this. It captures facts about you from your AI conversations, lets you review and approve each one, and then injects your full context into any AI platform with a single click. Local-first, zero cloud, fully open source.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Agent Passport                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │  @ap/schema  │    │   @ap/core   │    │ @ap/extension │  │
│  │              │    │              │    │               │  │
│  │  Zod types   │◄───│  MemoryStore │◄───│ service-worker│  │
│  │  MemoryItem  │    │  PassportGen │    │ content-script│  │
│  │  Passport    │    │  MemExtract  │    │ popup / opts  │  │
│  └──────────────┘    └──────────────┘    └───────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   apps/web                            │   │
│  │   Landing page (static HTML, Netlify Forms)           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Data Flow:
 AI Platform DOM
      │
      │ MutationObserver
      ▼
 content-script.ts ──► EXTRACT_MEMORY ──► service-worker.ts
                                               │
                                               │ MemoryExtractor.extract()
                                               ▼
                                          MemoryStore.add()  ←  pending
                                               │
                                         User reviews in Popup
                                               │
                                          MemoryStore.approve()
                                               │
                                     PassportGenerator.generate()
                                               │
                                    injector.injectContext()
                                               │
                                               ▼
                                        AI Platform Input
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9

```bash
npm install -g pnpm
```

### Install

```bash
git clone https://github.com/agent-passport/agent-passport.git
cd agent-passport
pnpm install
```

### Build all packages

```bash
pnpm build
```

### Build the Chrome extension

```bash
cd apps/extension
pnpm build
```

Then load `apps/extension` as an unpacked extension in `chrome://extensions`.

### Run the landing page locally

```bash
cd apps/web
npx serve . --listen 3000
```

---

## Packages

| Package | Description |
|---|---|
| `packages/schema` | Zod schemas and TypeScript types — `MemoryItem`, `Passport`, `PermissionGrant` |
| `packages/core` | Core logic — `MemoryStore`, `PassportGenerator`, `MemoryExtractor` |
| `apps/extension` | Chrome MV3 extension with service worker, content scripts, popup, and options page |
| `apps/web` | Static landing page with Netlify Forms waitlist |

---

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for setup, PR process, and code style guidelines.

---

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the three-phase plan from MVP to ecosystem.

---

## License

MIT © Agent Passport Contributors
