# Architecture

**Status:** Initial architecture proposal for V1. The repository is not scaffolded yet; folder names and deployment details below are recommendations to confirm during setup.

## System Overview

Domiyo is an online-first Progressive Web App with a React client, a NestJS API, and PostgreSQL. The client communicates with the API over HTTPS. The API is the authority for authentication, household membership, validation, and authorization; the client must not be trusted to enforce access boundaries.

```text
Browser / installed PWA
        | HTTPS (JSON API)
        v
NestJS application API
        | TLS database connection
        v
Managed PostgreSQL
```

The PWA may cache its static application shell for installation and faster repeat loads. V1 does not promise offline mutations or background synchronization. Push notifications are deferred to V2.

## Tech Stack

| Concern | V1 direction | Status |
| --- | --- | --- |
| Web client | React + TypeScript; installable responsive PWA | Approved direction |
| API | Node.js + NestJS + TypeScript | Approved direction |
| Database | PostgreSQL, relational model | Approved direction |
| Package management | `pnpm` workspace | Proposed; confirm at scaffold time |
| Authentication | Email and password | Product decision confirmed; implementation/session strategy pending |
| Deployment | Cloudflare Pages for the static PWA; Railway for API and managed PostgreSQL | Recommended starting topology; confirm domains, pricing, and data region before launch |
| Email delivery | Provider-agnostic adapter (SMTP first, console in development); see "Email delivery" | Planned; provider not selected, no paid provider without approval |
| File storage | Cronograma PDFs and profile photos stored encrypted in PostgreSQL (`bytea`) for the MVP; see "Sensitive data and field-level encryption" | Planned; avoids adding a storage service |
| Design source | Product-owner-created screens and design decisions supplied as documents in `docs/design/` | Planned handoff; agents may use the Figwright MCP for Figma, no other MCP integration |

Exact framework versions, ORM/query layer, validation library, component system, and session implementation are not chosen yet. Select maintained options during scaffold, document them, and obtain approval before choices that materially affect security, recurring cost, or architecture.

### Hosting Recommendation

For an initial household product, a managed Railway API and PostgreSQL plus Cloudflare Pages for static web delivery is the recommended cost/effort balance. It avoids early VPS maintenance for database backups, OS patching, and service supervision while keeping the web client on a static edge host. Confirm current plan limits, pricing, backup/restore options, and database region before production use; do not treat provider pricing or availability as guaranteed by this document.

At the time of writing, Railway was not known to offer a Brazil region; verify its current region list before deciding. Cloudflare's edge is global by design. Since the household's data subjects are in Brazil, confirm whether storing/processing data outside Brazil requires LGPD international-transfer safeguards before choosing a production region; this is a legal/product decision, not solely a technical one.

A VPS may reduce direct monthly spend at scale or for an operator comfortable owning patching, monitoring, backups, recovery, and deployment. Cloudflare is useful for DNS/CDN/static delivery and edge controls but does not, by itself, provide the PostgreSQL database selected for this product. Revisit this choice using measured usage and operational capacity rather than hypothetical scale.

## Project Structure

Proposed `pnpm` monorepo layout; establish only when scaffolding and adjust to the actual implementation:

```text
AGENTS.md              Agent working rules (repository root)
docs/
  PRD.md               Product requirements
  DESIGN_SYSTEM.md     Design rules and tokens
  ARCHITECTURE.md      This document
  design/              Product-owner screen exports and design notes
apps/
  web/                 React PWA and browser-side application
  api/                 NestJS HTTP API and domain/application services
packages/
  contracts/           Shared API contracts/schemas only where useful
  config/              Shared TypeScript/lint configuration, if justified
```

Keep API persistence models separate from client-facing contracts. Do not create shared packages merely to share implementation details. The API should organize its modules around household membership, tasks, bills, meals/recipes/ingredients, grocery items, and notifications, with authorization enforced at the server boundary.

## Data Flow

