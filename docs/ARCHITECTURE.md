# Architecture

**Status:** V1 architecture. The stack changed to full-stack Next.js on 2026-09-30 (product owner decision). The repository is not scaffolded yet; folder names below are confirmed during setup.

## System Overview

Domiyo is an online-first Progressive Web App built as a single full-stack Next.js application (App Router, TypeScript) backed by PostgreSQL. Decided by the product owner on 2026-09-30, replacing the earlier React client + NestJS API split. Server Components render data on the server, Server Actions handle mutations, and Route Handlers serve the few endpoints that need raw HTTP (cronograma PDF download, authentication, health check). The server is the authority for authentication, household membership, validation, and authorization; the browser must not be trusted to enforce access boundaries.

```text
Browser / installed PWA
        | HTTPS (pages, Server Actions, Route Handlers)
        v
Next.js application (Node.js runtime)
        | TLS database connection
        v
Managed PostgreSQL
```

Every Server Action and Route Handler is a publicly reachable endpoint, even when only our own UI calls it, so each one checks the session and household membership itself. Code that touches the database, encryption keys, or PDF parsing runs only in the Node.js runtime (never the Edge runtime) and imports `server-only`.

The PWA may cache its static application shell for installation and faster repeat loads. V1 does not promise offline mutations or background synchronization. Push notifications are deferred to V2.

## Tech Stack

| Concern | V1 direction | Status |
| --- | --- | --- |
| Application | Next.js (App Router) + React + TypeScript, full stack, installable responsive PWA. Next.js 16 at the time of writing; use the current stable major at scaffold time | Approved 2026-09-30 |
| Database | PostgreSQL, relational model | Approved direction |
| ORM and migrations | Drizzle ORM + drizzle-kit (versioned SQL migrations); raw SQL through Drizzle for `pgcrypto` calls | Approved 2026-09-30 |
| Authentication | Email and password with Better Auth (open-source library; sessions stored in our PostgreSQL; no external auth service); password hashing configured to Argon2id | Approved 2026-09-30; details in "Authentication, Authorization, and Invitations" |
| Validation | Zod schemas on the server for every Server Action and Route Handler input, reused by forms where useful | Approved (`docs/CONVENTIONS.md`) |
| UI | Tailwind CSS with the tokens from `docs/DESIGN_SYSTEM.md`; shadcn/ui on Radix primitives, re-themed with those tokens (never the default palette); Lucide icons; forms with React Hook Form + Zod | Approved (`docs/CONVENTIONS.md`) |
| Testing | Vitest + React Testing Library for unit and integration tests; Playwright for end-to-end tests | Approved 2026-09-30 |
| Package management | `pnpm`, single package (no monorepo) | Approved direction |
| Deployment | Railway: one Next.js service (`next start`, Node.js) plus managed PostgreSQL | Approved 2026-09-30; confirm domains, pricing, and data region before launch |
| Email delivery | Provider-agnostic adapter (SMTP first, console in development); see "Email delivery" | Planned; provider not selected, no paid provider without approval |
| File storage | Cronograma PDFs and profile photos stored encrypted in PostgreSQL (`bytea`) for the MVP; see "Sensitive data and field-level encryption" | Planned; avoids adding a storage service |
| Error monitoring | Structured server logs without personal data in the MVP. An external service such as Sentry is deferred: it is a new data processor and needs approval plus a privacy review | Deferred 2026-09-30 |
| Design source | Product-owner-created screens and design decisions supplied as documents in `docs/design/` | Planned handoff; agents may use the Figwright MCP for Figma, no other MCP integration |

Coding conventions (folder layout, component placement, Server Action and data-access patterns, naming, forms, security checklist) are in `docs/CONVENTIONS.md`. Pin exact library versions at scaffold time and record them; obtain approval before choices that materially affect security, recurring cost, or architecture.

### Hosting Recommendation

Railway runs the Next.js server and the managed PostgreSQL database in the same project: one deploy, private networking between app and database, and no VPS maintenance (backups, OS patching, service supervision). Vercel is not used: its free plan is limited to non-commercial use and it would add another data processor. Cloudflare may be adopted later for DNS only; never cache authenticated pages or responses on a shared CDN. Confirm current plan limits, pricing, backup/restore options, and database region before production use; do not treat provider pricing or availability as guaranteed by this document.

At the time of writing, Railway was not known to offer a Brazil region; verify its current region list before deciding. Since the household's data subjects are in Brazil, confirm whether storing/processing data outside Brazil requires LGPD international-transfer safeguards before choosing a production region; this is a legal/product decision, not solely a technical one.

A VPS may reduce direct monthly spend at scale or for an operator comfortable owning patching, monitoring, backups, recovery, and deployment. Revisit this choice using measured usage and operational capacity rather than hypothetical scale.

