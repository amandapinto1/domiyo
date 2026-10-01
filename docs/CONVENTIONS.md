# Coding Conventions

**Status:** Approved by the product owner on 2026-09-30. Adapted from the owner's global Next.js rules for Domiyo's stack: full-stack Next.js (App Router) + TypeScript, PostgreSQL with Drizzle, Better Auth, Tailwind + shadcn/ui, Vitest + Playwright. Architecture and security decisions live in `docs/ARCHITECTURE.md`; agent rules live in `AGENTS.md`. If this file conflicts with either, they win. Flag the conflict.

## Project structure

- Use the App Router under `src/app`. The top-level layout is described in `docs/ARCHITECTURE.md` › "Project Structure".
- Keep business logic out of UI components. Shared domain logic lives in `src/server/`, the Drizzle schema and client in `src/db/`, framework-agnostic helpers in `src/lib/`, and client hooks in `src/hooks/`.
- Route URLs are in English (`/agenda`, `/profile`, `/login`; product owner decision, 2026-10-01), like the rest of the code. Only the interface copy is pt-BR.

### Route module layout

Each route that needs them uses these private folders (the leading `_` keeps them out of routing):

```text
src/app/(app)/agenda/
├── page.tsx          Server Component entry point
├── _components/      Components used only by this route
├── _actions/         Server Actions for this route ("use server")
└── _data-access/     Reads for this route (import "server-only")
```

- **`page.tsx`:** always a Server Component. It calls `_data-access` functions, which enforce session and membership, and passes plain data to components.
- **`_components/`:** route-only components. The interactive root is usually a Client Component such as `content.tsx`. Client Components never query the database or import from `src/db` or `src/server`.
- **`_actions/`:** one mutation per file. Each action: `requireSession()`, then Zod validation, then `requireHouseholdMember(householdId)` for household data, then the domain call, then a typed result. Never trust IDs or household scope sent by the client without that check.
- **`_data-access/`:** reads for this route. They start with `import "server-only"`, enforce authorization themselves, and return minimal view models, never raw database rows.
- Create `_actions/` only when the route mutates data, and `_data-access/` only when it reads data. Logic used by several routes moves to `src/server/<domain>/`.

### Component placement

- Put a component in the route's `_components/` when only that route uses it.
- Put it in `src/components/` only when several routes reuse it. When in doubt, keep it local and ask before making it global.
- Design-system components (buttons, fields, sheets, the Link component) live in `src/components/ui/` and follow `docs/DESIGN_SYSTEM.md`.
- Check import paths after moving files.

## Server and Client Components

- Default to Server Components. Add `"use client"` only for state, effects, event handlers, browser APIs, or client-only libraries.
- Prefer URL search params for filter and navigation state (for example, the selected agenda and week), so pages stay server-rendered and linkable.
- Fetch data in Server Components through `_data-access`. Do not add a client data-fetching library (SWR, React Query) unless a measured need appears, and discuss it first.
- Keep Client Components small and presentational. They receive data through props and call Server Actions for mutations.
- Code that uses the database, encryption keys, PDF parsing, or secrets imports `server-only` and runs in the Node.js runtime, never the Edge runtime.

## Server Actions: required shape

```typescript
// src/app/(app)/agenda/_actions/update-agenda-item.ts
"use server";

import { z } from "zod";
import { requireHouseholdMember, requireSession } from "@/server/auth";
import { updateAgendaItem } from "@/server/agenda";

const inputSchema = z.object({
  householdId: z.uuid(),
  itemId: z.uuid(),
  title: z.string().trim().min(1).max(120),
});

export type UpdateAgendaItemResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function updateAgendaItemAction(input: unknown): Promise<UpdateAgendaItemResult> {
  await requireSession();
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os campos destacados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const membership = await requireHouseholdMember(parsed.data.householdId);

  try {
    await updateAgendaItem(membership, parsed.data);
    return { ok: true };
  } catch {
    // Log without personal data; never return internal details.
    console.error("updateAgendaItemAction failed", { itemId: parsed.data.itemId });
    return { ok: false, message: "Não foi possível salvar. Tente de novo." };
  }
}
```

- Treat the input as `unknown` and validate it with Zod 4 on the server, even if the form already validated it. Use the Zod 4 APIs (`z.uuid()`, `z.flattenError()`), not the deprecated `z.string().uuid()` and `error.flatten()`.
- The domain function (`updateAgendaItem`) receives the verified membership and also scopes its queries by `householdId`, as defense in depth. An item that does not belong to that household is treated as not found.
- User-facing messages are pt-BR and actionable. Error details stay in server logs, without personal data.

## Household scope

- Auth helpers live in `src/server/auth` and are described in `docs/ARCHITECTURE.md` › "Authentication, Authorization, and Invitations": `requireSession()`, `requireHouseholdMember(householdId)`, `requireCurrentMembership()`.
- `requireHouseholdMember` reads the user from the session. Never pass a user id into it.
- Pages get the household from `requireCurrentMembership()` and pass `householdId` down; actions receive it back and verify it again. Do not write code that assumes a user has only one household: the MVP limit is a database constraint that later versions remove.
- A non-member gets the same response as a missing resource (`notFound()`, 404, or the generic not-found result), never a "forbidden" message.

## Forms

- Build forms from the design-system field components (shadcn/ui re-themed with our tokens), with React Hook Form and a Zod schema. Reference: `https://ui.shadcn.com/docs/forms/react-hook-form`.
- Share the Zod schema between the form and the Server Action when the shape is the same. The server check is the one that counts.
- Every form has labeled controls, inline errors, and disabled/pending, success, and error states (`docs/DESIGN_SYSTEM.md`).