1. A user signs in using email and password; the API verifies credentials using a password-hashing algorithm and establishes the selected secure session mechanism.
2. The client sends authenticated requests over HTTPS. The API validates input, derives the user's authorized household membership, applies domain rules, and reads or writes PostgreSQL data.
3. Every household-owned read and write is scoped and authorized server-side. Resource identifiers supplied by the client never substitute for membership checks.
4. Changes to shared tasks, bills, meals, recipes, ingredients, grocery items, and notifications are persisted transactionally where related state must remain consistent.
5. Task assignment by another member creates an in-app notification. V1 does not send push notifications.
6. Recurring tasks and bills create due occurrences idempotently so retries cannot create duplicate occurrences. The job/scheduler mechanism is an implementation decision; prefer a database-backed approach initially unless measured needs justify a queue.

## Database and Storage

- PostgreSQL is the system of record for accounts, households, memberships, invitations, tasks/occurrences, bills/occurrences, meal plans, recipes, ingredient catalog entries, grocery items, and in-app notifications.
- Use UUIDs or other non-enumerable public identifiers for API resources. Apply foreign keys, uniqueness constraints, and indexes that reflect household ownership and common date/status queries.
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

- Use PostgreSQL's `pgcrypto` extension (`pgp_sym_encrypt` / `pgp_sym_decrypt`, AES-256) so the same data can be decrypted by the API and by the owner's database function. The API passes the key as a bound query parameter; the key is read from the `FIELD_ENCRYPTION_KEY` environment variable and is never stored in the database, in migrations, or in source control.
- Each encrypted column stores the ciphertext plus a `key_version` column, so the key can be rotated: add the new key as `FIELD_ENCRYPTION_KEY` with `FIELD_ENCRYPTION_KEY_VERSION` incremented, keep the previous key as `FIELD_ENCRYPTION_KEY_PREVIOUS` until a re-encryption job has rewritten every row, then remove it.
- Owner read access: a function in a separate `admin` schema, for example `admin.agenda_items_readable(p_key text)`, returns agenda items with decrypted columns. `EXECUTE` is granted only to a dedicated database role used by the owner (never to the API role), the function is `SECURITY INVOKER`, and it returns nothing useful without the correct key. Do not create a plain view that decrypts, because a view would need the key stored in the database.
- Because the key travels inside the query, disable statement logging for the owner role (`log_statement = 'none'`, no `pg_stat_statements` capture of parameters) and never paste the key into shared scripts, tickets, or chat. Keep a copy of the key in the owner's password manager: losing it makes the encrypted data unrecoverable.
- Encrypted columns cannot be searched or sorted by the database; the MVP only needs date-range queries, which use the plaintext timestamps.

### Time zones

- Store every instant as `timestamptz` (UTC). MVP: the API and client format dates in `America/Fortaleza`, from a single configuration value (`APP_DEFAULT_TIME_ZONE`), not hard-coded across the code.
- Later versions add `users.time_zone` (IANA name, default `America/Fortaleza`), chosen in Perfil; each user sees every agenda in their own time zone. Design the date-formatting layer so this is a data change, not a rewrite.
- PDF import converts the cronograma's local times using the issuing institution's time zone (`America/Fortaleza` for the MVP), independent of the viewer.

### Email delivery

The provider is not chosen yet. The integration is built so the owner only has to fill in keys:

- The API depends on an `EmailSender` interface (`send({ to, subject, html, text })`), with two adapters: `console` (development and tests: logs a redacted summary, never the full body with links in production) and `smtp` (works with most providers, such as Brevo, Resend, Amazon SES or Mailgun, through their SMTP credentials). A provider-specific HTTP adapter can be added later behind the same interface.
- Emails in the MVP (pt-BR, each with HTML and plain-text versions): household invitation, password reset, and "sua senha foi alterada" (security notice after a reset). Layout and copy: `docs/design/email/README.md`; rules in `docs/DESIGN_SYSTEM.md` › "Email templates".
- Links in emails use `APP_PUBLIC_URL`; tokens expire and are single-use (see "Authentication, Authorization, and Invitations"). No tracking pixels or click tracking.
- Before production: confirm the provider's data-processing terms and region (LGPD), configure SPF, DKIM, and DMARC for the sending domain, and get approval for any cost.

### Configuration

