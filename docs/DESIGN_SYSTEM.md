# Design System

**Status:** Component behavior is defined, and color, typography, spacing, and radius tokens are confirmed (see below) from the palette and screens the product owner supplied and the login/button screens built from them. The dark theme and all status colors (danger, success, warning, info) were approved on 2026-09-30. Figma work by agents goes through the Figwright MCP only; no other MCP server (including the official Figma MCP) is approved. The product owner creates or approves the screens and provides their design decisions as documents; approved supplied documents and this file are the design source of truth.

**Design handoff location:** `docs/design/`. Place exported screen images (PNG or PDF) there, named by screen and viewport (for example, `home-mobile.png`), together with a Markdown note describing tokens, component decisions, and any behavior not visible in the images. Copy approved token values into this file once confirmed.

**Figma as reference:** screens designed in Figma are valid references before they are exported. Agents read them through the Figwright MCP to implement and to validate the built UI against the design; exports in `docs/design/` are added over time (product owner decision, 2026-09-30).

## Brand Direction

Domiyo is a shared household operations tool. Its interface should feel clear, calm, approachable, and dependable, helping household members coordinate without adding noise or judgment. The interface is an everyday utility, not a marketing site. Prioritize a legible daily overview and quick household actions.

Use the actual product domain (home routines, meals, bills, shared responsibilities) to inform future visual choices. Avoid generic SaaS styling and decorative elements that compete with dates, statuses, and next actions. Do not finalize an aesthetic direction until it is reviewed against the design documents and screens supplied by the product owner.

## Logo

**Status:** Approved by the product owner (2026-09-28).

- **Symbol ("Ponto + D"):** an "i" (circular dot plus rounded stem) beside a half-disc that forms the "D" of Domus. It represents the household member and the home. The symbol's dot echoes the dot of the "i" in the wordmark.
- **Wordmark:** "domiyo" in lowercase, Sora SemiBold, letter-spacing about -0.03em. The dot of the "i" is a colored circle. Sora is used for the logo only; interface typography stays Roboto (see Typography).
- **Light version (white or light background):** stem and text `#382344` (`lavender.900`); half-disc and dots `#716EAE` (`lavender.700`).
- **Dark version (`#382344` background):** stem `#B9B8E1` (`lavender.300`); half-disc and dots `#C9FA5A` (`lime.500`); text white. Never use lime on a white background. Every dark-theme screen (mobile and desktop, including the desktop sidebar) uses this dark version (product owner decision, 2026-09-30).
- **App icon:** `#382344` background, dark symbol at 70% of the icon width, corner radius 230/1024 when the platform does not apply its own mask.
- **Clear space and minimum size:** keep clear space around the whole logo at least equal to the height of the symbol's dot. Minimum size: lockup 80px wide; symbol alone 16px.
- **Source of truth:** the "Logo" page in Figma, components "Logo/Lockup" and "Logo/Símbolo A · Ponto + D". Exported files (SVG and PNG) are in `docs/design/logo/`.

## Color Tokens

**Status:** Confirmed by the product owner (2026-09-28), as a primitive palette plus the semantic mapping below. Mirrored in Figma as the `Domiyo Colors` variable collection. Do not invent additional hex values or introduce a second palette; extend this table instead.

### Primitives

| Token | Hex | Source comment |
| --- | --- | --- |
| `lavender.900` | `#382344` | buttons / selection |
| `lavender.950` | `#1F1326` | dark theme: screen background (approved 2026-09-30) |
| `lavender.800` | `#493964` | dark theme: raised controls, auth card (approved 2026-09-30) |
| `lavender.750` | `#332DB4` | text links on light surfaces only (added 2026-09-30; named 750 because `lavender.800` is already the dark-theme raised surface) |
| `lavender.700` | `#716EAE` | cards and graphs |
| `lavender.600` | `#8987C4` | secondary elements |
| `lavender.500` | `#9A99D0` | main background |
| `lavender.300` | `#B9B8E1` | sidebar and soft surfaces |
| `lavender.100` | `#E4E3F2` | borders and light backgrounds |
| `lime.500` | `#C9FA5A` | highlight, events, indicators |
| `lime.300` | `#DDFE91` | soft variation |
| `white` | `#FFFFFF` | primary cards |
| `ink.900` | `#2B2944` | primary text |
| `ink.600` | `#77758D` | secondary text |
| `line` | `#E9E8F2` | dividers |

### Semantic mapping

