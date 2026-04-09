# Vision: The Identity Layer for the Agent Internet

## The Fragmentation Crisis

We are living through a strange moment in the history of computing. Hundreds of millions of people use AI assistants daily, and every single one of them starts every single conversation from scratch.

You tell Claude your tech stack on Monday. You explain the same thing to ChatGPT on Tuesday. You re-describe your role to Gemini on Wednesday. You correct Copilot's assumptions on Thursday. By Friday, you have had the same introductory conversation five times, across five platforms, and none of them remember any of it by next week.

This is not a minor inconvenience. It is a structural failure at the foundation of the AI era. Your identity -- your preferences, your expertise, your constraints, your working style -- is fractured across every platform you touch, locked in ephemeral chat logs that no tool can access and no session can recall. Each AI sees a sliver of who you are. None sees the whole picture. And the problem is getting worse, not better, as the number of AI tools in a typical workflow grows from two to five to twenty.

## Why the Internet Needs a Portable Identity Standard

The internet has solved this kind of problem before. Configuration was chaos until `.env` files standardized how applications find their settings. Authentication was a nightmare of per-site passwords until OAuth gave us a universal protocol for delegated access. In both cases, an open standard emerged that was simple enough to adopt everywhere and flexible enough to handle real complexity.

The agent era needs the same thing for identity. Not authentication identity -- not who you are in a security sense -- but *context* identity: what an AI needs to know about you to be genuinely useful. Your preferences, your expertise, your constraints, your rules, your project context. Today this information exists nowhere and everywhere, scattered across a dozen disconnected platforms. It needs a home.

That home is the `.agentpassport` file.

## The Three-Layer Architecture

Agent Passport is not a Chrome extension. It is infrastructure. The architecture has three layers, each designed to be useful independently and powerful together.

The **Format Layer** is the `.agentpassport` file itself -- a JSON document with a versioned schema, carrying structured items that describe who you are and how you work. It sits in your project directory, or in your home folder, or wherever you need it. Any tool that can read JSON can read a passport. The format is the foundation, and it is deliberately simple.

The **Runtime Layer** is the core library that manages the lifecycle of passport data: extracting context from conversations, routing it through a review queue, storing approved items, and generating prompts tailored to specific platforms and contexts. The runtime is where intelligence lives -- relevance scoring, conflict resolution, scope filtering -- but it exposes a clean API that any client can call.

The **Client Layer** is where users interact with their passports. The Chrome extension injects context into web-based AI tools. The CLI lets developers manage passports from the terminal. The SDK lets AI agents and developer tools read passports programmatically. Future clients -- VS Code extensions, IDE plugins, mobile apps, agent frameworks -- all plug into the same runtime and read the same format. Build a new client, and every passport in the world works with it immediately.

## The Future We Are Building Toward

The first phase is about making passports useful for individuals: capture what matters, review it, carry it with you. But the architecture is designed for what comes next.

**Team Passports** let organizations share context -- coding standards, architectural decisions, domain glossaries -- so that every AI interaction is grounded in institutional knowledge, not just individual preference. A new engineer joins the team and their AI tools already know the conventions.

**The Agent Protocol** is where things get genuinely new. As AI agents begin to act autonomously on your behalf -- booking travel, reviewing code, managing infrastructure -- they will need structured access to your context. The Agent Protocol defines how an agent requests access to specific scopes of your passport through a consent flow you control, much like OAuth lets an app request access to your Google Calendar without seeing your email. You review, approve, and revoke access. The agent gets exactly what it needs and nothing more.

**The Passport Network** extends this to federated discovery and cross-organization sharing. Encrypted passport exchange between teammates. Enterprise SSO integration. Portable context that moves with you when you change jobs. A mesh of identity that agents can navigate with your permission.

Further out, we see passport-aware AI models that can negotiate context access directly, multi-modal memories that include not just text preferences but visual and audio context, and a context negotiation protocol that lets agents discuss what they need to know before they start working.

## Why It Must Be Open Source and User-Controlled

There is a version of this future that is deeply dystopian: a single company controls the identity layer, monetizes your context, and locks you into their ecosystem. We have seen this movie before with social graphs, and we know how it ends.

Agent Passport takes the other path. The format is open. The code is MIT-licensed. The data is local-first and user-controlled. There are no servers to trust, no accounts to create, no data to exfiltrate. When sync and sharing features arrive, they will be end-to-end encrypted and opt-in.

The portable AI identity layer must be a public good. The value must accrue to users, not to a platform. The standard must be controlled by the community, not by a company. This is not idealism -- it is the only architecture that can earn the trust required to hold something as intimate as a person's working identity.

The agent internet is coming. The question is whether your identity in it will be controlled by platforms or by you. Agent Passport is infrastructure for the second option.
