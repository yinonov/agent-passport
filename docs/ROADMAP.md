# Roadmap

## Phase 1: Extension MVP + CLI + SDK -- Q2 2026

The foundation. A working Chrome extension, a CLI tool, and an SDK that all share the same passport format and core runtime. This is what is being built now.

**Core Features**
- Context extraction from AI conversations
- Review queue with approve, edit, and reject actions
- Structured passport storage using Zod-validated schemas
- Automatic context injection into new AI sessions
- Export/import passport as JSON
- Popup UI for managing passport entries
- CLI for terminal-based passport management (`passport init`, `add`, `approve`, `inject`)
- SDK for programmatic passport access (`PassportClient`, file resolution, `toSystemPrompt()`)
- `.agentpassport` file format specification

**Platform Support**
- ChatGPT (extension)
- Claude (extension + CLI injection)
- Perplexity (extension)
- Gemini (extension)
- GitHub Copilot (extension)
- Terminal workflows (CLI)
- Any AI agent or developer tool (SDK)

**Milestones**
- Schema package complete with full test coverage
- Core logic package with MemoryStore, PassportGenerator, MemoryExtractor
- CLI package with init, add, approve, inject, list, export commands
- SDK package with PassportClient, file resolution, middleware pattern
- Working extension on at least two platforms
- Chrome Web Store submission

---

## Phase 2: Team Passports -- Q3 2026

Extend passports from individual to team use. Share organizational context -- coding standards, architectural decisions, project glossaries -- across a team so that every AI interaction is grounded in institutional knowledge.

**Core Features**
- Team passport creation and management
- Role-based access control (admin, editor, viewer)
- Merge personal and team passports with conflict resolution
- Encrypted sync between teammates using user-controlled storage backends
- Team onboarding flows (new member inherits team context automatically)
- Shared review queue for team-level context proposals

**Technical Requirements**
- End-to-end encryption for shared passport data
- Conflict resolution strategy for concurrent edits
- Storage backend abstraction (support for multiple sync providers)
- Team passport schema extensions (roles, permissions, org metadata)

---

## Phase 3: Agent Protocol -- Q4 2026

A standardized API for AI agents to request passport access with consent flows. Like OAuth for AI context -- agents declare what scopes they need, users review and approve, and access is revocable.

**Core Features**
- Agent Protocol specification (request, consent, access, revoke)
- OAuth-like consent flow for agent access requests
- Scoped permissions (agents request specific categories, not the whole passport)
- Consent management UI in the extension and CLI
- Revocation and audit log
- Agent identity verification (which agent is requesting, and on whose behalf)

**Use Cases**
- CI/CD agents that know your deployment preferences
- Code review agents that understand your team's style guide
- Research agents that know your domain expertise
- IDE plugins that inject context into Copilot or Cursor
- Autonomous agents that negotiate what they need to know before they start working

---

## Phase 4: Passport Network -- 2027

A federated network for passport discovery and exchange, enabling cross-organization sharing and enterprise deployment.

**Core Features**
- Federated passport discovery (opt-in, privacy-preserving)
- Cross-organization sharing with fine-grained permissions
- Enterprise SSO integration (SAML, OIDC)
- Enterprise administration and compliance tools
- Cross-device passport synchronization via encrypted sync
- Passport versioning and history
- Passport attestations (verified credentials, endorsements)

**Technical Requirements**
- Federated protocol specification
- End-to-end encrypted sync infrastructure
- Enterprise SSO and directory integration
- Compliance and audit capabilities
- Key management and rotation

---

## Future Explorations

These are directions we are thinking about beyond the four-phase roadmap:

- **Passport-aware AI models.** Models that natively understand the passport format and can request scoped access as part of their inference loop.
- **Context negotiation protocol.** A protocol for agents to discuss and negotiate what context they need before starting a task, reducing over-sharing and improving relevance.
- **Multi-modal memories.** Passport items that include not just text but visual preferences, audio context, diagram styles, and other non-text modalities.
- **Passport marketplace.** Curated, shareable passport templates for common roles (frontend engineer, product manager, data scientist) that users can adopt and customize.
- **Mobile clients.** Passport management and injection on mobile AI apps.

---

## Non-Goals (for now)

These are explicitly out of scope to maintain focus:

- **AI model training.** Passport data is never used for model training. Period.
- **Social features.** This is infrastructure, not a social network.
- **Centralized hosting.** We will never be the custodian of your passport data. Local-first and user-controlled is a permanent architectural commitment.
