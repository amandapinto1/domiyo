# Architecture

**Status:** V1 architecture. The stack changed to full-stack Next.js on 2026-09-30 (product owner decision). The repository is not scaffolded yet; folder names below are confirmed during setup.

## System Overview

Domiyo is an online-first Progressive Web App built as a single full-stack Next.js application (App Router, TypeScript) backed by PostgreSQL. Decided by the product owner on 2026-09-30, replacing the earlier React client + NestJS API split. Server Components render data on the server, Server Actions handle mutations, and Route Handlers serve the few endpoints that need raw HTTP (cronograma PDF upload and download, authentication, health check). The server is the authority for authentication, household membership, validation, and authorization; the browser must not be trusted to enforce access boundaries.

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
| Local development | Docker Compose runs PostgreSQL (with `pgcrypto`) for development and tests, with separate databases; the Next.js app runs on the host with `pnpm` | Approved 2026-09-30 |
| Cronograma reading | Anthropic Claude API reads the uploaded PDF (native PDF input, no PDF parsing library) and returns structured items; our code validates them and applies year assignment, time zones, and the re-import diff. See "Cronograma upload and reading" | Approved by the product owner 2026-09-30 (paid API and new data processor); confirm terms and cost before production |
| Deployment | Railway: one Next.js service (`next start`, Node.js) plus managed PostgreSQL, served at `https://domiyo.app` | Approved 2026-09-30; domain `domiyo.app` purchased (product owner, 2026-10-01); confirm pricing and data region before launch |
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
  app/                     App Router routes (English URLs, e.g. /agenda, /profile, /login)
    (auth)/                Sign-in, sign-up, password reset, invitation acceptance
    (app)/                 Authenticated area (its layout requires a session)
      agenda/
        page.tsx           Server Component entry point
        _components/       Route-only components
        _actions/          Route-only Server Actions ("use server")
        _data-access/      Route-only reads (server-only)
    api/                   Route Handlers (auth, cronograma PDF upload and download, health)
  components/              Shared UI (design-system components, re-themed shadcn/ui)
  server/                  Domain and application logic shared across routes (server-only)
    auth/                  Better Auth setup, requireSession, requireHouseholdMember, requireCurrentMembership
    crypto/                Field-encryption helpers (pgcrypto calls)
    cronograma/            Claude API extraction, output validation, year assignment, diff/import logic
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
6. Recurring tasks and bills (after the MVP) create due occurrences idempotently so retries cannot create duplicate occurrences. Next.js has no scheduler, so Railway cron runs server-side scripts against the database. In the MVP, an hourly job clears hashes for expired invitation links; the link itself becomes unusable at its exact expiration time.

## Database and Storage

- PostgreSQL is the system of record for accounts, households, memberships, invitations, tasks/occurrences, bills/occurrences, meal plans, recipes, ingredient catalog entries, grocery items, and in-app notifications.
- Use UUIDs or other non-enumerable public identifiers for every resource exposed in URLs, forms, or Server Action arguments. Apply foreign keys, uniqueness constraints, and indexes that reflect household ownership and common date/status queries.
- Model household ownership explicitly and make authorization-compatible query patterns easy to audit. Consider including household scope in relevant uniqueness constraints.
- Membership is a `household_members` table (`user_id`, `household_id`, `role`), so a user can belong to several households with different roles in later versions (for example, rental properties or businesses). MVP: a unique constraint on `user_id` limits each user to one household, and every member has the role `member`; a later migration drops the constraint. Always pass `householdId` explicitly through data access and actions instead of assuming "the" household.
- When the last member leaves a household, the household and all of its data are deleted permanently; it cannot be recovered (product owner decision, 2026-09-30).
- All schema changes must be versioned migrations, reviewed, and covered by tests. Preserve a tested backup and restore path before production launch.
- Encrypt database storage at rest and all network connections in transit. Fields classified as sensitive also use field-level encryption (see below). Encryption keys are managed separately from database contents and source code; define key rotation and recovery procedures before production launch.
- The only stored files are imported cronograma PDFs (one per agenda, replaced on re-import) and profile photos. For the MVP they live encrypted in PostgreSQL (`bytea`) with size limits: PDF up to 10 MB, photo resized to at most 512×512 px and 1 MB before encryption. Revisit object storage only if measured size or cost requires it; any storage service needs approval.
- Define retention, account/household deletion, data export, and invitation expiry policies before production launch. An hourly job clears expired invitation token hashes while retaining invitation status/history. Deleting a member's agenda (when they leave or are removed) also deletes its items and stored PDF.

