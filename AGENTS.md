# Agent Instructions

## Project Context

Domiyo is a household coordination PWA for bills, tasks, meals, recipes, and grocery shopping. Read [docs/PRD.md](docs/PRD.md), [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing product behavior, user-facing design, or system structure.

The initial technical direction is React + TypeScript for the web client, NestJS + TypeScript for the API, PostgreSQL for persistence, and a `pnpm` workspace. Treat this as the approved starting direction, not permission to introduce unreviewed infrastructure or paid services. Exact library versions and runnable commands are established when the application scaffold exists.

## Before You Start

- Read the three product/design/architecture documents above and any more-specific `AGENTS.md` or repository instructions that apply to the files being changed.
- Inspect the current implementation and tests before editing. Do not assume the planned architecture has already been scaffolded.
- Use the project's existing package scripts and conventions. Do not report a command as available unless it exists in the repository.
- For UI work, inspect the design documents and screen references in `docs/design/`, along with current design tokens, before proposing visual changes. If the screen you are building has no reference there yet, say so instead of inventing a final visual design. The Figwright MCP (with the Figwright plugin open in Figma) is the approved way for agents to read and write Figma designs. Do not configure or use any other MCP server, including the official Figma MCP, without the product owner's approval.

## General Rules

- Keep changes focused on the requested behavior. Prefer the existing framework, component patterns, and APIs.
- Do not silently convert an open product decision in `docs/PRD.md` into a permanent requirement. Surface it for the product owner or label a temporary implementation choice clearly.
- Add or update tests for every behavior change. Run the narrowest relevant tests first, then the applicable typecheck, lint, and build commands available in the repository.
- Update documentation when implementation decisions materially change the documented product or architecture.
- Do not add paid services, paid APIs, or recurring-cost infrastructure without explicit approval.
- Do not commit, deploy, or make destructive data changes unless explicitly requested.
- Write documentation, code, identifiers, and code comments in English. Write user-facing interface copy in Brazilian Portuguese (`pt-BR`), and format dates and currency (`BRL`) for that locale.

## Code Guidelines

- Use TypeScript for frontend and backend code; retain strict compiler settings once configured.
- Keep UI, application/domain logic, and persistence concerns separated according to the existing project structure.
- Use explicit, domain-oriented names. Share types only where a real client/API contract benefits from it; do not couple the frontend to database entities.
- Validate untrusted input at API boundaries and return safe, actionable errors without leaking implementation details.
- Use database migrations for every schema change. Never edit production schema manually or change schema without a migration and corresponding tests.
- Use stable, non-enumerable public identifiers for resources exposed through the API.
- Do not add dependencies without first checking whether the repository already provides the capability. Explain why a new dependency is needed and obtain approval for paid or externally hosted services.

## Design Rules

- Follow `docs/DESIGN_SYSTEM.md` and the latest design documents/screens supplied by the product owner as the design source of truth. Do not invent or hard-code a competing palette, typography system, or token values while those design decisions are pending.
- Use the Impeccable and Anthropic `frontend-design` skill guidance when available. Preserve existing product conventions and design decisions; these references do not authorize replacing them.
- Build for real household tasks and mobile use, not a marketing landing page. Include loading, empty, error, disabled, and success states for relevant workflows.
- Prefer accessible semantic HTML, labeled controls, keyboard-operable interactions, visible focus, and WCAG 2.2 AA contrast.
- Avoid nested cards, decorative UI without a user purpose, and motion that ignores `prefers-reduced-motion`.

## Security and Privacy Rules

- Treat LGPD as a product and engineering constraint, but do not claim legal compliance without review by a qualified professional.
- Never access, print, copy, commit, or expose secret values, credentials, tokens, private keys, or production data. Do not open secret-bearing files such as `.env`; use variable names and a sanitized `.env.example` only. Ask the owner to perform any operation that requires secret access.
- Never put secrets in frontend bundles, source control, logs, test fixtures, screenshots, or error responses.
- Enforce authorization on the server for every resource and action, with household membership checked on every relevant request. Never rely on client-side filtering to enforce household isolation.
- Hash passwords with a suitable password-hashing algorithm. Use secure session/cookie practices, CSRF protection where applicable, rate-limit authentication and invitation endpoints, and expire/revoke invitation links.
- Encrypt traffic in transit and database storage at rest. Sensitive fields must be encrypted at field level in the database; until the sensitive-data inventory exists, flag any new personal or sensitive field for classification instead of storing it unreviewed. Keep encryption keys outside the database and outside source control. Do not invent cryptographic primitives; use maintained, platform-supported implementations and document key management.
- Minimize personal data in logs and telemetry. Do not add analytics or external data processors without approval and a privacy review.
- Use the [OpenAI Security Best Practices skill](https://raw.githubusercontent.com/openai/skills/main/skills/.curated/security-best-practices/SKILL.md) for security-sensitive work. Check its language/framework-specific references relevant to the changed code and apply them alongside these project rules.
- Report suspected exposure or mishandling of secrets or personal data promptly; do not reproduce the exposed values in the report.

## Commands

The application has not been scaffolded yet. Do not assume these commands exist. Once manifests and scripts are added, document the exact commands here and use the repository-defined scripts for:

- dependency installation;
- local development for web and API;
- unit/integration tests;
- lint and typecheck;
- production build.

The intended package manager is `pnpm`; confirm the workspace scripts before running commands.

## Boundaries

Obtain explicit approval before:

- changing the approved frontend/backend/database direction, deployment topology, or household data model;
- introducing a paid or recurring-cost service, external analytics, or a new data processor;
- changing authentication, invitation, authorization, encryption, data retention, or deletion behavior;
- changing the database schema without an agreed migration plan;
- changing brand direction or approved design tokens;
- implementing native mobile clients, PDF/calendar import, or push notifications, which are outside V1.