# Design System

**Status:** Component behavior is defined, and color, typography, spacing, and radius tokens are confirmed (see below) from the palette and screens the product owner supplied and the login/button screens built from them. Status colors remain an open gap. Figma work by agents goes through the Figwright MCP only; no other MCP server (including the official Figma MCP) is approved. The product owner creates or approves the screens and provides their design decisions as documents; approved supplied documents and this file are the design source of truth.

**Design handoff location:** `docs/design/`. Place exported screen images (PNG or PDF) there, named by screen and viewport (for example, `home-mobile.png`), together with a Markdown note describing tokens, component decisions, and any behavior not visible in the images. Copy approved token values into this file once confirmed.

## Brand Direction

Domiyo is a shared household operations tool. Its interface should feel clear, calm, approachable, and dependable, helping household members coordinate without adding noise or judgment. The interface is an everyday utility, not a marketing site. Prioritize a legible daily overview and quick household actions.

Use the actual product domain (home routines, meals, bills, shared responsibilities) to inform future visual choices. Avoid generic SaaS styling and decorative elements that compete with dates, statuses, and next actions. Do not finalize an aesthetic direction until it is reviewed against the design documents and screens supplied by the product owner.

## Color Tokens

**Status:** Confirmed by the product owner (2026-09-28), as a primitive palette plus the semantic mapping below. Mirrored in Figma as the `Domiyo Colors` variable collection. Do not invent additional hex values or introduce a second palette; extend this table instead.

### Primitives

| Token | Hex | Source comment |
| --- | --- | --- |
| `lavender.900` | `#382344` | buttons / selection |
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
| `color.link` | `lavender.900` | always paired with an underline, never color alone |
| `color.state.success` / `warning` / `danger` / `info` | **not yet defined** | **Open gap:** the supplied palette has no red/yellow/status hues. Needed at minimum for overdue tasks/bills and destructive actions (e.g. removing a household member). Needs the product owner's decision before these ship; do not substitute `lime` or invent a hue. |

Status must never be communicated by color alone; pair it with text or an accessible icon/label. Verify WCAG 2.2 AA contrast for text, controls, and focus indicators before shipping.

## Typography

**Status:** Confirmed. Font family: **Roboto** (Regular 400, Medium 500, Bold 700), self-hosted or served via an approved static font pipeline — no paid font service. Mirrored in Figma as text styles.

| Style | Weight | Size / line-height | Usage |
| --- | --- | --- | --- |
| Page Title | Medium | 32 / 40 | Screen-level headline (e.g. the login welcome message) |
| Section Heading | Medium | 24 / 32 | Card/section titles (e.g. "Entrar") |
| Body | Regular | 16 / 24 | Default body copy, field values |
| Body Small | Regular | 14 / 20 | Secondary copy, helper text |
| Label | Medium | 14 / 20 | Field labels, chips, buttons |
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

- **Navigation:** Persistent, predictable access to Home, Tasks, Bills, Meals/Recipes, and Grocery List. On narrow screens, use a mobile-appropriate navigation pattern without hiding the current location. Keep the notification bell discoverable.
- **Buttons:** Distinguish primary, secondary, and destructive actions by hierarchy and semantics. Use icon-only buttons only for familiar actions, with accessible names and tooltips where appropriate.
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
- Breakpoint values are **TBD pending implementation and review of supplied design documents**; use a small, documented set rather than component-specific guesses.

## Accessibility

- Target WCAG 2.2 AA.
- Use semantic landmarks, headings, buttons, links, lists, and form controls.
- Support keyboard-only operation with visible focus and logical focus order.
- Associate labels, hints, and validation errors with their controls; announce asynchronous status changes to assistive technology.
- Do not rely on color, hover, or motion alone to convey meaning.
- Use adequate touch targets and readable text at mobile sizes; support browser zoom and reduced motion.
- Test primary household flows with keyboard and automated accessibility checks; supplement automation with manual review.

## Design References and Change Control

The product owner has identified [Impeccable](https://impeccable.style) and Anthropic's [frontend-design skill](https://www.skills.sh/anthropics/skills/frontend-design) as design references. Use them as critique and craft guidance, not as a replacement for the product owner's supplied design documents and screens. Record approved token changes here after they are confirmed in those documents.