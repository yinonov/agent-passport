# Agent Passport — Roadmap

## Vision

Build Agent Passport from a Chrome extension MVP into the foundational identity and memory protocol for the agent internet.

---

## Phase 1 — MVP (Current)

**Goal:** Prove the concept. Ship a working extension that real users find valuable.

- [x] pnpm monorepo with TypeScript everywhere
- [x] `@agent-passport/schema` — Zod types for MemoryItem, Passport, PassportPack, PermissionGrant
- [x] `@agent-passport/core` — MemoryStore, PassportGenerator, MemoryExtractor
- [x] Chrome MV3 extension with background service worker
- [x] Content scripts for ChatGPT, Claude, Perplexity, Gemini, Grok
- [x] Beautiful dark popup UI with Memory Inbox / Passport / Inject tabs
- [x] Local-first storage (chrome.storage.local)
- [x] Landing page with waitlist
- [x] GitHub Actions CI/CD
- [x] Open source (MIT)

---

## Phase 2 — Enhanced Memory (Q2 2026)

**Goal:** Make memory collection automatic and intelligent.

- [ ] **Auto-extraction mode** — automatically detect and save key facts from conversations without user intervention
- [ ] **Semantic deduplication** — merge similar memories using embeddings (local, privacy-preserving)
- [ ] **Memory confidence scoring** — show confidence levels and let users promote/demote memories
- [ ] **Conversation import** — bulk import from ChatGPT export ZIP, Claude export
- [ ] **Memory search** — full-text search across all memories in the popup
- [ ] **Memory categories view** — filter and browse by category
- [ ] **Tags system** — user-defined tags on memories
- [ ] **Memory aging** — optional decay for time-sensitive memories

---

## Phase 3 — Advanced Permissions (Q3 2026)

**Goal:** Enterprise-grade access control.

- [ ] **Per-session grants** — grant access for just the current conversation
- [ ] **Time-limited grants** — auto-expiring permissions
- [ ] **Scope granularity** — individual memory-level permissions (not just category-level)
- [ ] **Audit log** — track every time context was injected and to which platform
- [ ] **Permission templates** — preset bundles (e.g. "Work mode", "Research mode")
- [ ] **Revocation UI** — visual permission management dashboard

---

## Phase 4 — Passport Protocol (Q4 2026)

**Goal:** Make Agent Passport an interoperable open standard.

- [ ] **Passport v2 schema** — DID-compatible, signed with user keypair
- [ ] **Export / Import** — JSON file export, QR code sharing, encrypted backup
- [ ] **Web API** — optional local HTTP server for agent-to-agent passport queries
- [ ] **VS Code extension** — inject context into GitHub Copilot / Cursor
- [ ] **CLI tool** — `passport inject --platform chatgpt --file my.passport.json`
- [ ] **SDK** — `@agent-passport/sdk` for third-party integrations
- [ ] **Agent Passport spec** — formal protocol specification document

---

## Phase 5 — Ecosystem (2027)

**Goal:** Agent Passport becomes the identity layer for the agent internet.

- [ ] **Firefox / Edge extensions**
- [ ] **Mobile apps** — iOS and Android passport manager
- [ ] **MCP integration** — Model Context Protocol native support
- [ ] **OpenAI Actions integration** — serve passport as a GPT Action
- [ ] **Passport marketplace** — share passport templates with the community
- [ ] **W3C proposal** — formalize as a web standard
- [ ] **Multi-device sync** — encrypted, zero-knowledge cloud sync (optional)
- [ ] **Hardware key support** — YubiKey / WebAuthn for passport signing

---

## Contributing

See the [GitHub repository](https://github.com/yinonov/agent-passport) to contribute. All contributions welcome — code, documentation, schema proposals, and feedback.

Issues labeled `good first issue` are great starting points.

---

*This roadmap is aspirational and community-driven. Priorities may shift based on user feedback.*