Runtime configuration comes from environment variables in the hosting platform's secret manager. The repository root has a sanitized `.env.example` with these names and no values (`.env` files are git-ignored):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (API role) |
| `APP_PUBLIC_URL` | Public URL of the PWA, used in email links |
| `APP_DEFAULT_TIME_ZONE` | `America/Fortaleza` for the MVP |
| `SESSION_SECRET` | Signing secret for session cookies |
| `FIELD_ENCRYPTION_KEY` | Current field-encryption key (32 random bytes, base64) |
| `FIELD_ENCRYPTION_KEY_VERSION` | Integer version of the current key |
| `FIELD_ENCRYPTION_KEY_PREVIOUS` | Previous key, only during rotation |
| `EMAIL_TRANSPORT` | `console` or `smtp` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | SMTP credentials from the chosen provider |
| `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` | Sender, for example `nao-responda@<domain>` and `Domiyo` |

## Authentication, Authorization, and Invitations

- Hash passwords with a maintained password-hashing algorithm such as Argon2id; never store recoverable plaintext passwords.
- Select a secure session mechanism before implementation. Prefer secure, HTTP-only cookies with an appropriate SameSite policy; evaluate CSRF protection and same-site/domain topology together. Never persist long-lived credentials in browser local storage.
- Enforce household membership and role/permission rules on every API operation. Begin with a simple member permission model unless product needs justify roles.
- Invitation tokens must be random, single-use, expiring, revocable, and stored in a form that does not expose reusable plaintext tokens if the database is read.
- Rate-limit sign-in, password recovery, and invitation endpoints; return non-enumerating responses where account discovery would create risk.
- Email invitation delivery requires selecting and reviewing a provider. Shareable invitation links must remain usable without weakening expiry, revocation, and membership controls.

## External Services

- **Railway:** Proposed hosting for API and PostgreSQL; verify cost, region, backup, and recovery capabilities before launch.
- **Cloudflare:** Proposed static PWA hosting and DNS/CDN; do not cache authenticated API responses publicly.
- **Email delivery:** Required for email invitations and password recovery (both in the MVP); provider and data-processing terms are not selected. See "Email delivery".
- **Design handoff:** The product owner will create screens and provide design decisions as documents. Agents may read and write Figma designs through the Figwright MCP (Figwright plugin open in Figma); no other MCP integration, including the official Figma MCP, is approved.
- No analytics, error-monitoring vendor, payments, or push provider is selected. Any new processor requires approval and a privacy/security review.

## Deployment

- Initial proposed deployment: PWA static assets on Cloudflare Pages; NestJS API and managed PostgreSQL on Railway, in a region selected for latency and privacy requirements.
- Use separate development, test, and production environments with separate credentials and data. Never copy production personal data into local development or tests.
- Configure HTTPS, restricted database network access, least-privilege service credentials, automated backups, and monitored backup/restore outcomes.
- Store runtime configuration in the hosting platform's secret manager. Never commit secrets, expose them to the browser, or include them in build artifacts or logs.
- Define CI checks for tests, lint, typecheck, and build when the repository is scaffolded. Establish a rollback and migration-recovery procedure before production deployments.
- Deployment domains and same-site cookie behavior must be verified together before choosing the session configuration.

## Scalability and Operations

- Start with a modular monolithic API and one PostgreSQL database. Do not introduce microservices, a queue, or a cache before a measured requirement exists.
- Make recurrence generation idempotent. A database-backed scheduled process is sufficient initially; monitor work volume before introducing a queue.
- Index household-scoped date/status queries and review query plans as real usage grows. Keep authenticated responses out of shared CDN caches.
- Add operational health checks and privacy-conscious structured logs without credentials or unnecessary personal data. Any external monitoring service requires approval.
- Define recovery point/recovery time objectives and validate backups before onboarding users beyond the pilot household.
- Reassess hosting, database capacity, background work, and push delivery when measured usage, reliability needs, or cost justify it.

## Open Architecture Decisions

- Exact monorepo/tooling setup, ORM, database migration library, and API contract format.
- Session/cookie strategy (password recovery is in the MVP; its rules are in `PRD.md`) and email delivery provider.
- Railway/Cloudflare account topology, production domains, database region, pricing, backup retention, and restore objectives.
- Exact recurrence materialization strategy (time zones are decided above).
- Secret manager and backup location for the field-encryption key (scope and mechanism are decided above).
- CI provider, production observability, and deployment/rollback workflow.
- Data hosting region and LGPD international-transfer review, given Railway's available regions.
- Data handling for a departing member's tasks, bills, and recipes (shared decision with `PRD.md`).