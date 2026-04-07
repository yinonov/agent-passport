# Agent Passport — Architecture

## Overview

Agent Passport is a pnpm monorepo consisting of:

```
agent-passport/
├── packages/
│   ├── schema/          # Zod schemas + TypeScript types
│   └── core/            # Business logic (MemoryStore, PassportGenerator, MemoryExtractor)
├── apps/
│   ├── extension/       # Chrome MV3 extension
│   └── web/             # Landing page (Vite + TypeScript)
├── docs/                # This directory
└── .github/workflows/   # CI/CD
```

---

## Packages

### `@agent-passport/schema`

Pure TypeScript + Zod definitions. No runtime dependencies other than Zod.

**Key types:**

| Type | Description |
|---|---|
| `MemoryItem` | A single piece of user memory with category, confidence, source, and tags |
| `Passport` | Full user identity document: identity fields + memories[] + permissions[] |
| `PassportPack` | Minimal shareable context snapshot: generated system prompt for a specific platform |
| `PermissionGrant` | Scoped access grant for a platform with expiry and active flag |

**Memory categories:** `identity`, `preference`, `skill`, `project`, `relationship`, `goal`, `context`, `fact`

**Supported platforms:** `chatgpt`, `claude`, `perplexity`, `gemini`, `grok`, `manual` (for MemoryItem source) + `generic` (for PassportPack)

---

### `@agent-passport/core`

Business logic layer. Browser-compatible (uses `crypto.randomUUID()` not Node's crypto module).

**`MemoryStore`**

CRUD operations on the Passport's memory array. Supports:
- `add(item)` — create a new memory with auto-generated ID and timestamps
- `update(id, patch)` — partial update
- `remove(id)` — delete by ID
- `getAll()` / `getByCategory(cat)` — read
- `search(query)` — simple substring search on content and tags
- `fromJSON(raw)` — static deserializer with Zod validation
- `toJSON()` — deep-clone serializer

**`PassportGenerator`**

Converts a Passport into a `PassportPack` (platform-specific system prompt):
- Filters memories by active permission grants
- Groups memories by category
- Formats with platform-specific preambles
- Estimates token count (characters / 4)

**`MemoryExtractor`**

Regex-based extraction of memories from conversation text:
- Detects identity, skill, project, preference, and goal patterns
- Works with both raw text and `{role, content}[]` conversation arrays
- Assigns confidence scores per pattern

---

## Apps

### Chrome Extension (`apps/extension`)

**Tech stack:** TypeScript, Vite (MV3 bundle), `@types/chrome`

**Architecture:**

```
src/
├── background/
│   └── index.ts        # Service worker — singleton MemoryStore, message router
├── content/
│   ├── base.ts          # Shared helpers (generatePack, showToast)
│   ├── chatgpt.ts       # Content script for chat.openai.com / chatgpt.com
│   ├── claude.ts        # Content script for claude.ai
│   ├── perplexity.ts    # Content script for perplexity.ai
│   ├── gemini.ts        # Content script for gemini.google.com
│   └── grok.ts          # Content script for grok.x.ai
└── popup/
    ├── index.html       # Dark UI popup (Memory Inbox / Passport / Inject tabs)
    └── popup.ts         # Popup logic
```

**Message protocol (popup/content → background):**

| Message type | Payload | Response |
|---|---|---|
| `GET_PASSPORT` | — | `{ ok, data: Passport }` |
| `GET_MEMORIES` | — | `{ ok, data: MemoryItem[] }` |
| `ADD_MEMORY` | `item: Omit<MemoryItem, 'id'\|'createdAt'\|'updatedAt'>` | `{ ok, data: MemoryItem }` |
| `REMOVE_MEMORY` | `id: string` | `{ ok, data: boolean }` |
| `GENERATE_PACK` | `platform: string` | `{ ok, data: PassportPack }` |
| `SAVE_PASSPORT` | `passport: unknown` | `{ ok }` |

Content scripts receive `{ type: 'INJECT_CONTEXT' }` from the popup and inject the generated system prompt into the active AI platform's input field.

**Storage:** `chrome.storage.local` with key `'passport'`. Persisted as JSON.

---

### Landing Page (`apps/web`)

**Tech stack:** TypeScript, Vite, vanilla CSS

**Features:**
- Particle canvas animation (connected dots with floating motion)
- Cinematic dark design
- Hero section with "Every AI should already know you" copy
- Problem section (4 pain points)
- Solution section (6 feature cards)
- How it works (step-by-step)
- Netlify Forms waitlist with honeypot spam protection
- Scroll-reveal animations via IntersectionObserver
- Fully responsive

**Build output:** GitHub Pages compatible (base `/agent-passport/`)

---

## Data Flow

```
User (Chrome popup)
       │
       │ chrome.runtime.sendMessage
       ▼
Background Service Worker (MemoryStore singleton)
       │
       │ chrome.storage.local
       ▼
    IndexedDB / LocalStorage (encrypted by Chrome profile)

User (clicking "Inject" in popup)
       │
       │ chrome.tabs.sendMessage
       ▼
Content Script (platform-specific)
       │
       │ chrome.runtime.sendMessage(GENERATE_PACK)
       ▼
Background (PassportGenerator)
       │
       │ Returns PassportPack.systemPrompt
       ▼
Content Script injects text into AI platform input
```

---

## Security Model

- **No network requests** — all data stays on device
- **chrome.storage.local** — encrypted by Chrome, scoped to extension
- **Content scripts** are isolated (no access to page JS scope except DOM)
- **Host permissions** are minimal — only the 5 supported AI platforms
- **No eval, no dynamic code execution**
- **CSP** enforced by Chrome MV3 by default

---

## CI/CD

GitHub Actions (`.github/workflows/`):

- **`ci.yml`** — runs on push/PR: installs pnpm, builds all packages
- **`deploy.yml`** — runs on push to `main`: builds web app, deploys to GitHub Pages

---

## Extending Agent Passport

### Adding a new memory category
1. Add to the `z.enum` in `packages/schema/src/types.ts`
2. Add scope to `PermissionGrantSchema`
3. Add extraction pattern in `packages/core/src/MemoryExtractor.ts`

### Adding a new AI platform
1. Add to platform enum in schema
2. Add platform preamble in `PassportGenerator.ts`
3. Add content script in `apps/extension/src/content/`
4. Register in `manifest.json` and `vite.config.ts`
5. Add inject button to popup
