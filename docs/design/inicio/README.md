# Início (Home) — mobile

**Status:** First draft for product owner review (2026-09-28). Figma page "Início", frame "Início / Mobile" (390×844), component set "Barra de navegação".

![Início mobile](inicio-mobile.png)

## Scope (MVP)

The MVP home shows only the logged-in user's name and today's agenda items. Upcoming bills, tasks, meals, and grocery gaps will be added to this screen later (see `docs/PRD.md`).

## Structure

1. **Header:** "Olá, {primeiro nome}" (Page Title, `lavender.900`) + full date in pt-BR (Body Small, `ink.600`) + notifications bell button (48px, `white`, `radius.full`).
2. **"Agenda de hoje" card** (`white`, `radius.xl`, padding 20, gap 20):
   - Title (Section Heading) + summary "{n} compromissos · {n} agendas" (Body Small) + a 40px round button that opens the Agenda screen.
   - Agenda filter chips, one per household agenda (Label, `lavender.600` 1.5px border, `radius.full`). Multi-select; no chip selected means all agendas are shown (PRD).
   - Week strip: 7 day pills (40px wide, `lavender.100`, `radius.full`), number in Numeric Emphasis and weekday in Body Small. The selected day uses `lavender.900` with white number, `lavender.300` weekday, and a 6px `lime.500` dot. Tapping a day changes the timeline below.
3. **Timeline** (outside the card, to avoid nested cards): one row per item, time label (Body Small, `ink.600`, 40px column) + item card. Free slots between items show the hour with a dashed `lavender.600` divider.
   - **Item card:** fill = subject color (see below), `radius.md`, padding 12/16. Subject name (Label, `ink.900`), then "{início} – {fim} · {tipo}" (Body Small, `ink.900`).
   - **Owner tag:** top-right white pill with the agenda owner's first name (Label, `lavender.900`). Ownership is never shown by color, because color encodes the subject (PRD).
4. **Bottom navigation:** floating bar, `lavender.900`, `radius.full`, 24px from the screen edges. Active item is a `lime.500` pill with icon + label; inactive items are icon-only in `lavender.300` (code must give them accessible names). Variants: `Ativo=Início | Agenda | Perfil` × `Tom=Escuro | Claro` (the light-toned bar is used on the dark theme). UI copy uses "Início" (pt-BR) for the item the owner called "Home".

## Subject colors

