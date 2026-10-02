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
- Initial locale: Brazilian Portuguese (`pt-BR`) and Brazilian real (`BRL`). Time zones follow "Requirements" › "Functional": `America/Fortaleza` in the MVP, a per-user time zone later.
- The product is not limited to students or couples.

## Core Features (V1)

The MVP's first two features, in priority order, are the shared agenda/calendar and PDF cronograma import described immediately below; the remaining V1 features build on that foundation.

### MVP scope

Decided by the product owner on 2026-09-29. The MVP includes only:

- Access: sign up with email confirmation, log in, and forgot/reset password (see "Household and access").
- Household: first-access screen to create a household, invite members by email and link, accept or decline an invitation, leave a household, and remove a member.
- Shared agenda and PDF cronograma import (see below), including manual creation, editing, and deletion of agenda items. Deleting an agenda item always asks for confirmation first (decided by the product owner on 2026-09-30).
- Profile and the home screen ("Início") limited to the logged-in user's agenda.

The remaining V1 features (household tasks, bills, meals and recipes, the shared grocery list, and task-assignment notifications) are out of the MVP and follow it. The home dashboard sections for tasks, bills, and meals arrive with those features.

### Shared agenda and PDF cronograma import

- A household can have multiple named agendas (for example, "Agenda de Amanda", "Agenda de Andréa"), grouped under one household. An agenda is a filterable collection of calendar items, distinct from household membership.
  - MVP: each household member gets exactly one agenda, created automatically when they join and named after them ("Agenda de {primeiro nome}"). Users cannot create, rename, or delete agendas in the MVP (decided by the product owner on 2026-09-29).
  - Separately named agendas arrive with the external calendar integrations (Google Calendar and Microsoft Outlook; see "Out of Scope"), when an agenda can come from a connected calendar instead of a member.