### Sensitive data and field-level encryption

Decided by the product owner on 2026-09-30. Treat this as the technical plan for review, not a legal compliance determination; have it reviewed by a qualified professional before production.

| Data | Storage |
| --- | --- |
| Agenda item: `id`, `agenda_id`, `starts_at`, `ends_at` (`timestamptz`), subject color, `source` (imported/manual), `edited_manually`, audit timestamps | Plaintext, so the owner can inspect schedules by date in the database |
| Agenda item: title, type, location, teacher, class content, tag (NAF, AIM n, CBL, TBL, OSCE), notes | Encrypted |
| Cronograma PDF bytes and original file name | Encrypted |
| Profile photo bytes | Encrypted |
| Member first name, surname, email | Plaintext (email is needed to look up accounts at sign-in); still personal data, so never log it |
| Password | Argon2id hash, never encrypted-and-recoverable |
| Invitation and password-reset tokens | Stored only as hashes |

Mechanism:

- Use PostgreSQL's `pgcrypto` extension with AES-256 so the same data can be decrypted by the server and by the owner's database function: `pgp_sym_encrypt` / `pgp_sym_decrypt` for text columns, `pgp_sym_encrypt_bytea` / `pgp_sym_decrypt_bytea` for the PDF and photo bytes. The server passes the key as a bound query parameter; the key is read from the `FIELD_ENCRYPTION_KEY` environment variable and is never stored in the database, in migrations, or in source control.
- Each encrypted column stores the ciphertext plus a `key_version` column, so the key can be rotated: add the new key as `FIELD_ENCRYPTION_KEY` with `FIELD_ENCRYPTION_KEY_VERSION` incremented, keep the previous key as `FIELD_ENCRYPTION_KEY_PREVIOUS` until a re-encryption job has rewritten every row, then remove it.
- Owner read access: a function in a separate `admin` schema, for example `admin.agenda_items_readable(p_key text)`, returns agenda items with decrypted columns. `EXECUTE` is granted only to a dedicated database role used by the owner (never to the application role), the function is `SECURITY INVOKER`, and it returns nothing useful without the correct key. Do not create a plain view that decrypts, because a view would need the key stored in the database.
- Because the key travels inside every encrypting or decrypting query, disable statement and parameter logging for both the application role and the owner role (`log_statement = 'none'`, `log_min_duration_statement = -1`, `log_parameter_max_length = 0`, `log_parameter_max_length_on_error = 0`, no `pg_stat_statements` capture of parameters), check that the managed PostgreSQL's own logs follow these settings, and never paste the key into shared scripts, tickets, or chat. Keep a copy of the key in the owner's password manager: losing it makes the encrypted data unrecoverable.
- Encrypted columns cannot be searched or sorted by the database; the MVP only needs date-range queries, which use the plaintext timestamps.
- Implemented 2026-10-01 in `agenda_items` (migration `0003_agenda_items`): each content column is `pgp_sym_encrypt` ciphertext (`bytea`) with one `key_version` per row; editing an item re-encrypts every content column with the current key. Helpers: `src/server/crypto`; domain functions: `src/server/agendas`.
- Key rotation re-encryption runs as a one-off server-side script started by the owner, not a scheduled job.

### Cronograma upload and reading

Server Actions accept at most 1 MB per request by default, and raising `serverActions.bodySizeLimit` would raise it for every action. The PDF (up to 10 MB) therefore goes through a dedicated Route Handler:

1. The browser sends `multipart/form-data` (`agendaId` and `file`) to `POST /api/agendas/cronograma`; the stored PDF is downloaded from `GET /api/agendas/[agendaId]/cronograma` (`attachment`, `private, no-store`, household members only). Keep these routes out of any `proxy`/middleware matcher, because Next.js buffers bodies that pass through the proxy with its own size cap.
2. The handler checks `Origin`, calls `requireSession()`, resolves the membership, and calls `requireHouseholdMember(householdId)`; the agenda must belong to that household.
3. It rejects a `Content-Length` over `MAX_PDF_BYTES` (10 MB) before reading, checks the `%PDF-` magic bytes, rejects a second upload while a read for the same agenda is in progress, and applies a per-user limit of 3 reads per 10 minutes (stored in the existing `rate_limits` table) because each read is a paid API call.
4. It stores a pending import (`pending_agenda_imports`, one per agenda): the encrypted PDF and file name, with no result yet, and answers `202` immediately. The read itself runs after the response with Next's `after()`, so closing the screen does not stop it; when it ends, the validated schedule (encrypted) or a non-sensitive failure code is written to the same row, together with `read_finished_at`, which gives the total reading time. A read with no result after 8 minutes (for example, the server restarted) is shown as interrupted. A pending import expires after 3 days (product owner decision, 2026-09-30): expired imports cannot be confirmed and the hourly `data:cleanup` job deletes them.
5. The import screen shows one of four states from the server: reading (only the progress screen: no upload form, the file name, and the time elapsed since the upload, counting live in the browser from a server-computed start so a wrong device clock does not skew it; it refreshes itself every 5 seconds while open), failed (with a message for the failure code, and the upload form again), ready (the confirmation preview, with the total reading time), or nothing. Confirming calls a small Server Action with the pending import id; it recomputes the diff inside a transaction, and only then are agenda items written and the current PDF replaced (PRD: nothing is written before confirmation).

