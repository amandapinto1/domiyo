# Agent Instructions

## Project Context

Domiyo is a household coordination PWA for bills, tasks, meals, recipes, and grocery shopping. Read [docs/PRD.md](docs/PRD.md), [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and [docs/CONVENTIONS.md](docs/CONVENTIONS.md) before changing product behavior, user-facing design, system structure, or code.

The approved technical direction (product owner, 2026-09-30) is a single full-stack Next.js application (App Router, TypeScript) with PostgreSQL, Drizzle ORM and migrations, Better Auth for email-and-password authentication, Tailwind + shadcn/ui themed with our design tokens, Vitest + Playwright for tests, `pnpm`, Docker Compose for the local PostgreSQL, and Railway for hosting. The Anthropic Claude API is approved (2026-09-30) only for reading cronograma PDFs; confirm its data-retention terms and cost before production. Treat this as the approved direction, not permission to introduce unreviewed infrastructure or paid services. Exact library versions and runnable commands are established when the application scaffold exists.

## Before You Start

- Read the product, design, architecture, and conventions documents above and any more-specific `AGENTS.md` or repository instructions that apply to the files being changed.
- Inspect the current implementation and tests before editing. Do not assume the planned architecture has already been scaffolded.
- Use the project's existing package scripts and conventions. Do not report a command as available unless it exists in the repository.
- For UI work, inspect the design documents and screen references in `docs/design/`, along with current design tokens, before proposing visual changes. If the screen you are building has no export there yet, read it in Figma through the Figwright MCP; if it is not in Figma either, say so instead of inventing a final visual design. The Figwright MCP (with the Figwright plugin open in Figma) is the approved way for agents to read and write Figma designs. Do not configure or use any other MCP server, including the official Figma MCP, without the product owner's approval.

## General Rules

- Keep changes focused on the requested behavior. Prefer the existing framework, component patterns, and APIs.
- Do not silently convert an open product decision in `docs/PRD.md` into a permanent requirement. Surface it for the product owner or label a temporary implementation choice clearly.
- Add or update tests for every behavior change. Run the narrowest relevant tests first, then the applicable typecheck, lint, and build commands available in the repository.
- Update documentation when implementation decisions materially change the documented product or architecture.
- Do not add paid services, paid APIs, or recurring-cost infrastructure without explicit approval.
- Do not commit, deploy, or make destructive data changes unless explicitly requested.
- Write documentation, code, identifiers, and code comments in English. Write user-facing interface copy in Brazilian Portuguese (`pt-BR`), and format dates and currency (`BRL`) for that locale.

## Code Guidelines

- Use TypeScript everywhere; retain strict compiler settings once configured. Follow the folder layout and patterns in `docs/CONVENTIONS.md` (route-level `_components`, `_actions`, `_data-access`; shared logic in `src/server`).
- Keep UI, application/domain logic, and persistence concerns separated according to the existing project structure.
- Use explicit, domain-oriented names. Do not pass database rows to Client Components; data-access functions return minimal view models.
- Validate untrusted input with Zod at every server boundary (Server Actions, Route Handlers) and return safe, actionable errors without leaking implementation details.
- Use database migrations for every schema change. Never edit production schema manually or change schema without a migration and corresponding tests.
- Use stable, non-enumerable public identifiers (UUIDs) for resources exposed in URLs, forms, or Server Action arguments.
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
- Never put secrets in client bundles, source control, logs, test fixtures, screenshots, or error responses. Never prefix a secret with `NEXT_PUBLIC_`. Modules that touch the database, keys, or PDF parsing import `server-only` and run in the Node.js runtime.
- Enforce authorization on the server for every resource and action, with household membership checked on every relevant request. Every Server Action and Route Handler is a public endpoint: each one calls `requireSession()` and, for household data, `requireHouseholdMember()`. Middleware/proxy redirects are not authorization. Never rely on client-side filtering to enforce household isolation.
- Hash passwords with Argon2id (configured in Better Auth). Use secure session/cookie practices, keep the Server Action and Better Auth origin checks on (CSRF), rate-limit authentication and invitation endpoints, and expire/revoke invitation links. Apply the security checklist in `docs/CONVENTIONS.md` to every change.
- Encrypt traffic in transit and database storage at rest. Sensitive fields must be encrypted at field level in the database; until the sensitive-data inventory exists, flag any new personal or sensitive field for classification instead of storing it unreviewed. Keep encryption keys outside the database and outside source control. Do not invent cryptographic primitives; use maintained, platform-supported implementations and document key management.
- Minimize personal data in logs and telemetry. Do not add analytics, error monitoring (Sentry is deferred), or other external data processors without approval and a privacy review.
- Use the [OpenAI Security Best Practices skill](https://raw.githubusercontent.com/openai/skills/main/skills/.curated/security-best-practices/SKILL.md) for security-sensitive work. Check its language/framework-specific references relevant to the changed code and apply them alongside these project rules.
- Report suspected exposure or mishandling of secrets or personal data promptly; do not reproduce the exposed values in the report.

## Commands

The package manager is `pnpm` (Node.js 22). Scripts in `package.json`:

- Install: `pnpm install`
- Database (Docker Compose, creates `domiyo` and `domiyo_test`): `pnpm db:up`
- Migrations: `pnpm db:generate --name <change>` after a schema change, `pnpm db:migrate` to apply locally; production applies them with `pnpm db:migrate:deploy` as Railway's pre-deploy step (`.railway/railway.ts`)
- Local verified user (skips email confirmation): `pnpm user:create <email> <password> <name> [surname]`
- Local invitation link (until Perfil can create one): `pnpm invite:create <inviterEmail> [householdName]`
- Dev server: `pnpm dev` (reads `.env`; see `.env.example`)
- Unit tests: `pnpm test`; end-to-end (needs `TEST_DATABASE_URL`, stop `pnpm dev` first): `pnpm exec playwright install chromium` once, then `pnpm test:e2e`
- Lint and typecheck: `pnpm lint`, `pnpm typecheck`
- Production build: `pnpm build`

## Boundaries

Obtain explicit approval before:

- changing the approved frontend/backend/database direction, deployment topology, or household data model;
- introducing a paid or recurring-cost service, external analytics, or a new data processor;
- changing authentication, invitation, authorization, encryption, data retention, or deletion behavior;
- changing the database schema without an agreed migration plan;
- changing brand direction or approved design tokens;
- implementing native mobile clients or push notifications, which are outside V1. PDF cronograma import into the shared agenda is in scope for V1 (see `docs/PRD.md`, "Shared agenda and PDF cronograma import"); full personal-schedule import and external calendar integrations remain outside V1.

<!-- The block below is rewritten by `next dev`, so its H1 is silenced here instead of edited. -->
<!-- markdownlint-disable MD025 -->
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