## Project Structure

Single Next.js application at the repository root (no monorepo). Establish when scaffolding and adjust to the actual implementation; the detailed rules are in `docs/CONVENTIONS.md`.

```text
AGENTS.md                  Agent working rules
docs/                      PRD, design system, architecture, conventions, design handoff
drizzle/                   Generated SQL migrations (versioned, reviewed)
public/                    Static assets and PWA icons
src/
  app/                     App Router routes (pt-BR URLs, e.g. /agenda, /perfil)
    (auth)/                Sign-in, sign-up, password reset, invitation acceptance
    (app)/                 Authenticated area (its layout requires a session)
      agenda/
        page.tsx           Server Component entry point
        _components/       Route-only components
        _actions/          Route-only Server Actions ("use server")
        _data-access/      Route-only reads (server-only)
    api/                   Route Handlers (auth, cronograma PDF download, health)
  components/              Shared UI (design-system components, re-themed shadcn/ui)
  server/                  Domain and application logic shared across routes (server-only)
    auth/                  Better Auth setup, requireSession, requireHouseholdMember
    crypto/                Field-encryption helpers (pgcrypto calls)
    cronograma/            PDF parsing and diff/import logic
    email/                 EmailSender interface and adapters
  db/                      Drizzle schema and client (server-only)
  lib/                     Framework-agnostic utilities (date formatting in the app time zone, etc.)
  hooks/                   Client hooks
  styles/                  Tailwind entry and design tokens
tests/                     Playwright end-to-end tests; unit tests live next to the code
```

Keep database models out of client components: data-access functions return plain, minimal view models. Organize domain logic around household membership, agendas and cronograma import, tasks, bills, meals/recipes/ingredients, grocery items, and notifications, with authorization enforced on the server.

## Data Flow

1. A user signs in using email and password; Better Auth verifies the Argon2id hash and creates a database-backed session referenced by an HTTP-only cookie.
2. Pages (Server Components), Server Actions, and Route Handlers run on the server over HTTPS. Each one validates input with Zod, derives the user's authorized household membership (`requireHouseholdMember`), applies domain rules, and reads or writes PostgreSQL data.
3. Every household-owned read and write is scoped and authorized server-side. Resource identifiers supplied by the client never substitute for membership checks.
4. Changes to shared tasks, bills, meals, recipes, ingredients, grocery items, and notifications are persisted transactionally where related state must remain consistent.
5. Task assignment by another member creates an in-app notification. V1 does not send push notifications.
6. Recurring tasks and bills create due occurrences idempotently so retries cannot create duplicate occurrences. The job/scheduler mechanism is an implementation decision; prefer a database-backed approach initially unless measured needs justify a queue.

## Database and Storage

- PostgreSQL is the system of record for accounts, households, memberships, invitations, tasks/occurrences, bills/occurrences, meal plans, recipes, ingredient catalog entries, grocery items, and in-app notifications.
- Use UUIDs or other non-enumerable public identifiers for every resource exposed in URLs, forms, or Server Action arguments. Apply foreign keys, uniqueness constraints, and indexes that reflect household ownership and common date/status queries.
- Model household ownership explicitly and make authorization-compatible query patterns easy to audit. Consider including household scope in relevant uniqueness constraints.
- All schema changes must be versioned migrations, reviewed, and covered by tests. Preserve a tested backup and restore path before production launch.
- Encrypt database storage at rest and all network connections in transit. Fields classified as sensitive also use field-level encryption (see below). Encryption keys are managed separately from database contents and source code; define key rotation and recovery procedures before production launch.
- The only stored files are imported cronograma PDFs (one per agenda, replaced on re-import) and profile photos. For the MVP they live encrypted in PostgreSQL (`bytea`) with size limits: PDF up to 10 MB, photo resized to at most 512×512 px and 1 MB before encryption. Revisit object storage only if measured size or cost requires it; any storage service needs approval.
- Define retention, account/household deletion, data export, and invitation expiry policies before production launch. Deleting a member's agenda (when they leave or are removed) also deletes its items and stored PDF.

### Sensitive data and field-level encryption

Decided by the product owner on 2026-09-30. Treat this as the technical plan for review, not a legal compliance determination; have it reviewed by a qualified professional before production.

| Data | Storage |
| --- | --- |
| Agenda item: `id`, `agenda_id`, `starts_at`, `ends_at` (`timestamptz`), subject color, `source` (imported/manual), `edited_manually`, audit timestamps | Plaintext, so the owner can inspect schedules by date in the database |
| Agenda item: title, type, location, teacher, class content, notes | Encrypted |
| Cronograma PDF bytes and original file name | Encrypted |
| Profile photo bytes | Encrypted |
| Member first name, surname, email | Plaintext (email is needed to look up accounts at sign-in); still personal data, so never log it |
| Password | Argon2id hash, never encrypted-and-recoverable |
| Invitation and password-reset tokens | Stored only as hashes |

