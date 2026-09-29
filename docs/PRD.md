# Product Requirements Document

**Product:** Domiyo  
**Status:** Initial product brief; some decisions are intentionally provisional.  
**Audience:** The product owner and implementation team.

## Product Overview

Domiyo is a shared household PWA for coordinating recurring bills, household tasks, weekly meals, recipes, and grocery shopping. It gives household members one practical view of what needs attention today and what is coming up.

The initial validation household has two members. The product must support inviting additional members rather than assuming a permanent two-person limit. The product vision is to reduce the daily effort and friction of running a home by making shared responsibilities visible and easy to update.

## Problem

Household information is fragmented across documents, calendars, and conversations. In the initial household, one member's medical-school schedule is difficult to consult in a PDF, meal decisions lead to daily friction, and bills, chores, and grocery needs are not visible together. The broader personal-schedule/PDF problem (full personal timetables, appointments, external calendar sync) is descoped from V1, but importing the recurring class schedule ("cronograma") PDF into the shared agenda is confirmed as part of the MVP: see "Shared agenda and PDF cronograma import" below.

## Goal

Let a household member quickly understand today's household responsibilities, the next relevant bill, the planned meals, and grocery items that still need to be bought. Make it straightforward for household members to share the work and keep that information current.

## Target Users

- Initial users: two cohabiting adults coordinating a household.
- Supported household model: one or more members per household, with invitations for additional members.
- Initial locale: Brazilian Portuguese (`pt-BR`) and Brazilian real (`BRL`). The household time zone must be configurable or explicitly selected; do not assume every user is in the same Brazilian time zone.
- The product is not limited to students or couples.

## Core Features (V1)

The MVP's first two features, in priority order, are the shared agenda/calendar and PDF cronograma import described immediately below; the remaining V1 features build on that foundation.

### Shared agenda and PDF cronograma import

- A household can have multiple named agendas (for example, "Agenda de Amanda", "Agenda de Andréa"), grouped under one household. An agenda is a filterable collection of calendar items, distinct from household membership.
- The calendar view lets a user select one or more agendas to filter what is shown. When no agenda is selected, all agendas are shown combined.
- Each calendar item belongs to exactly one agenda (its owner). Ownership is not shown via item color, because color already encodes discipline/subject on the calendar. Instead, show a small badge/dot in the item's top-right corner (or an equivalent tag) identifying which user's agenda the item belongs to.
- A household member can import a class schedule ("cronograma") PDF into an agenda. The supported PDF format is organized by week and time slot; the file does not include a year.
  - Year assignment: parsing starts from the current year for the first week found. Whenever a later week's month is earlier than the previous week's month (a December-to-January crossing), that week and every following week roll over to the next year.
- Before attaching a parsed PDF to an agenda, show a confirmation screen: "tem certeza que deseja anexar o pdf {titulo} à agenda?" ("are you sure you want to attach the PDF {titulo} to the agenda?"). Nothing is written to the agenda until the user confirms.
- Re-uploading a new PDF for an agenda diffs it against the previously imported PDF (items added, removed, or moved) and applies the result automatically, without a per-item review step, since the item count makes manual review impractical.
  - Exception: if a previously imported item was manually edited by a user after import, overwriting it on re-import requires explicit user confirmation instead of being applied automatically.
  - Every PDF-imported item tracks an "edited manually" flag/state, set when a user edits that item after import, so a future re-import knows whether the automatic-overwrite exception applies.

### Household and access

- Users authenticate with email and password.
- A user can create or join a shared household.
- Household members can invite others by email and by shareable invitation link. Invitation links must expire, be revocable, and be single-use.
- Household data is visible only to authorized members of that household.
- A member can leave a household, and remaining members can remove a member who is no longer part of it. What happens to that member's assigned tasks, bills, and recipes afterward is an open product decision.

### Home dashboard and daily agenda

- Show the current day's household agenda, including tasks due that day and bills due that day.
- Let an eligible household member mark a task complete from the home view.
- Show the next pending (unpaid) bill when its due date is fewer than 10 days away, including its name, due date, and amount. A bill due today is also present in the daily agenda. Whether the boundary day is included and how overdue bills appear are part of the open overdue-item decision.
- Show the meals planned for today and a useful indication of grocery items still needed for those meals.
- If a section has no data, show a useful empty state and a direct next action.

### Household tasks

- Any household member can create a task and assign it to any household member.
- A task has a description, responsible member, due date, and completion status. Additional fields such as notes are not yet required.
- The assigned member receives an in-app notification when another member creates a task assigned to them. The notification identifies the task and its due date (for example, "Task X was assigned to you for day Y"). No notification is sent when members assign tasks to themselves.
- Tasks can recur. Recurrence options and editing rules for an existing series are an open product decision.
- Provide a dedicated task calendar, separate from the task list, where the user switches between weekly and monthly views and can mark tasks complete.
- Tasks can be completed from the home daily agenda, the task calendar, and task views. Whether only the assignee or any household member can mark a task complete is an open product decision.
- From the Tasks area, provide a history button that opens a member-specific history view in user-selectable weekly and monthly modes, showing that member's tasks on their due dates and whether each was completed. Past incomplete tasks must remain distinguishable from completed tasks.

### Bills

- Members can record a household bill with an amount, due date, paid/pending status, and optional recurrence.
- Members can update the status when a bill is paid.
- Recurring bills must produce trackable due occurrences; recurrence rules and how changes affect future occurrences remain to be decided.
- Bill payment, bank connections, payment processing, and receipt storage are not required in V1.

### Meals, recipes, and ingredients