- The calendar view lets a user select one or more agendas to filter what is shown, through a multiselect with a "Todas as agendas" option that selects every agenda. When every agenda is selected, the field reads "Todas as agendas". At least one agenda must stay selected; the last selected agenda cannot be deselected (decided by the product owner on 2026-09-29).
- The home screen ("Início") shows only the logged-in user's own agenda, with no agenda filter (decided by the product owner on 2026-09-29).
- Each calendar item belongs to exactly one agenda (its owner). Ownership is not shown via item color, because color already encodes discipline/subject on the calendar. Instead, each item shows a small round avatar of the owner: the profile photo, or, when there is no photo, the initials of the first name and surname (for example, "AP", "AC"). The avatar has no per-user color; it uses a neutral style so it never competes with the subject color. It needs an accessible name (the owner's name) and a name tooltip on hover (decided by the product owner on 2026-09-29). Profile photos are classified as sensitive and stored encrypted (see "Privacy and security").
- A household member can import a class schedule ("cronograma") PDF of up to 10 MB into an agenda. The supported PDF format is organized by week and time slot; the file does not include a year.
  - The PDF is read by the Anthropic Claude API, which returns the schedule as structured data; Domiyo validates it before showing the confirmation screen (decided by the product owner on 2026-09-30). The cronograma is a public document published on the school's website; only the file is sent, with no user data.
  - Subject colors come from the legend of the imported PDF: each subject keeps the color the PDF uses for it. They are data stored with the import, not fixed design tokens (decided by the product owner on 2026-09-30).
  - The imported PDF file is kept, and the Agenda screen offers it for viewing and download ("Ver cronograma") whenever an agenda in view has an imported PDF. Re-importing replaces the stored file for that agenda (decided by the product owner on 2026-09-30). The stored PDF is encrypted (see "Privacy and security").
  - Year assignment: parsing starts from the current year for the first week found. Whenever a later week's month is earlier than the previous week's month (a December-to-January crossing), that week and every following week roll over to the next year.
  - Reading takes a few minutes and continues on the server if the user leaves the screen; the user returns later to review the result (decided by the product owner on 2026-10-02). While a read is in progress, opening the import screen in any window or browser shows only its progress (file name and time elapsed since the upload) and no upload form, so a second PDF cannot be sent for the same agenda; when the read ends, the review screen also shows the total reading time (decided by the product owner on 2026-10-02).
  - Classes that share one time slot of a day are shown in the order the PDF prints them, with the slot divided into equal parts (16:00–18:00 with two classes becomes 16:00–17:00 and 17:00–18:00). Classes in cells side by side in the same day column happen at the same time and keep the whole slot (decided by the product owner on 2026-10-02). On mobile, items with exactly the same start and end are shown side by side in one row under a single time label.
  - Methodology labels NAF, AIM (with its number), CBL, TBL, and OSCE, highlighted in yellow in the PDF, are shown as a tag on the item's card, on the same line as the time, and as "Metodologia" in the item detail (decided by the product owner on 2026-10-02).
- Before attaching a parsed PDF to an agenda, show a confirmation screen: "tem certeza que deseja anexar o pdf {titulo} à agenda?" ("are you sure you want to attach the PDF {titulo} to the agenda?"). Nothing is written to the agenda until the user confirms. An unconfirmed import expires after 3 days and must be uploaded again (decided by the product owner on 2026-09-30).
- Re-uploading a new PDF for an agenda diffs it against the previously imported PDF (items added, removed, or moved) and applies the result automatically, without a per-item review step, since the item count makes manual review impractical.
  - Exception: if a previously imported item was manually edited by a user after import, overwriting it on re-import requires explicit user confirmation instead of being applied automatically.
  - Every PDF-imported item tracks an "edited manually" flag/state, set when a user edits that item after import, so a future re-import knows whether the automatic-overwrite exception applies.

### Household and access

- Users authenticate with email and password.
- Sign-up requires email confirmation: the user cannot sign in until they open the confirmation link (decided by the product owner on 2026-09-30).
- Users can reset a forgotten password through a reset link sent by email. The link must expire, be single-use, and the request must not reveal whether an email is registered. Reset requests are rate-limited. Password reset is part of the MVP (decided by the product owner on 2026-09-29). Opening an expired or already-used reset link shows a dedicated screen that explains it and offers to send a new link (decided by the product owner on 2026-09-30).
- A user can create or join a shared household. MVP: each user belongs to at most one household, so a person who already belongs to a household cannot join another: accepting the invitation (by email or link) is blocked (decided by the product owner on 2026-09-30).
  - The invited person sees a screen explaining that they already belong to a household, with the option to decline the invitation ("Recusar convite").
  - The inviter is never told why. If the invited person declines, the inviter's invitation screen shows "Recusado", with no reason; otherwise the invitation stays pending until it expires (decided by the product owner on 2026-09-30). This keeps the inviter from learning whether that person uses Domiyo or belongs to another household. Later versions allow several households per user (for example, rental properties or businesses) with different roles in each (decided by the product owner on 2026-09-30).
- A signed-in user without a household (new account without an invitation, or after leaving a household) sees the first-access screen ("Primeiro acesso"), which creates a household (decided by the product owner on 2026-09-30).
- Household members can invite others by email and by shareable invitation link. Invitation links must expire, be revocable, and be single-use. Opening an expired, used, or revoked invitation link shows a dedicated screen that explains it and tells the person to ask for a new invitation, without revealing household details (decided by the product owner on 2026-09-30). Accepting an invitation while signed out sends the invitee to sign-up with a return path to the invitation; the sign-up screen provides an existing-account sign-in link between its introduction and form. The sign-in logo splash is skipped when that sign-in is opened from an invitation.
- When an invited person has signed up but not yet confirmed their email, the inviter's invitation screen shows them as pending email confirmation ("Pendente de confirmação de e-mail"). They become a member once the email is confirmed (decided by the product owner on 2026-09-30).
- Household data is visible only to authorized members of that household.
- A member can leave a household, and remaining members can remove a member who is no longer part of it. The "Sair do household" action lives in Perfil > Household card, and both leaving and removing ask for confirmation. When a member leaves or is removed, their agenda and all of its items are deleted (decided by the product owner on 2026-09-30); the confirmation dialogs must say so. When the last member leaves, the household and all of its data are deleted permanently and cannot be recovered; that confirmation dialog must say so too (decided by the product owner on 2026-09-30). What happens to that member's assigned tasks, bills, and recipes afterward is still an open product decision. The deletion rule must be reflected in the data retention and deletion policy before implementation.
- Interface copy uses the word "household" (not "casa") for the shared group (decided by the product owner on 2026-09-30).

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
- Tasks can recur (decided by the product owner on 2026-10-01). Supported patterns: daily, weekly on one or more selected weekdays (for example, Thursday and Saturday for taking out the trash, since the fixed days vary by household), and monthly on a fixed day of the month. Editing an occurrence of a recurring task shows a confirmation dialog with two choices: "Somente esta tarefa" (detaches this occurrence from the series and flags it as edited manually, the same pattern already used by the cronograma import's "edited manually" flag) or "Esta e as próximas em aberto da série" (updates this occurrence and every later occurrence that is still open). A completed occurrence is never changed by a series edit, and the "esta e as próximas" option is unavailable when the occurrence being edited is itself already completed — only "somente esta" applies then.
- Provide a dedicated task calendar, separate from the task list, where the user switches between weekly and monthly views and can mark tasks complete.
- Tasks can be completed from the home daily agenda, the task calendar, and task views. Any household member can mark any task complete, not only the assignee, and any household member can edit any task (decided by the product owner on 2026-10-01; chosen over an assignee-only rule because it is simpler to narrow later with per-household roles in v3 than to loosen a stricter rule then). Record which member completed each task, not only the completion timestamp, so the history view below stays accountable without restricting who can act.
- From the Tasks area, provide a history button that opens a member-specific history view in user-selectable weekly and monthly modes, showing that member's tasks on their due dates and whether each was completed. Past incomplete tasks must remain distinguishable from completed tasks.

### Bills

- Members can record a household bill with an amount, due date, paid/pending status, and optional recurrence.
- Members can update the status when a bill is paid.
- Recurring bills use the same recurrence patterns and series-editing rule as tasks (decided by the product owner on 2026-10-01; see "Household tasks"): daily, weekly on selected weekdays, or monthly on a fixed day, with "somente esta" vs. "esta e as próximas em aberto" editing, and a paid occurrence never changed retroactively by a series edit.
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
- Dates and recurrence must behave consistently. Store instants in UTC. MVP: every date and time is shown in `America/Fortaleza`. Later versions: each user picks their own time zone in Perfil (default `America/Fortaleza`) and sees every agenda in it, so a member who is traveling can tell what time it is for the other member before getting in touch; PDF imports are still interpreted in the time zone of the institution that issued the cronograma (decided by the product owner on 2026-09-30).
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
- Encrypt data in transit and at rest. Sensitive-data inventory (decided by the product owner on 2026-09-30; technical design in `ARCHITECTURE.md` › "Sensitive data and field-level encryption"):
  - Encrypted at field level: agenda item content (title, type, location, teacher, class content, notes), the stored cronograma PDF and its file name, and profile photos.
  - Kept readable: agenda item dates and times, subject color, and flags such as "imported" or "edited manually", so the owner can inspect schedules in the database; member names and email addresses (email is needed to sign in).
  - The owner can read decrypted agenda data through a restricted database function that requires the encryption key at call time; the key is never stored in the database.
  - Cronograma PDFs are sent to the Anthropic Claude API to be read. The cronograma is public (published on the school's website) and only the file is sent (no name, email, or file name). Before production, confirm Anthropic's data-retention terms and cost.
  - Keep encryption keys separate from the database and never commit or log secrets.
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

- Full personal schedules/agenda beyond the shared calendar (for example, personal appointments unrelated to the household) and external calendar integrations — Google Calendar and Microsoft Outlook — planned for V2. With these integrations, agendas can have their own names (for example, a connected calendar) separate from the member's automatic agenda; sync direction, conflict handling, OAuth consent, and the privacy review of these new data processors are to be decided then. PDF cronograma import into the shared agenda is in V1 (see "Shared agenda and PDF cronograma import" above); this does not exclude the V1 task calendar and daily household agenda described elsewhere in this document.
- Browser/device push notifications (V2).
- Native iOS/Android clients; V1 is a responsive PWA.
- Bill payment execution, bank integrations, financial advice, or receipt/document storage (the only stored documents are imported cronograma PDFs and profile photos).
- Automatic pantry inventory, recipe recommendations, or automatic ingredient purchasing.
- Multiple households per user and per-household roles (planned for a later version; the MVP allows one household per user).
- Paid integrations or analytics services without explicit approval.

## Open Product Decisions

- Overdue-item behavior for tasks and bills (recurrence options and series editing were decided on 2026-10-01; see "Household tasks").
- Recipe ingredient quantities/units and duplicate consolidation in the grocery list.
- Grocery-list lifecycle across weeks and handling/removal of purchased items.
- Notification read state, retention, and whether any events beyond task assignments notify members.
- Email delivery provider. The integration is planned to be provider-agnostic (`ARCHITECTURE.md` › "Email delivery"); only the provider and its keys are missing. Blocks sending email confirmation, invitations by email, and password-reset emails in the MVP.
- Baseline and target values for success metrics after initial usability testing.
- What happens to a departing member's tasks, bills, and recipes when they leave or are removed from a household (not needed for the MVP: a departing member's agenda is deleted).
- Data hosting region and whether LGPD international-transfer safeguards are needed, given available provider regions (needed before production, not before development).
