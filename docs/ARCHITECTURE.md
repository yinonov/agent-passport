# Architecture: Agent Passport

## Overview

Agent Passport is a TypeScript monorepo organized into shared packages and application targets. It is designed for clarity, composability, and zero runtime dependencies on any cloud service.

---

## Monorepo Structure

```
agent-passport/
├── packages/
│   ├── schema/       # Zod schemas + TypeScript types (shared everywhere)
│   └── core/         # Core logic (MemoryStore, PassportGenerator, MemoryExtractor)
└── apps/
    ├── extension/    # Chrome MV3 extension
    └── web/          # Static landing page
```

Package manager: **pnpm** with workspaces. TypeScript 5.4+ throughout. ESNext modules.

---

## packages/schema

The single source of truth for all data types in the system.

**Key types:**

- `MemoryItem` — a single extracted fact about the user, with category, content, confidence score, provenance, and review state
- `MemoryCategory` — enum: PROFILE, PREFERENCE, PROJECT, TASK, DECISION, PERSON, CONSTRAINT, RECURRING
- `ReviewState` — enum: PENDING, APPROVED, REJECTED, EDITED
- `Passport` — a versioned bundle of approved memories owned by a user
- `PassportPack` — a signed, exportable passport with metadata
- `PermissionGrant` — grants a specific agent access to specific memory categories with specific scopes

All types are defined as Zod schemas with inferred TypeScript types, ensuring runtime validation at the boundaries.

---

## packages/core

Three focused classes that implement the core behavior:

### MemoryStore

Manages the lifecycle of memory items in-memory with a `Map<string, MemoryItem>`. Emits change events via a listener set. Key operations:

- `add()` — creates a new memory with generated UUID and current timestamp
- `approve()` / `reject()` / `edit()` — update review state
- `getApproved()` — returns APPROVED and EDITED items (items the user has vetted)
- `export()` — produces a `Passport` containing all approved memories
- `importPassport()` — merges an external passport, skipping IDs that already exist
- `toJSON()` / `fromJSON()` — serialization for persistence

### PassportGenerator

Formats a set of `MemoryItem[]` into a prompt string suitable for injection into an AI input field.

- `generate()` — full formatted markdown prompt grouped by category
- `generateCompact()` — single-line summary for token-constrained contexts
- `estimateTokens()` — rough token estimate at `length / 4`

### MemoryExtractor

Applies heuristic regex patterns to extract candidate memory items from raw text.

- Five extraction methods, each targeting a `MemoryCategory`
- Confidence scores reflect pattern strength (0.7–0.95)
- Deduplication removes exact content matches before returning

---

## apps/extension

A Chrome Manifest V3 extension with four components:

### Service Worker (`background/service-worker.ts`)

The central coordinator. Runs in the extension background.

- Listens for messages from content scripts and the popup
- Delegates extraction to `MemoryExtractor`, storage to `MemoryStore`
- Persists store state to `chrome.storage.local` after every mutation
- Updates the extension badge with the pending memory count
- Handles: EXTRACT_MEMORY, APPROVE_MEMORY, REJECT_MEMORY, EDIT_MEMORY, EXPORT_PASSPORT, IMPORT_PASSPORT, GET_PENDING_COUNT, GET_ALL_MEMORIES

### Content Script (`content/content-script.ts`)

Injected into supported AI platforms at `document_idle`.

- Detects current platform from `window.location.hostname`
- Installs a `MutationObserver` on `document.body` watching for new assistant message elements
- Platform-specific CSS selectors target the message text containers
- Throttles extraction to once per 5 seconds per element to avoid excessive messages
- Sends `EXTRACT_MEMORY` messages to the service worker

### Injector (`content/injector.ts`)

Handles writing context into the AI platform's input field.

- Platform-specific input selectors
- Handles both `<textarea>`/`<input>` (React synthetic event simulation) and `contenteditable` elements
- Uses `InputEvent` dispatch to trigger React's change detection properly

### Popup (`popup/popup.ts` + `popup.html`)

The primary user interface.

- Three tabs: Inbox (pending review), Passport (approved memories), Inject
- Review flow: approve / edit inline / reject
- Inject tab: shows detected platform, inject button, auto-inject toggle
- Footer: export to JSON file, import from JSON file
- Communicates exclusively via `chrome.runtime.sendMessage` to the service worker

### Options Page (`options/options.ts` + `options.html`)

Settings management:

- Per-platform enable/disable toggles
- Auto-inject on page load toggle
- Retention period slider (7–365 days)
- Danger zone: clear all memories with confirmation

---

## apps/web

A single self-contained `index.html` file. No build step. Pure HTML, CSS, and vanilla JavaScript.

Features:
- Canvas particle network animation
- Intersection observer fade-in animations
- Netlify Forms waitlist integration
- Full responsive layout
- Deployed to GitHub Pages and Netlify

---

## Data Flow

```
AI Platform (DOM)
    │
    │  MutationObserver detects new assistant message text
    ▼
content-script.ts
    │
    │  chrome.runtime.sendMessage({ type: 'EXTRACT_MEMORY', text, platform })
    ▼
service-worker.ts
    │
    │  MemoryExtractor.extract(text, platform)
    ▼
MemoryStore.add(item)  →  reviewState: PENDING
    │
    │  chrome.storage.local.set({ memoryStore: store.toJSON() })
    │  chrome.action.setBadgeText({ text: pendingCount })
    ▼
Popup Inbox (user reviews)
    │
    │  chrome.runtime.sendMessage({ type: 'APPROVE_MEMORY', id })
    ▼
MemoryStore.approve(id)  →  reviewState: APPROVED
    │
    │  On inject: PassportGenerator.generate(approvedMemories, platform)
    ▼
injector.injectContext(contextString, platform)
    │
    ▼
AI Platform Input Field
```

---

## Storage Strategy

**Runtime storage:** `Map<string, MemoryItem>` in the service worker's module scope.

**Persistence:** `chrome.storage.local` stores the serialized `MemoryStore` JSON after every mutation. Loaded on extension startup and `onInstalled`.

**Export format:** `PassportPack` JSON — a versioned, portable bundle that can be imported on another device.

**Retention:** Configurable via options page; future versions will implement automatic expiry based on `MemoryItem.expiry`.

---

## Security Considerations

- **No remote data transmission.** All processing is local. The extension makes no network requests.
- **Content Security Policy.** MV3 service workers run in an isolated context. Content scripts run in an isolated world from the page.
- **Least-privilege permissions.** `activeTab` and `storage` are the minimum required; `scripting` is used for injection only.
- **Host permissions** are scoped to the specific supported platforms listed in `manifest.json`.
- **User review gate.** Extracted memories are never exposed to injectors until explicitly approved by the user.
- **No eval, no remote code.** The extension contains no dynamic code execution.