| Semantic token | Primitive | Notes |
| --- | --- | --- |
| `color.brand.primary` | `lavender.900` | primary buttons, active nav/tab state |
| `color.brand.on-primary` | `white` | text/icons on `color.brand.primary` |
| `color.background` | `lavender.100` (flat) or a `lavender.500`→`lavender.300` gradient | flat for app screens; the gradient is reserved for auth/onboarding, as used on the login screen |
| `color.surface` | `white` | cards, inputs |
| `color.surface.raised` | `white` | same fill as `color.surface`; differentiate with a shadow/effect style, not a color (per "use borders and spacing before elevation" below) |
| `color.text.primary` | `ink.900` | |
| `color.text.secondary` | `ink.600` | **Caveat:** `ink.600` on `white` measures ≈4.46:1, just under the 4.5:1 WCAG AA text minimum. Safe for 18px+/bold text and icons; verify per use at smaller sizes, and flag to the product owner if a darker secondary is wanted. |
| `color.text.inverse` | `white` | text/icons on dark or saturated fills |
| `color.text.disabled` | `ink.600` (on light surfaces) / `lavender.600` (on `color.brand.primary`) | matches the button "Desabilitado" state built in Figma |
| `color.border` | `line` | default dividers, card outlines |
| `color.border.interactive` | `lavender.600` | form fields and other bordered controls, where `line`/`lavender.100` proved too faint against `white` |
| `color.border.disabled` | `lavender.300` | |
| `color.focus` | `lavender.900` | rendered as a solid ring plus a white gap on light surfaces (see the Botão "Foco" state) |
| `color.link` | `lavender.750` (light) / `lime.500` (dark) | Roboto SemiBold, **no underline**. Link color chosen by the product owner on 2026-09-30 (`#332DB4`, 9.7:1 on `white`, 7.6:1 on `lavender.100`); it differs from body text by hue and weight. Alternatives evaluated and rejected: `lavender.900` (weight-only difference) and a dark lime `#4D6D03`. Always use the `Link` component (see Components). |
| `color.link.hover` | `lavender.900` (light) / `lime.300` (dark) | |
| `color.link.danger` | `danger.600` (light) / `danger.300` (dark) | destructive links such as "Excluir item" and "Revogar link" |
| `color.link.danger.hover` | `danger.700` (light) / `danger.100` (dark) | |
| `color.state.danger` | `danger.600` | field errors, file errors, destructive actions |
| `color.state.danger.subtle` | `danger.100` | background of the error icon circle |
| `color.state.success` | `success.600` (light) / `success.300` (dark) | confirmations such as "Cronograma importado" or "Pagamento registrado"; subtle background `success.100` |
| `color.state.warning` | `warning.600` (light) / `warning.300` (dark) | attention without error, such as "Vence em 3 dias"; subtle background `warning.100` |
| `color.state.info` | `info.600` (light) / `info.300` (dark) | neutral progress or notes, such as "Importação em andamento"; subtle background `info.100` |

### Status primitives

Approved by the product owner on 2026-09-30 (danger: option B of the first proposal; success, warning and info chosen from a second proposal). Mirrored in Figma in the variable collection currently named `Proposta · Status`; rename it to `Status` in the Figma UI (the Figwright plugin cannot rename collections).

| Token | Hex | Contrast | Status |
| --- | --- | --- | --- |
| `danger.700` | `#8E2049` | 8.6:1 on `white` | Approved 2026-09-30: darker shade of `danger.600`, used for the destructive link's hover state |
| `danger.600` | `#B02A5B` | 6.3:1 on `white`, 5.0:1 on `lavender.100`, 5.3:1 on `danger.100` | Approved |
| `danger.100` | `#F9E6EE` | background only | Approved |
| `danger.300` | `#F59BBD` | 8.7:1 on `lavender.950`, 6.9:1 on `lavender.900` | Approved 2026-09-30, dark theme only |
| `success.600` | `#236B3A` | 6.5:1 on `white`, 5.1:1 on `lavender.100`, 5.7:1 on `success.100` | Approved 2026-09-30 |
| `success.100` | `#E6F4EA` | background only | Approved 2026-09-30 |
| `success.300` | `#7FD99A` | 10.4:1 on `lavender.950`, 8.2:1 on `lavender.900` | Approved 2026-09-30, dark theme |
| `warning.600` | `#7A5C00` | 6.3:1 on `white`, 4.9:1 on `lavender.100`, 5.7:1 on `warning.100` | Approved 2026-09-30 |
| `warning.100` | `#FFF3D6` | background only | Approved 2026-09-30 |
| `warning.300` | `#FFD66B` | 12.8:1 on `lavender.950`, 10.1:1 on `lavender.900` | Approved 2026-09-30, dark theme |
| `info.600` | `#2B5A8C` | 7.1:1 on `white`, 5.6:1 on `lavender.100`, 6.1:1 on `info.100` | Approved 2026-09-30 |
| `info.100` | `#E4EEF7` | background only | Approved 2026-09-30 |
| `info.300` | `#9BC3E8` | 9.6:1 on `lavender.950`, 7.6:1 on `lavender.900` | Approved 2026-09-30, dark theme |