## UI and styling

- Tailwind CSS, with theme values mapped from the tokens in `docs/DESIGN_SYSTEM.md`: light and dark themes, status colors, link color. Do not hard-code hex values or use the default shadcn palette.
- shadcn/ui and Radix primitives are the base for accessible components. Compose them; do not fork them.
- Icons: Lucide, matching the Figma icon set.
- No inline styles except dynamic values that come from data, such as a subject color from the imported PDF legend.
- Respect `prefers-reduced-motion`. Use dynamic imports for heavy client-only pieces, such as a PDF preview.

## TypeScript and naming

- `strict` mode on. No `any` in new code, and no non-null assertions to silence real nullability.
- Type inputs and outputs of Server Actions, data-access functions, and domain services explicitly.
- Event handlers start with `handle` (`handleSubmit`). Booleans start with a verb (`isLoading`, `hasError`, `canSubmit`). Hooks start with `use`.
- Use complete words. Allowed abbreviations: `err`, `req`, `res`, `props`, `ref`, `id`.
- Functional components only. Keep components small, with a single responsibility. Avoid magic numbers: name them as constants, such as `MAX_PDF_BYTES`.
- Comment only where the code cannot say it: business rules, security reasons, non-obvious choices. Use TSDoc on exported domain functions whose contract is not obvious.

## Database

- Drizzle schema in `src/db/schema/`. Every schema change is a drizzle-kit migration committed under `drizzle/`, reviewed, and covered by tests. Never edit a production schema by hand.
- Public identifiers are UUIDs. Never expose sequential IDs.
- Household-owned tables carry `household_id`, and every query filters by it.
- Encrypted columns and the pgcrypto key flow follow `docs/ARCHITECTURE.md` › "Sensitive data and field-level encryption". Use the helpers in `src/server/crypto`; never write ad hoc crypto.
- Use parameterized queries through Drizzle (the `sql` template tag binds values). Never concatenate SQL strings.

## Testing

- Vitest + React Testing Library for units and integration. Test files live next to the code (`*.test.ts(x)`). Integration tests run against the PostgreSQL test database from Docker Compose, never a shared or production database.
- Playwright for end-to-end flows in `tests/`: sign-in, household invitation, agenda import and view.
- Every behavior change adds or updates tests. Critical areas need the strongest coverage: authorization (a member of household A cannot read or change household B), cronograma output validation, year assignment and diff, encryption round-trips, invitation and reset-token expiry.
- Test data is synthetic. Never use real personal data or production dumps. PDF fixtures must be anonymized copies approved by the product owner. Tests mock the Claude API and never send PDFs to it.

## Security checklist (every change)

1. **Authorization:** each Server Action, Route Handler, and data-access function checks the session and household membership itself. Middleware/proxy redirects do not count as authorization.
2. **Validation:** Zod on the server for every input. Reject unknown fields where it matters.
3. **Identifiers:** UUIDs only. Never trust client-sent `householdId` without a membership check.
4. **Secrets:** read only on the server from environment variables. Never prefix secrets with `NEXT_PUBLIC_`. Never log, return, or commit them. Agents never open `.env`; they use `.env.example` only.
5. **Server-only code:** import `server-only` in `src/db`, `src/server`, and `_data-access`.
6. **Output:** rely on React escaping. No `dangerouslySetInnerHTML`. Never render user-supplied HTML.
7. **CSRF and cookies:** keep the Next.js Server Action origin check and Better Auth's trusted-origin check on. Mutating Route Handlers verify `Origin` and the session. Session cookies are `HttpOnly`, `Secure`, and `SameSite=Lax`.
8. **Rate limiting:** sign-in, sign-up, password reset, and invitation creation/acceptance.
9. **Uploads:** files go through a Route Handler, not a Server Action (`docs/ARCHITECTURE.md` › "Cronograma upload and reading"). Check size limits (PDF 10 MB; photos resized to at most 512×512 and 1 MB) and the real file type by magic bytes, not by extension or `Content-Type`. Send cronograma PDFs only to the Claude API, with a timeout; validate its output with Zod and treat it as untrusted data.
10. **Downloads:** stream the decrypted PDF from an authenticated Route Handler with `Cache-Control: no-store` and a sanitized `Content-Disposition`. Never use public or guessable file URLs.
11. **Errors and logs:** safe pt-BR messages to users. Structured logs without emails, names, agenda content, tokens, or keys.
12. **Headers:** keep the CSP and security headers from `next.config` intact when adding scripts or assets.
13. **Privacy:** a new personal or sensitive field needs classification before it is stored (`AGENTS.md`). No analytics, error-monitoring, or other external processor without approval and a privacy review. Sentry is deferred. The Claude API is the only approved processor for agenda content; send it the PDF only.

## Performance

- Server Components by default, with lazy loading for heavy client components.
- Check Lighthouse and Web Vitals on the main mobile screens (Início, Agenda) before releases.
- Index household-scoped date queries. Review query plans as data grows.

## Code review and pull requests

- Keep changes small and focused. Update the relevant docs in the same change when behavior or architecture changes.
- Before asking for review: tests, typecheck, lint, and build pass, using the exact commands in `AGENTS.md` › "Commands" once they exist.
- Reviews check this file's security checklist and `docs/DESIGN_SYSTEM.md` compliance for UI changes.