Mechanism:

- Use PostgreSQL's `pgcrypto` extension (`pgp_sym_encrypt` / `pgp_sym_decrypt`, AES-256) so the same data can be decrypted by the server and by the owner's database function. The server passes the key as a bound query parameter; the key is read from the `FIELD_ENCRYPTION_KEY` environment variable and is never stored in the database, in migrations, or in source control.
- Each encrypted column stores the ciphertext plus a `key_version` column, so the key can be rotated: add the new key as `FIELD_ENCRYPTION_KEY` with `FIELD_ENCRYPTION_KEY_VERSION` incremented, keep the previous key as `FIELD_ENCRYPTION_KEY_PREVIOUS` until a re-encryption job has rewritten every row, then remove it.
- Owner read access: a function in a separate `admin` schema, for example `admin.agenda_items_readable(p_key text)`, returns agenda items with decrypted columns. `EXECUTE` is granted only to a dedicated database role used by the owner (never to the application role), the function is `SECURITY INVOKER`, and it returns nothing useful without the correct key. Do not create a plain view that decrypts, because a view would need the key stored in the database.
- Because the key travels inside the query, disable statement logging for the owner role (`log_statement = 'none'`, no `pg_stat_statements` capture of parameters) and never paste the key into shared scripts, tickets, or chat. Keep a copy of the key in the owner's password manager: losing it makes the encrypted data unrecoverable.
- Encrypted columns cannot be searched or sorted by the database; the MVP only needs date-range queries, which use the plaintext timestamps.

### Time zones

- Store every instant as `timestamptz` (UTC). MVP: the server and client format dates in `America/Fortaleza`, from a single configuration value (`APP_DEFAULT_TIME_ZONE`), not hard-coded across the code.
- Later versions add `users.time_zone` (IANA name, default `America/Fortaleza`), chosen in Perfil; each user sees every agenda in their own time zone. Design the date-formatting layer so this is a data change, not a rewrite.
- PDF import converts the cronograma's local times using the issuing institution's time zone (`America/Fortaleza` for the MVP), independent of the viewer.

### Email delivery

The provider is not chosen yet. The integration is built so the owner only has to fill in keys:

- The server depends on an `EmailSender` interface (`send({ to, subject, html, text })`), with two adapters: `console` (development and tests: logs a redacted summary, never the full body with links in production) and `smtp` (works with most providers, such as Brevo, Resend, Amazon SES or Mailgun, through their SMTP credentials). A provider-specific HTTP adapter can be added later behind the same interface.
- Emails in the MVP (pt-BR, each with HTML and plain-text versions): household invitation, password reset, and "sua senha foi alterada" (security notice after a reset). Layout and copy: `docs/design/email/README.md`; rules in `docs/DESIGN_SYSTEM.md` › "Email templates".
- Links in emails use `APP_PUBLIC_URL`; tokens expire and are single-use (see "Authentication, Authorization, and Invitations"). No tracking pixels or click tracking.
- Before production: confirm the provider's data-processing terms and region (LGPD), configure SPF, DKIM, and DMARC for the sending domain, and get approval for any cost.

### Configuration

Runtime configuration comes from server-only environment variables (never prefixed `NEXT_PUBLIC_`) in the hosting platform's secret manager. The repository root has a sanitized `.env.example` with these names and no values (`.env` files are git-ignored):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (application role) |
| `APP_PUBLIC_URL` | Public URL of the app, used in email links and as the trusted origin |
| `APP_DEFAULT_TIME_ZONE` | `America/Fortaleza` for the MVP |
| `BETTER_AUTH_SECRET` | Better Auth signing/encryption secret (32+ random bytes) |
| `BETTER_AUTH_URL` | Base URL Better Auth uses (same as `APP_PUBLIC_URL`) |
| `FIELD_ENCRYPTION_KEY` | Current field-encryption key (32 random bytes, base64) |
| `FIELD_ENCRYPTION_KEY_VERSION` | Integer version of the current key |
| `FIELD_ENCRYPTION_KEY_PREVIOUS` | Previous key, only during rotation |
| `EMAIL_TRANSPORT` | `console` or `smtp` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | SMTP credentials from the chosen provider |
| `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` | Sender, for example `nao-responda@<domain>` and `Domiyo` |

## Authentication, Authorization, and Invitations