Profile photos use the same pattern (Route Handler, size and magic-byte checks). Implemented 2026-10-01: the browser crops the photo in "Ajustar foto" and encodes a 512×512 JPEG, so no server-side image library is needed; `PUT /api/profile/photo` checks `Origin`, the session, the 1 MB limit, the JPEG signature and the 512×512 frame header, then stores it in `user_photos` encrypted with `pgp_sym_encrypt_bytea` (helpers in `src/server/crypto`). `GET /api/users/[userId]/photo` decrypts it only for the owner and members of the same household (404 for anyone else) with `Cache-Control: private, no-store`.

Reading with Claude:

- No PDF parsing library is needed: the Messages API accepts the PDF as a base64 `document` block and reads both its text and its visual layout, including the legend colors. A 10 MB PDF is about 13.4 MB in base64, under the API request limit; confirm current request and page limits at scaffold time.
- The schedule is read in ranges of 6 weeks, one request per range, each asking only for those week numbers; results are merged and sorted on the server. A single response for a full semester (about 276 classes) does not fit one output budget. The PDF block is marked for prompt caching, so later ranges read it from the cache. A range with no weeks ends the loop.
- Request structured output (`output_config.format` with a JSON schema) describing weeks, days (day and month, no year), times, subject, type, location, teacher, class content, legend color, methodology tag, and a `sideBySide` flag. Validate the response with Zod: times, `#RRGGBB` colors, required fields. An unreadable legend color falls back to the manual-item lavender and overlong descriptive text is clipped, so one odd cell does not fail the whole import.
- Cost and latency control: the request uses `effort: "low"`, and on `claude-sonnet-5-5` `thinking: {"type": "between_tools"}`, because thinking tokens count toward `max_tokens` and are billed as output. Measured on 2026-10-02 with Sonnet 5.5 and the 24-page cronograma: 5 requests, about 3 minutes, about $0.57 per full import (output tokens are most of it).
- Deterministic rules stay in our code, not in the prompt: year assignment (PRD), conversion from the institution's time zone to UTC, the methodology tag whitelist (`NAF`, `AIM n`, `CBL`, `TBL`, `OSCE`; anything else is dropped, and a tag read as the class type is shown once), the splitting of stacked classes, and the re-import diff.
- Splitting of shared slots (product owner, 2026-10-02): classes stacked inside one cell share its time slot in equal consecutive parts, in printed order (16:00–18:00 with two classes becomes 16:00–17:00 and 17:00–18:00). Cells side by side in one day column (`sideBySide: true`) happen at the same time and keep the full slot.
- Known weak points of the model reading: a week's header can sit at the end of one page and its grid on the next, and narrow side-by-side cells can be assigned to the neighboring day. The prompt states both rules, but the result still has to be checked after an import.
- Treat the PDF and the model output as untrusted data: the model gets no tools that act, its output is only used after validation, and instructions inside the PDF are ignored.
- Send only the PDF bytes: no user name, email, or original file name. Each request has a 300 second timeout. Never log the PDF, the prompt, or the model output; the logs carry only a reason code, HTTP status, request id, week range and token counts (`cronograma.upload.failed`, `cronograma.read.done`). The model is pinned in `CRONOGRAMA_AI_MODEL`.
- Tests mock the Claude API; CI and local tests never send real PDFs.

### Time zones

- Store every instant as `timestamptz` (UTC). MVP: the server and client format dates in `America/Fortaleza`, from a single configuration value (`APP_DEFAULT_TIME_ZONE`), not hard-coded across the code.
- Later versions add `users.time_zone` (IANA name, default `America/Fortaleza`), chosen in Perfil; each user sees every agenda in their own time zone. Design the date-formatting layer so this is a data change, not a rewrite.
- PDF import converts the cronograma's local times using the issuing institution's time zone (`America/Fortaleza` for the MVP), independent of the viewer.

