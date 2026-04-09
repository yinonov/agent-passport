# Architecture

## Monorepo Structure

```
agent-passport/
├── packages/
│   ├── schema/              # @agent-passport/schema
│   │   ├── src/
│   │   │   ├── passport.ts      # Core passport Zod schemas
│   │   │   ├── categories.ts    # Fact category definitions
│   │   │   └── index.ts         # Public API exports
│   │   └── __tests__/
│   │
│   ├── core/                # @agent-passport/core
│   │   ├── src/
│   │   │   ├── MemoryStore.ts    # Passport data persistence
│   │   │   ├── PassportGenerator.ts  # Prompt generation from passport data
│   │   │   ├── MemoryExtractor.ts    # Context extraction from conversations
│   │   │   ├── review.ts        # Review queue management
│   │   │   └── index.ts
│   │   └── __tests__/
│   │
│   ├── cli/                 # @agent-passport/cli
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point, command routing
│   │   │   ├── commands/        # init, add, approve, inject, list, export
│   │   │   ├── store.ts         # File-based passport store
│   │   │   └── output.ts        # ANSI-formatted terminal output
│   │   └── __tests__/
│   │
│   └── sdk/                 # @agent-passport/sdk
│       ├── src/
│       │   ├── PassportClient.ts    # Main SDK entry point
│       │   ├── resolver.ts          # File resolution (walk up directories)
│       │   ├── middleware.ts         # Middleware pattern for transforms
│       │   └── index.ts
│       └── __tests__/
│
├── apps/
│   ├── extension/           # @agent-passport/extension
│   │   ├── src/
│   │   │   ├── background/      # Service worker
│   │   │   ├── content/         # Content scripts (per-platform)
│   │   │   ├── popup/           # Extension popup UI
│   │   │   └── options/         # Settings page
│   │   ├── public/
│   │   │   └── manifest.json
│   │   └── vite.config.ts
│   │
│   └── web/                 # Landing page (static HTML/CSS)
│       ├── index.html
│       └── styles.css
│
├── docs/
├── package.json
└── pnpm-workspace.yaml
```

## The .agentpassport File Format

The `.agentpassport` file is a JSON document with a versioned schema. It is the portable unit of identity.

```json
{
  "version": "1.0",
  "metadata": {
    "createdAt": "2026-04-01T00:00:00Z",
    "updatedAt": "2026-04-09T12:00:00Z",
    "source": "cli"
  },
  "items": [
    {
      "id": "a1b2c3d4",
      "category": "PREFERENCE",
      "content": "I prefer TypeScript with strict mode enabled",
      "status": "approved",
      "confidence": 0.95,
      "source": {
        "platform": "claude",
        "extractedAt": "2026-04-01T10:30:00Z"
      },
      "tags": ["typescript", "tooling"]
    },
    {
      "id": "e5f6g7h8",
      "category": "EXPERTISE",
      "content": "Senior backend engineer specializing in distributed systems",
      "status": "approved",
      "confidence": 0.9,
      "source": {
        "platform": "manual",
        "extractedAt": "2026-04-02T09:00:00Z"
      },
      "tags": ["role", "backend"]
    }
  ]
}
```

All data entering or leaving a passport is validated against Zod schemas defined in `@agent-passport/schema`. The schema enforces required fields, category enums, status transitions, and content constraints.

## Data Flow

The system follows a pipeline with a human review checkpoint. The pipeline is the same regardless of which client initiates it:

```
                    ┌──────────────────────────────────────────────────────┐
                    │                   ANY CLIENT                         │
                    │   Extension  ·  CLI  ·  SDK  ·  VS Code  ·  Agent   │
                    └──────────┬───────────────────────────┬───────────────┘
                               │                           │
                               ▼                           ▼
Conversation ──► Extraction ──► Review Queue ──► Approved Store ──► Context Generation ──► Injection
                     │               │                                      │
                 AI patterns     User approves                      Platform-specific
                 detected        edits/rejects                      prompt formatting
```

1. **Conversation**: A content script (extension), CLI session, or SDK call provides conversation content.
2. **Extraction**: The `MemoryExtractor` in `@agent-passport/core` identifies reusable context -- preferences, facts, constraints, expertise signals.
3. **Review Queue**: Extracted items are placed in a pending queue. Nothing enters the passport without explicit user approval.
4. **Approved Store**: Approved items are persisted as structured passport entries with category, content, source metadata, confidence scores, and timestamps.
5. **Context Generation**: The `PassportGenerator` selects relevant entries and formats them into a context block, filtered by scope and platform.
6. **Injection**: The client inserts the generated context into the target AI platform -- as a system preamble (extension), a prepended message (CLI), or a string return value (SDK).

## Storage Strategy

Agent Passport uses three complementary storage mechanisms:

**File-based storage (`~/.agent-passport/`)**: The primary store for CLI and SDK workflows. The global passport lives at `~/.agent-passport/passport.json`. Configuration lives at `~/.agent-passport/config.json`. This directory is the canonical home for a user's passport data.

**Project-level `.agentpassport` files**: A `.agentpassport` file in a project directory carries project-specific context. The SDK resolves passport files by walking up the directory tree from the current working directory, merging project-level and global passports. This is analogous to how `.env` files or `.eslintrc` files work.

**`chrome.storage.local`**: The extension stores passport data in Chrome's local storage API, which provides up to 10MB of persistent storage scoped to the extension. Data survives browser restarts and extension updates, and synchronizes automatically across extension contexts (popup, background, content scripts).

**Export/Import**: All clients support JSON export and import. The exported format matches the Zod schema exactly, enabling cross-client portability. Export from the extension, import into the CLI, or vice versa.

## SDK Architecture

The SDK (`@agent-passport/sdk`) provides programmatic access to passports for AI agents, developer tools, and integrations.

**PassportClient**: The main entry point. Loads passport data from the filesystem, exposes query methods for filtering by category, tag, or scope, and generates formatted context strings via `toSystemPrompt()`.

**File Resolution**: The SDK resolves passport files by walking up the directory tree from `process.cwd()`, looking for `.agentpassport` files. If found, project-level items are merged with the global passport at `~/.agent-passport/passport.json`. This enables per-project context without manual configuration.

**Middleware Pattern**: The SDK supports a middleware chain for transforming passport data before it is rendered into a prompt. Middleware can filter items by relevance, inject additional context, enforce token limits, or apply organization-specific rules. Middleware functions compose: `client.use(filterByScope).use(enforceTokenLimit).use(addTeamContext)`.

## CLI Architecture

The CLI (`@agent-passport/cli`) provides terminal-based passport management.

**File Store**: The CLI reads and writes to `~/.agent-passport/passport.json` using the same Zod-validated schemas as every other client. All mutations go through the core `MemoryStore`.

**Command Routing**: Commands (`init`, `add`, `list`, `approve`, `reject`, `inject`, `export`, `import`) are dispatched through a lightweight router. Each command is a standalone module that receives parsed arguments and the store instance.

**ANSI Output**: Terminal output uses ANSI escape codes for colored, structured display -- tables for listing entries, diffs for review, and status indicators for operations. No external UI framework dependencies.

## Extension Architecture

**Background Service Worker** (`background/`): The long-lived process that manages the passport store, handles messages between the popup and content scripts, and coordinates extraction and storage operations. Runs as a Manifest V3 service worker.

**Content Scripts** (`content/`): Platform-specific scripts injected into supported AI websites. Each platform has its own content script module implementing a common `PlatformAdapter` interface with methods for detecting conversation state, extracting messages, and injecting context. Content scripts run in an isolated world, preventing page JavaScript from accessing passport data.

**Popup** (`popup/`): The primary user interface for the extension. Displays the review queue, passport contents, and settings. Built with vanilla TypeScript and lightweight DOM manipulation to minimize bundle size.

**Platform Detection**: Content scripts are registered in `manifest.json` with URL match patterns:
- `https://chat.openai.com/*` -- ChatGPT
- `https://chatgpt.com/*` -- ChatGPT (new domain)
- `https://claude.ai/*` -- Claude
- `https://gemini.google.com/*` -- Gemini
- `https://www.perplexity.ai/*` -- Perplexity
- `https://github.com/*` -- GitHub Copilot

## Security Considerations

- **No remote data transmission.** No client makes network requests. All data stays on the local device. The extension makes zero outbound connections. The CLI reads and writes local files only. The SDK operates entirely in-process.
- **Content script isolation.** Extension content scripts run in an isolated world, preventing page JavaScript from accessing passport data.
- **Minimal permissions.** The extension requests host permissions only for supported AI platforms, not broad `<all_urls>` access. The CLI and SDK require no special system permissions.
- **Input validation.** All data entering a passport is validated against Zod schemas at runtime. Malformed imports are rejected. Schema version mismatches trigger migration or rejection.
- **No eval, no dynamic code.** The extension uses Manifest V3 with a strict Content Security Policy. No dynamic code execution anywhere in the codebase.
- **Permission scoping.** Passport items are organized by category, enabling fine-grained access control. Future agent access will be scoped to specific categories, not the entire passport.

## Schema Design Rationale

**Why Zod?** Zod provides runtime validation with static type inference. Passport data crosses trust boundaries (user imports, content script extraction, SDK file reads) and must be validated at runtime, not just at compile time. Zod schemas serve as both the type definition and the validation layer, eliminating drift between the two.

**Why categories?** Passport items are organized into categories (PREFERENCE, EXPERTISE, CONSTRAINT, PERSONAL, PROJECT) to enable scoped access. An agent requesting your coding preferences should not automatically see your personal information. Categories also improve context generation by allowing relevance-based selection and token budget allocation.