- Members can assign a meal to a date and a meal type: breakfast, lunch, snack, dinner, or supper.
- A meal may have an optional time and can be copied to other days in the week.
- Members can browse recipes and create new recipes with ingredients.
- Recipes use a shared ingredient catalog; a missing ingredient can be added while creating a recipe.
- A recipe ingredient can be selected as something the household needs to buy. Recipe ingredient quantities and measurement units are an open product decision.

### Shared grocery list

- Each household has one shared grocery list.
- Members can add items from selected recipe ingredients and add standalone items.
- Members can mark items as purchased. Purchased items must be visually distinguishable from items still needed.
- The rules for consolidating duplicate ingredients, carrying items between weeks, and removing purchased items remain to be decided.

### Notifications

- Provide an in-app notifications view accessible from a notification bell in the top navigation.
- V1 notifications include task assignments created by another member.
- Push notifications for browsers/devices are explicitly deferred to V2.
- Notification read/unread behavior and retention are open decisions.

## User Flows

1. **Set up a household:** Sign up, create a household, invite another member by email or link, and have the invitee join.
2. **Plan and complete household work:** Create a task, assign a member and due date, see it in the daily agenda/calendar, and mark it complete. Review completion status in member history.
3. **Track a bill:** Add a bill and due date, optionally make it recurring, see it on the home view once it is fewer than 10 days away and in the daily agenda on its due date, then mark it paid.
4. **Plan meals and shop:** Add or choose recipes, place meals on days and meal types, select ingredients to buy, add standalone grocery items, and mark items purchased.
5. **Review today:** Open the home view and scan tasks, bills due today, planned meals, and relevant grocery gaps without navigating between separate tools.

## Requirements

### Functional

- All household resources and actions must be scoped to the active household and authorized membership.
- Dates and recurrence must behave consistently in the household's configured time zone.
- State changes such as marking a task complete, bill paid, or grocery item purchased must be reflected in shared views.
- Avoid duplicate generated occurrences when recurring tasks or bills are processed more than once.

### UX and accessibility

- Mobile-first, responsive web experience installable as a PWA; desktop layouts remain supported.
- The interface is for frequent household operations: prioritize scanability, clear dates/statuses, and quick completion over decorative content.
- Target WCAG 2.2 AA, including keyboard operation, visible focus, semantic controls, accessible form errors, and sufficient contrast.
- Define loading, empty, error, disabled, and success states for primary workflows.
- English is the documentation language; the initial product interface is Brazilian Portuguese.

### Performance and reliability

- Proposed initial target: primary authenticated views render usable content within 2 seconds at the 95th percentile on a typical broadband connection. Validate this target against an instrumented baseline before treating it as an SLA.
- No production availability SLA has been established.
- Production data requires automated backups and a tested restore procedure before launch.

### Privacy and security

- Design and operate the product with Brazil's LGPD in mind; obtain appropriate legal review before production. This document is not a legal compliance determination.
- Use least-privilege access, secure password hashing, household-level authorization, and protections against cross-household data access.
- Encrypt data in transit and at rest. A sensitive-data inventory (not yet produced; see Open Product Decisions) must identify which fields require field-level encryption; keep encryption keys separate from the database and never commit or log secrets.
- If production hosting stores or processes data outside Brazil, review LGPD's international data-transfer requirements before launch rather than assuming in-region hosting is available.
- Define retention, deletion, export, and incident-response procedures before production launch.

## Success Metrics

These are proposed validation measures for the first household, not established business targets:

- Both initial members can independently complete the setup and invitation flow without developer intervention.
- A member can identify today's tasks, meals, and bills, and complete a task from the home view in under one minute during usability testing.
- The household can plan a week of meals and assemble its grocery list in under 10 minutes during usability testing.
- During a two-week pilot, the household records its active recurring bills and uses the shared task and grocery workflows at least three days per week.
- No cross-household data exposure is found in authorization tests.

Review the targets after the first usability sessions; do not add third-party analytics without approval and a privacy review.

## Out of Scope

- Full personal schedules/agenda beyond the shared calendar (for example, personal appointments unrelated to the household) and external calendar integrations (planned for V2). PDF cronograma import into the shared agenda is in V1 (see "Shared agenda and PDF cronograma import" above); this does not exclude the V1 task calendar and daily household agenda described elsewhere in this document.
- Browser/device push notifications (V2).
- Native iOS/Android clients; V1 is a responsive PWA.
- Bill payment execution, bank integrations, financial advice, or receipt/document storage.
- Automatic pantry inventory, recipe recommendations, or automatic ingredient purchasing.
- Multiple-household membership for one user, unless a concrete need is confirmed.
- Paid integrations or analytics services without explicit approval.

## Open Product Decisions

- Task and bill recurrence options, series editing, and overdue-item behavior.
- Recipe ingredient quantities/units and duplicate consolidation in the grocery list.
- Grocery-list lifecycle across weeks and handling/removal of purchased items.
- Notification read state, retention, and whether any events beyond task assignments notify members.
- Household time-zone selection and invitation email delivery provider.
- Final visual identity, color palette, typefaces, and design tokens; the product owner will provide the screens and decisions as project documents (Figma screens may be authored with agents through the Figwright MCP).
- Baseline and target values for success metrics after initial usability testing.
- What happens to a departing member's tasks, bills, and recipes when they leave or are removed from a household.
- Whether task completion is restricted to the assignee or open to any household member.
- Producing the sensitive-data inventory that determines which fields require field-level encryption (referenced above and in `ARCHITECTURE.md`).
- Data hosting region and whether LGPD international-transfer safeguards are needed, given available provider regions.