### Email delivery

The provider is not chosen yet. The integration is built so the owner only has to fill in keys:

- The server depends on an `EmailSender` interface (`send({ to, subject, html, text })`), with two adapters: `console` (development and tests: logs a redacted summary, never the full body with links in production) and `smtp` (works with most providers, such as Brevo, Resend, Amazon SES or Mailgun, through their SMTP credentials). A provider-specific HTTP adapter can be added later behind the same interface.
- Emails in the MVP (pt-BR, each with HTML and plain-text versions): email confirmation at sign-up, household invitation, password reset, and "sua senha foi alterada" (security notice after a reset). Layout and copy: `docs/design/email/README.md` and the Figma page "E-mails"; rules in `docs/DESIGN_SYSTEM.md` › "Email templates".
- Links in emails use `APP_PUBLIC_URL`; tokens expire and are single-use (see "Authentication, Authorization, and Invitations"). No tracking pixels or click tracking.
- Before production: confirm the provider's data-processing terms and region (LGPD), configure SPF, DKIM, and DMARC for the sending domain, and get approval for any cost.

### Configuration

Runtime configuration comes from server-only environment variables (never prefixed `NEXT_PUBLIC_`) in the hosting platform's secret manager. The repository root has a sanitized `.env.example` with these names and no values (`.env` files are git-ignored):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (application role) |
| `APP_PUBLIC_URL` | Public URL of the app, used in email links and as the trusted origin (production: `https://domiyo.app`) |
| `APP_DEFAULT_TIME_ZONE` | `America/Fortaleza` for the MVP |
| `BETTER_AUTH_SECRET` | Better Auth signing/encryption secret (32+ random bytes) |
| `BETTER_AUTH_URL` | Base URL Better Auth uses (same as `APP_PUBLIC_URL`) |
| `FIELD_ENCRYPTION_KEY` | Current field-encryption key (32 random bytes, base64) |
| `FIELD_ENCRYPTION_KEY_VERSION` | Integer version of the current key |
| `FIELD_ENCRYPTION_KEY_PREVIOUS` | Previous key, only during rotation |
| `EMAIL_TRANSPORT` | `console` or `smtp` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | SMTP credentials from the chosen provider |
| `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` | Sender, for example `nao-responda@domiyo.app` and `Domiyo` |
| `ANTHROPIC_API_KEY` | Claude API key for cronograma reading |
| `CRONOGRAMA_AI_MODEL` | Pinned Claude model id used for cronograma reading |

## Authentication, Authorization, and Invitations

- **Library:** Better Auth with its Drizzle adapter, email and password only for the MVP. Its tables (users, sessions, accounts, verification) live in our PostgreSQL and are created through our versioned migrations. No external identity provider.
- **Email confirmation:** required at sign-up (product owner decision, 2026-09-30). A user cannot sign in until the email is confirmed. Sign-up returns the same response whether or not the email is already registered, so it does not reveal accounts.
- **Passwords:** configure Better Auth's password hashing to Argon2id (maintained library such as `@node-rs/argon2`); never store recoverable plaintext passwords. Minimum length and the reset flow follow `PRD.md`.
- **Sessions:** database-backed sessions referenced by a cookie that is `HttpOnly`, `Secure` in production, `SameSite=Lax`, and host-only (no parent-domain cookie). Never persist credentials in browser storage. Revoke all sessions after a password reset.
- **CSRF:** keep Next.js's built-in origin check for Server Actions and list only our own domains in `serverActions.allowedOrigins` if it is needed. Keep Better Auth's trusted-origin check on (`APP_PUBLIC_URL`). Any other mutating Route Handler must verify the `Origin` header and require the session.
- **Authorization:** every Server Action, Route Handler, and data-access function calls `requireSession()` and, for household data, `requireHouseholdMember(householdId)` from `src/server/auth`. Middleware/proxy redirects are a convenience, never the authorization check. Resource identifiers from the client never substitute for membership checks. Begin with a simple member permission model unless product needs justify roles.
  - `requireSession()` returns the session or redirects to sign-in.
  - `requireHouseholdMember(householdId)` reads the session itself (never a user id from the caller) and returns `{ userId, householdId, role }`. If the user is not a member, it responds exactly as if the resource did not exist: pages and data access call `notFound()`, Route Handlers return 404, Server Actions return the generic not-found result. This never reveals whether another household's resource exists.
  - `requireCurrentMembership()` resolves the household the user is working in. MVP: the user's only membership; without one, it redirects to the first-access screen (create a household). Later versions: the household the user selected.
  - Wrap these helpers in React `cache()` so repeated calls in one request hit the database once.
