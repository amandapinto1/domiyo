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
| Email delivery | Needed for email invitations; provider not selected | Open decision; no paid provider without approval |
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
- Encrypt database storage at rest and all network connections in transit. A sensitive-data inventory does not exist yet; producing it is an open decision shared with `PRD.md`. Once produced, fields it classifies as sensitive must also use field-level encryption in the database. Encryption keys must be managed separately from database contents and source code; define key rotation and recovery procedures before production launch.
- No file/blob storage is required by V1. Do not add receipt or document storage without a product decision and threat/privacy review.
- Define retention, account/household deletion, data export, and invitation expiry policies before production launch.

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
- **Email delivery:** Required for email invitations and likely password recovery; provider and data-processing terms are not selected.
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
- Session/cookie strategy, password recovery flow, and email delivery provider.
- Railway/Cloudflare account topology, production domains, database region, pricing, backup retention, and restore objectives.
- Household time-zone representation and exact recurrence materialization strategy.
- Field-level encryption scope, key manager, rotation, and recovery procedure.
- CI provider, production observability, and deployment/rollback workflow.
- Data hosting region and LGPD international-transfer review, given Railway's available regions.
- Data handling for a departing member's tasks, bills, and recipes (shared decision with `PRD.md`).