- **Library:** Better Auth with its Drizzle adapter, email and password only for the MVP. Its tables (users, sessions, accounts, verification) live in our PostgreSQL and are created through our versioned migrations. No external identity provider.
- **Passwords:** configure Better Auth's password hashing to Argon2id (maintained library such as `@node-rs/argon2`); never store recoverable plaintext passwords. Minimum length and the reset flow follow `PRD.md`.
- **Sessions:** database-backed sessions referenced by a cookie that is `HttpOnly`, `Secure` in production, `SameSite=Lax`, and host-only (no parent-domain cookie). Never persist credentials in browser storage. Revoke all sessions after a password reset.
- **CSRF:** keep Next.js's built-in origin check for Server Actions and list only our own domains in `serverActions.allowedOrigins` if it is needed. Keep Better Auth's trusted-origin check on (`APP_PUBLIC_URL`). Any other mutating Route Handler must verify the `Origin` header and require the session.
- **Authorization:** every Server Action, Route Handler, and data-access function calls `requireSession()` and, for household data, `requireHouseholdMember(householdId)` from `src/server/auth`. Middleware/proxy redirects are a convenience, never the authorization check. Resource identifiers from the client never substitute for membership checks. Begin with a simple member permission model unless product needs justify roles.
- **Invitation and reset tokens:** random, single-use, expiring, revocable, and stored only as hashes.
- **Rate limiting:** enable Better Auth's rate limiter with database storage (in-memory storage is lost on restart) for sign-in, sign-up, and password reset, and apply the same limiter to invitation creation and acceptance. Return non-enumerating responses where account discovery would create risk.
- Email invitation delivery requires selecting and reviewing a provider. Shareable invitation links must remain usable without weakening expiry, revocation, and membership controls.

## External Services

- **Railway:** Hosting for the Next.js application and PostgreSQL (approved 2026-09-30); verify cost, region, backup, and recovery capabilities before launch.
- **Cloudflare:** Optional, DNS only if adopted; never cache authenticated pages or responses publicly.
- **Better Auth:** an open-source library running inside our app, not an external service; it sends no data to third parties.
- **Email delivery:** Required for email invitations and password recovery (both in the MVP); provider and data-processing terms are not selected. See "Email delivery".
- **Design handoff:** The product owner will create screens and provide design decisions as documents. Agents may read and write Figma designs through the Figwright MCP (Figwright plugin open in Figma); no other MCP integration, including the official Figma MCP, is approved.
- No analytics, error-monitoring vendor (Sentry deferred on 2026-09-30), payments, or push provider is selected. Any new processor requires approval and a privacy/security review.

## Deployment

- Deployment: one Next.js service (`next build` + `next start` on Node.js) and managed PostgreSQL on Railway, in a region selected for latency and privacy requirements. Run database migrations as an explicit release step, not on every app start.
- Use separate development, test, and production environments with separate credentials and data. Never copy production personal data into local development or tests.
- Configure HTTPS, restricted database network access, least-privilege service credentials, automated backups, and monitored backup/restore outcomes.
- Store runtime configuration in the hosting platform's secret manager. Never commit secrets, expose them to the browser, or include them in build artifacts or logs.
- Define CI checks for tests, lint, typecheck, and build when the repository is scaffolded. Establish a rollback and migration-recovery procedure before production deployments.
- Serve the app from a single origin so session cookies stay host-only. Set security headers (Content-Security-Policy, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`) in the Next.js config.

## Scalability and Operations

- Start with a modular monolith (the single Next.js app) and one PostgreSQL database. Do not introduce microservices, a queue, or a cache before a measured requirement exists.
- Make recurrence generation idempotent. A database-backed scheduled process is sufficient initially; monitor work volume before introducing a queue.
- Index household-scoped date/status queries and review query plans as real usage grows. Keep authenticated responses out of shared CDN caches.
- Add operational health checks and privacy-conscious structured logs without credentials or unnecessary personal data. Any external monitoring service requires approval.
- Define recovery point/recovery time objectives and validate backups before onboarding users beyond the pilot household.
- Reassess hosting, database capacity, background work, and push delivery when measured usage, reliability needs, or cost justify it.

## Open Architecture Decisions

- Exact library versions (pinned at scaffold time) and the PWA service-worker approach (hand-written or a maintained library such as Serwist).
- Email delivery provider.
- Railway account topology, production domains, database region, pricing, backup retention, and restore objectives.
- Exact recurrence materialization strategy (time zones are decided above).
- Secret manager and backup location for the field-encryption key (scope and mechanism are decided above).
- CI provider and deployment/rollback workflow; external error monitoring (deferred, needs approval).
- Data hosting region and LGPD international-transfer review, given Railway's available regions.
- Data handling for a departing member's tasks, bills, and recipes (shared decision with `PRD.md`).
