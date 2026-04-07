# Roadmap: Agent Passport

## Overview

Agent Passport is built in three phases: establishing a solid, trustworthy MVP; adding intelligence and quality to memory management; and growing an open ecosystem around portable AI identity.

---

## Phase 1 — MVP (Current)

**Goal:** Prove the core loop works. Capture → Review → Inject.

### Delivered

- [x] Monorepo with `@agent-passport/schema` and `@agent-passport/core`
- [x] Zod-validated `MemoryItem`, `Passport`, and `PermissionGrant` types
- [x] `MemoryStore` with full CRUD, review states, export/import
- [x] `MemoryExtractor` with heuristic regex patterns for 5 memory categories
- [x] `PassportGenerator` with full and compact prompt formats
- [x] Chrome MV3 extension:
  - Service worker handling all message types
  - Content scripts with `MutationObserver` for 6 AI platforms
  - Platform-specific input injector
  - Dark premium popup with Inbox / Passport / Inject tabs
  - Options page with per-platform toggles and retention settings
- [x] Static landing page with canvas particle animation and Netlify Forms waitlist
- [x] GitHub Actions deploy to GitHub Pages

### In Progress

- [ ] Extension store submission (Chrome Web Store)
- [ ] Icon assets (16px, 32px, 48px, 128px)
- [ ] End-to-end manual testing across all 6 supported platforms
- [ ] README polish and documentation site

---

## Phase 2 — Intelligence

**Goal:** Make memory extraction smarter, more accurate, and self-maintaining.

### Memory Quality

- [ ] **LLM-assisted extraction** — optional integration with a local model (Ollama, WebLLM) or user-provided API key to extract richer, more nuanced memories
- [ ] **Smart deduplication** — semantic similarity matching to avoid near-duplicate memories (e.g., "I prefer TypeScript" vs. "Always use TypeScript")
- [ ] **Conflict resolution** — detect when a new memory contradicts an existing one and prompt the user to reconcile
- [ ] **Confidence decay** — reduce confidence scores for memories that haven't been referenced recently
- [ ] **Memory expiry enforcement** — automatically surface memories past their expiry date for re-review

### UX Improvements

- [ ] **Bulk approve** — approve all pending memories of a category with one click
- [ ] **Search and filter** — find memories by content, tag, or category
- [ ] **Memory tagging** — user-defined tags for custom organization
- [ ] **Session history** — see which platforms contributed which memories
- [ ] **Context preview** — see the generated prompt before injecting it

### Platform Support

- [ ] **Firefox extension** — port to Manifest V2 / Firefox APIs
- [ ] **Brave / Edge** compatibility verification
- [ ] **New platforms**: Mistral Le Chat, Cohere Coral, You.com, Meta AI

---

## Phase 3 — Ecosystem

**Goal:** Agent Passport becomes infrastructure for the agent internet.

### Passport API

- [ ] **Local REST API** — optional local server that exposes passport data to desktop AI agents (Cursor, Windsurf, local tooling)
- [ ] **Permission grants UI** — grant specific agents access to specific memory categories with time-limited scope
- [ ] **Revocation** — revoke grants with immediate effect
- [ ] **Audit log** — see which agents accessed which parts of your passport and when

### Mobile

- [ ] **iOS Safari extension** — bring memory capture to mobile AI browsing
- [ ] **Android Chrome extension** — (pending Google's extension support for Android Chrome)
- [ ] **Mobile app** — standalone iOS/Android app for reviewing and managing your passport

### Interoperability

- [ ] **Standard passport format** — publish a versioned JSON-LD schema for `PassportPack` so other tools can read and write it
- [ ] **MCP integration** — expose passport as a Model Context Protocol server for Claude Desktop and compatible clients
- [ ] **OpenAI plugin** — expose passport contents via the ChatGPT plugin/action protocol
- [ ] **Passport marketplace** — community-shared passport templates for common roles (frontend dev, data scientist, product manager)

### Advanced Memory

- [ ] **Hierarchical memory** — organize memories into projects, contexts, or "modes" that can be selectively activated
- [ ] **Memory versioning** — track changes to a memory over time with full history
- [ ] **Collaborative passports** — share a team context across an organization (opt-in, still locally hosted)

---

## Non-Goals

The following are explicitly out of scope, both for practical and principled reasons:

- **Agent Passport cloud** — there will be no central server storing user memories. This is a design principle, not a product limitation.
- **Advertising or data monetization** — Agent Passport will never be funded by selling user data or attention.
- **Automatic injection without review** — the review gate is sacred. Memories should always require approval before they are trusted.
