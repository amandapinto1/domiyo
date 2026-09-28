# Design System

**Status:** Principles and component behavior are defined; final visual tokens are pending design documents and screen references from the product owner. Figma work by agents goes through the Figwright MCP only; no other MCP server (including the official Figma MCP) is approved. The product owner creates or approves the screens and provides their design decisions as documents; approved supplied documents and this file are the design source of truth.

**Design handoff location:** `docs/design/`. Place exported screen images (PNG or PDF) there, named by screen and viewport (for example, `home-mobile.png`), together with a Markdown note describing tokens, component decisions, and any behavior not visible in the images. Copy approved token values into this file once confirmed.

## Brand Direction

Domiyo is a shared household operations tool. Its interface should feel clear, calm, approachable, and dependable, helping household members coordinate without adding noise or judgment. The interface is an everyday utility, not a marketing site. Prioritize a legible daily overview and quick household actions.

Use the actual product domain (home routines, meals, bills, shared responsibilities) to inform future visual choices. Avoid generic SaaS styling and decorative elements that compete with dates, statuses, and next actions. Do not finalize an aesthetic direction until it is reviewed against the design documents and screens supplied by the product owner.

## Color Tokens

Color values are intentionally **TBD pending the product owner's design documents**. Do not invent hex values or introduce a second palette. When the approved design decisions are provided, define semantic tokens for:

- `color.brand.primary` and `color.brand.on-primary`;
- `color.background`, `color.surface`, and `color.surface.raised`;
- `color.text.primary`, `color.text.secondary`, and `color.text.inverse`;
- `color.border`, `color.focus`, and `color.link`;
- `color.state.success`, `color.state.warning`, `color.state.danger`, and `color.state.info`, each with foreground/background pairings;
- `color.text.disabled` and `color.border.disabled` for inactive controls.

Status must never be communicated by color alone; pair it with text or an accessible icon/label. Verify WCAG 2.2 AA contrast for text, controls, and focus indicators before shipping.

## Typography

Font families and final type scale are **TBD pending the product owner's design documents**. Use semantic text styles rather than one-off sizes: page title, section heading, body, secondary/body-small, label, and numeric/date emphasis. Keep task names, bill due dates, amounts, and meal names easy to scan. Use self-hosted or approved font delivery; do not add a paid font service without approval.

## Spacing

Use a consistent spacing token scale. Proposed implementation baseline, subject to review against the product owner's design documents: `4, 8, 12, 16, 24, 32, 48` CSS pixels. Prefer these named tokens to arbitrary one-off gaps. Keep related controls grouped while leaving clear separation between dashboard sections.

## Radius and Shadows

Final radius tokens are **TBD pending the product owner's design documents**. Proposed baseline: compact controls use a modest radius, and contained surfaces use no more than an 8px radius unless the approved design documents establish a different consistent rule. Use borders and spacing before elevation; reserve shadows for overlays or surfaces that need clear layering. Never nest cards.

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