Status must never be communicated by color alone; pair it with text or an accessible icon/label. Verify WCAG 2.2 AA contrast for text, controls, and focus indicators before shipping.

## Typography

**Status:** Confirmed. Font family: **Roboto** (Regular 400, Medium 500, SemiBold 600 for links only, Bold 700), self-hosted or served via an approved static font pipeline — no paid font service. Mirrored in Figma as text styles.

| Style | Weight | Size / line-height | Usage |
| --- | --- | --- | --- |
| Page Title | Medium | 32 / 40 | Screen-level headline (e.g. the login welcome message) |
| Section Heading | Medium | 24 / 32 | Card/section titles (e.g. "Entrar") |
| Body | Regular | 16 / 24 | Default body copy, field values |
| Body Small | Regular | 14 / 20 | Secondary copy, helper text |
| Label | Medium | 14 / 20 | Field labels, chips, buttons |
| Link | SemiBold | 14 / 20 | Text links, through the `Link` component only; no underline |
| Numeric Emphasis | Medium | 20 / 28 | **Proposed**, not yet used on a shipped screen — for bill amounts, dates, and other scannable numerics once those views exist. Revisit against real content. |

Keep task names, bill due dates, amounts, and meal names easy to scan.

## Spacing

Confirmed token scale (px), extended from the original proposal to match what shipped in the first screens: `4, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 64`. Mirrored in Figma as the `Spacing` variable collection (`space-4` … `space-64`). Prefer these named tokens to arbitrary one-off gaps. Keep related controls grouped while leaving clear separation between dashboard sections.

## Radius and Shadows

Confirmed token scale, mirrored in Figma as the `Radius` variable collection:

| Token | Value | Usage |
| --- | --- | --- |
| `radius.sm` | 8px | small elements |
| `radius.md` | 16px | inputs |
| `radius.lg` | 24px | general large surfaces |
| `radius.xl` | 28px | cards (e.g. the login card) |
| `radius.full` | 999px | pill buttons, chips |

Use borders and spacing before elevation; reserve shadows for overlays, focus rings, or surfaces that need clear layering. Never nest cards.

## Components

- **Navigation:** Persistent, predictable access to the main destinations. MVP: Início, Agenda, and Perfil (bottom bar on mobile, sidebar from `md`; see `docs/design/inicio/README.md`), plus the notification bell in the header. Later V1 features add Tasks, Bills, Meals/Recipes, and Grocery List. On narrow screens, use a mobile-appropriate navigation pattern without hiding the current location. Keep the notification bell discoverable.
- **Buttons:** Distinguish primary, secondary, and destructive actions by hierarchy and semantics. Use icon-only buttons only for familiar actions, with accessible names and tooltips where appropriate.
- **Links:** Every text link uses the single `Link` component, so links always share one color and style. In Figma it is the component set "Link" (page "Componentes"), with variants `Tema` (Claro, Escuro) × `Tom` (Padrão, Perigo) × `Estado` (Padrão, Hover, Foco). Rules for implementation:
  - Roboto SemiBold 14/20, never underlined, in any state.
  - Colors come only from the `color.link*` tokens above: `Padrão` for regular links, `Perigo` for destructive ones.
  - Focus-visible state: a 2px ring (`lavender.700` on light, `lavender.300` on dark) with a 4px radius; in code, use `outline` plus `outline-offset: 2px` so the ring does not touch the text.
  - Use `<a>` for navigation ("Criar conta", "Entrar", "Esqueci minha senha") and `<button>` styled with the same component for in-page actions ("Mostrar", "Copiar", "Excluir item", "Revogar link").
  - Because weight is the non-color cue, do not put a link inside Medium or bold text. Inline links sit after Regular text (for example, "Ainda não tem conta? **Criar conta**").
  - Destructive links still open a confirmation dialog when recovery is difficult (see States).
- **Forms:** Visible labels above fields, clear required/optional status, inline validation, and actionable error messages. Do not use placeholder text as the only label.
- **Task rows:** Show task name, due date, assignee, and completion state. Make completion a clear, accessible action. Keep overdue and incomplete states distinguishable without relying only on color.
- **Bill summaries:** Show amount, due date, and paid/pending status together. The home view highlights the next pending bill once it is fewer than 10 days away.
- **Meal and recipe views:** Label meal type and date; show optional time only when provided. Ingredient selection must clearly affect the shared grocery list.
- **Grocery items:** Make needed and purchased states clear and easy to toggle. Preserve the shared-list context.
- **Calendars:** Let the user switch between weekly and monthly task views and complete tasks directly from the calendar; maintain usable labels and controls on small screens.
- **Notifications:** The bell indicates available notifications accessibly; the view distinguishes unread and read items once that behavior is defined.
- **Overlays and dialogs:** Use for focused, interruptive tasks only. Provide a clear title, close/cancel path, keyboard focus handling, and focus return.