Figma variable collection `Disciplinas` holds the 12 colors from the legend at the top of the current cronograma PDF (sampled from the owner's screenshot). `ink.900` text on each passes WCAG AA (lowest ≈5.5:1, Oncologia).

| Variable | Hex |
| --- | --- |
| `disciplina/dermatologia` | `#A1C3E3` |
| `disciplina/hematologia` | `#F3CCAE` |
| `disciplina/oncologia` | `#C589F1` |
| `disciplina/acoes-integrais-em-saude-vii` | `#FCB8FC` |
| `disciplina/terapia-intensiva` | `#AACF91` |
| `disciplina/habilidades-e-atitudes-profissionais-vii` | `#C9D9F0` |
| `disciplina/communicative-english` | `#CCCCCC` |
| `disciplina/eletivos` | `#FCFF43` |
| `disciplina/infectologia` | `#FDF2CE` |
| `disciplina/geriatria` | `#E3EFDA` |
| `disciplina/clinica-cirurgica-1` | `#52FEFE` |
| `disciplina/clinica-cirurgica-2` | `#44FD3E` |

**Open question:** these colors belong to this semester's PDF. In the product they should probably come from each imported PDF's legend (data), not from fixed design tokens. Decide before implementation.

## Desktop

Figma frame "Início / Desktop" (1440×900). Responsive breakpoints are still TBD (`docs/DESIGN_SYSTEM.md`), so this is a first proposal, not a confirmed breakpoint.

![Início desktop](inicio-desktop.png)

- **Persistent sidebar** (260px, `white`, `line` right border) replaces the mobile bottom bar: logo, then the same three destinations stacked vertically. The active item is a `lavender.900` pill with a `lime.500` icon, matching the bottom bar's active state; inactive items are icon + label in `ink.600`.
- **Header and "Agenda de hoje" card** are the same components as mobile, just placed in a wider canvas — no new patterns.
- **Two-column body:** the agenda card and timeline keep a readable fixed width (600px) instead of stretching full-bleed (per "avoid a marketing landing page" / scanability). The remaining space is a second column, currently an empty dashed placeholder ("Próximas contas e tarefas — Em breve nesta área.") reserving room for the bills/tasks summaries the PRD defers past this MVP slice, so adding them later doesn't require re-flowing this layout.
- Item cards, chips, week strip, and the dark-theme mapping all apply unchanged — only the shell (sidebar vs. bottom bar, column width) is desktop-specific.
- **Not decided:** the actual breakpoint where the layout switches from the mobile bottom-bar shell to this sidebar shell, and what fills the second column first (likely next bill + next task, per the PRD's home dashboard requirements) — both need a product decision before implementation.

### Collapsible sidebar

The sidebar can retract to an icon-only rail. Frame "Início / Desktop / Sidebar retraída" shows the collapsed state next to the expanded one ("Início / Desktop").

| Expanded (260px) | Collapsed (104px) |
| --- | --- |
| ![Sidebar expandida](inicio-desktop.png) | ![Sidebar retraída](inicio-desktop-sidebar-retraida.png) |

- A `lavender.100`, `radius.full` chevron button pins to the bottom of the sidebar (via a `FILL`-height spacer above it) and toggles the state; the chevron points left when expanded (retract) and right when collapsed (expand).
- Collapsed, the wordmark hides and only the "Ponto + D" symbol remains, centered; nav items become icon-only, still centered, keeping the same active-state pill (`lavender.900` fill, `lime.500` icon).
- The content area reflows to use the freed width (both columns are `FILL`/fixed-680, not pinned to the sidebar's width), so collapsing is a live layout change, not an overlay.
- **Not designed:** the icon-only nav items need an accessible name and a hover tooltip (icons alone aren't a label) once this becomes code; the expand/collapse transition should respect `prefers-reduced-motion`; and whether the collapsed state persists per user (e.g. `localStorage`) or resets every session is an open decision.

## Dark theme (proposal)

Figma frame "Início / Mobile / Escuro". **Not yet approved:** the confirmed palette has no dark background or surface (`ink.900` and `lavender.900` have almost the same luminance, ≈1.01:1), so this version proposes two new primitives, kept in the separate Figma collection `Proposta · Tema escuro` until the product owner approves them:

| Proposed token | Hex | Derivation |
| --- | --- | --- |
| `lavender.950` | `#1F1326` | `lavender.900` darkened ~45%; screen background |
| `lavender.800` | `#493964` | `lavender.900` mixed 30% with `lavender.700`; raised controls |

![Início mobile, tema escuro](inicio-mobile-escuro.png)

| Element | Light | Dark |
| --- | --- | --- |
| Screen background | `lavender.100` | `lavender.950` |
| Card, bell button, chips | `white` | `lavender.900` |
| Day pills, "ver agenda" button | `lavender.100` | `lavender.800` |
| Primary text / icons | `ink.900` / `lavender.900` | `white` |
| Secondary text, time labels | `ink.600` | `lavender.300` |
| Selected day | `lavender.900`, white text, `lime.500` dot | `lime.500`, `lavender.900` text and dot |
| Navigation bar | `Tom=Escuro`: `lavender.900` bar, `lime.500` active pill with `lavender.900` icon/label, `lavender.300` inactive icons | `Tom=Claro`: `lavender.100` bar, `lavender.900` active pill with `lime.500` icon/label, `lavender.700` inactive icons (≈3.7:1) |
| Item cards, owner tag | unchanged | unchanged (subject colors keep `ink.900` text) |

Contrast on dark: `white` on `lavender.950` ≈17.8:1; `lavender.300` on `lavender.950` ≈9.3:1, on `lavender.900` ≈7.4:1, on `lavender.800` ≈5.4:1; `lavender.600` chip/divider borders on `lavender.900` ≈4.2:1 (≥3:1 for UI components).

## Sample data

The screen uses sample items (Dermatologia, Oncologia, Clínica Cirúrgica 1, Habilidades e Atitudes Profissionais VII) and the agendas "Amanda" and "Andréa". They are placeholders, not real schedule data.

## Not yet designed

Loading, empty ("Nenhum compromisso hoje"), error, and selected-filter states; the day with no items; the navigation animation (reference: the owner's Dribbble clip, where the active pill slides between items; must respect `prefers-reduced-motion`).