- **Invitation and reset tokens:** random, single-use, expiring, revocable, and stored only as hashes. Shareable invitation codes use 6 cryptographically random bytes (8 URL-safe characters); the hourly Railway cron clears their hashes after expiration without deleting invitation history.
- **One household per user (MVP):** accepting an invitation checks, inside the same transaction that creates the membership, that the user has no household; the unique constraint on `household_members.user_id` is the final guard. This covers both email and link invitations. A blocked acceptance changes nothing the inviter can see; the invited person may decline, which marks the invitation `declined` (shown to the inviter as "Recusado", with no reason). The inviter never learns whether the invited person has an account or another household.
- **Rate limiting:** enable Better Auth's rate limiter with database storage (in-memory storage is lost on restart) for sign-in, sign-up, and password reset, and apply the same limiter to invitation creation and acceptance. Return non-enumerating responses where account discovery would create risk.
- Email invitation delivery requires selecting and reviewing a provider. Shareable invitation links must remain usable without weakening expiry, revocation, and membership controls.
- **Perfil (implemented 2026-10-01):** invitations last 7 days (temporary until the PRD decides) and are capped at 10 per inviter per hour. Because only the token hash is stored, a shareable link is shown once, when the member taps "Gerar link de convite"; afterwards it appears in "Convites enviados" as "Link de convite" and can only be cancelled. A new email invitation revokes the pending one for the same address. "Pendente de confirmação de e-mail" is shown only for an unverified account created after the invitation, so older accounts are never revealed. The household creator gets the role `admin`, shown as a label only; every member has the same permissions. Leaving and removing lock the household row, so the last member's departure always deletes the household.

## External Services

- **Railway:** Hosting for the Next.js application and PostgreSQL (approved 2026-09-30); verify cost, region, backup, and recovery capabilities before launch.
- **Cloudflare:** Optional, DNS only if adopted; never cache authenticated pages or responses publicly.
- **Better Auth:** an open-source library running inside our app, not an external service; it sends no data to third parties.
- **Anthropic (Claude API):** reads cronograma PDFs (approved 2026-09-30). It is a paid API and an external data processor. The cronograma is a public institutional document published on the school's website and we send only the file, with no user name, email, or file name, so no personal data about our users reaches Anthropic. Before production: confirm Anthropic's data-retention and training terms for API data and the expected cost.
- **Email delivery:** Required for email confirmation, email invitations, and password recovery (all in the MVP); provider and data-processing terms are not selected. See "Email delivery".
- **Design handoff:** The product owner will create screens and provide design decisions as documents. Agents may read and write Figma designs through the Figwright MCP (Figwright plugin open in Figma); no other MCP integration, including the official Figma MCP, is approved.
- No analytics, error-monitoring vendor (Sentry deferred on 2026-09-30), payments, or push provider is selected. Any new processor requires approval and a privacy/security review.

## Deployment

- Deployment: one Next.js service (`next build` + `next start` on Node.js) and managed PostgreSQL on Railway, in a region selected for latency and privacy requirements. Run database migrations as an explicit release step, not on every app start: Railway's pre-deploy command runs `pnpm db:migrate:deploy` (`scripts/migrate.ts`, using `drizzle-orm`'s migrator) once per deploy, and a failed migration stops the deploy. Railway settings live in `.railway/railway.ts` (Railway Infrastructure as Code; apply with `railway config plan` / `railway config apply`).
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
- Railway account topology, database region, pricing, backup retention, and restore objectives. The production domain is `domiyo.app` (purchased 2026-10-01); whether `www.domiyo.app` redirects to it is still open. `.app` is on the HSTS preload list, so it only works over HTTPS.
- Exact recurrence materialization strategy after the MVP (Railway cron; time zones are decided above).
- Claude model for cronograma reading (`claude-sonnet-5-5` in development; the prompt and output schema are implemented as described above); Anthropic retention terms and cost.
- Secret manager and backup location for the field-encryption key (scope and mechanism are decided above).
- CI provider and deployment/rollback workflow; external error monitoring (deferred, needs approval).
- Data hosting region and LGPD international-transfer review, given Railway's available regions.
- Data handling for a departing member's tasks, bills, and recipes (shared decision with `PRD.md`).