## States

Every data-backed view should define loading, populated, empty, error, and retry behavior. Controls must include hover, focus-visible, active, disabled, and pending states where applicable. Confirm destructive actions when recovery is difficult. Respect reduced-motion preferences; animation must not be required to understand state changes.

## Responsive Rules

- Design mobile-first for the PWA, then expand for tablet and desktop.
- Preserve the same core information and actions across viewport sizes; reflow or simplify presentation instead of silently dropping household information.
- Keep primary task completion and grocery-item actions reachable on mobile.
- Weekly/monthly calendars must remain usable on narrow screens; use a suitable compact/list presentation where a full grid would be unreadable.
- Avoid horizontal scrolling for primary workflows and prevent long names, dates, and currency values from overlapping controls.
- Breakpoints follow the widely used Tailwind CSS defaults (product owner decision, 2026-09-30): `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px. Use only these values; no component-specific breakpoints.
  - Below `md` (phones, under 768px): mobile layout, bottom navigation bar, the mobile screens in Figma (390px wide).
  - From `md` (768px, tablets such as iPad included): desktop layout with the sidebar, the desktop screens in Figma (1440px wide). Between 768px and 1023px the sidebar starts collapsed (icon-only rail) so the content keeps enough width on a portrait tablet; from `lg` (1024px) it starts expanded. The user can still toggle it at any width.
  - Content keeps the readable widths shown in the desktop screens instead of stretching on very wide screens.

## Accessibility

- Target WCAG 2.2 AA.
- Use semantic landmarks, headings, buttons, links, lists, and form controls.
- Support keyboard-only operation with visible focus and logical focus order.
- Associate labels, hints, and validation errors with their controls; announce asynchronous status changes to assistive technology.
- Do not rely on color, hover, or motion alone to convey meaning.
- Use adequate touch targets and readable text at mobile sizes; support browser zoom and reduced motion.
- Test primary household flows with keyboard and automated accessibility checks; supplement automation with manual review.

## Email templates

Transactional emails reuse the product's look with email-safe techniques. Layout and copy: `docs/design/email/README.md` (proposed 2026-09-30):

- Width 600px, centered, `lavender.100` outer background, one `white` card with `radius.xl` corners, 40px padding. The logo (light version, as a hosted PNG with `alt="Domiyo"`) sits above the card.
- Content order: title (Page Title style, `lavender.900`), one or two short paragraphs (Body, `ink.900`), one primary button (`lavender.900` fill, white label, `radius.full`, at least 44px tall), then the fallback link in full ("Se o botão não funcionar, copie este link: …") and an expiry note (Body Small, `ink.600`).
- Footer outside the card (Body Small, `ink.600`): why the person received the email and that it was sent automatically; no marketing, no tracking pixel.
- Build the HTML with tables and inline styles, system fallback fonts after Roboto (`Roboto, Arial, sans-serif`), and always send a plain-text version with the same content. Keep contrast AA; do not rely on images to convey the message.
- MVP emails: email confirmation at sign-up, household invitation, password reset, and password changed. Copy is pt-BR.

## Figma File Organization

Decided by the product owner on 2026-09-30:

- Each screen category has its own Figma page: "Login" (Login e acesso), "Início", "Agenda", "Importar cronograma", "Perfil e household", "Notificações" and "Erros". Components, explorations and design proposals live on the "Componentes" page. One page per category keeps the file light enough for the Figwright plugin (a single page with 130+ frames crashed it).
- Inside each category, rows follow this order: mobile light → mobile dark → desktop light → desktop dark. A dark screen sits under its light counterpart; a row with no screens yet is labelled "ainda não criado".
- A frame contains only what belongs to that screen: no hidden or leftover layers from the screen it was copied from, and no duplicate frames.
- Every new screen gets its dark version too (product owner decision, 2026-09-30), using the dark mapping in `docs/design/inicio/README.md`.

## Design References and Change Control

The product owner has identified [Impeccable](https://impeccable.style) and Anthropic's [frontend-design skill](https://www.skills.sh/anthropics/skills/frontend-design) as design references. Use them as critique and craft guidance, not as a replacement for the product owner's supplied design documents and screens. Record approved token changes here after they are confirmed in those documents.