# Agenda — "Ver cronograma" (stored PDF access)

**Status:** Designed in Figma on 2026-09-30, for product owner review. Product rule: `docs/PRD.md` › "Shared agenda and PDF cronograma import".

## Figma screens (page "Agenda")

| Frame | Content |
|---|---|
| All mobile Agenda frames (light and dark) | Icon-only circular buttons in the calendar card header, left of the "Ver agenda" arrow: "Importar cronograma" (upload icon) and "Ver cronograma" (document icon). Component "Botão ícone / Circular 40" (Tonal) with the new icon components "Ícone / Upload" and "Ícone / Documento" (page "Componentes"). The empty state shows only "Importar cronograma". Decided by the product owner on 2026-09-30 to reduce clutter; replaces the full-width buttons. |
| Agenda / Desktop, Agenda / Desktop · Escuro | "Ver cronograma" in the header actions, between "Importar cronograma" and notifications. "Agenda / Desktop · Escuro" was added on 2026-09-30 (it was missing). |
| Agenda / Mobile · Cronogramas (+ · Escuro) | Bottom sheet "Cronogramas": grabber, title, one row per agenda (color dot, agenda name, file name, import date, links "Abrir" and "Baixar" using the Link component), divider, "Fechar" secondary button. |
| Agenda / Desktop · Cronogramas (+ · Escuro) | Popover (420 px, radius 24) anchored under the pressed "Ver cronograma" button (pressed state = `lavender.100` light / `lavender.800` dark fill); no close button (Esc or click outside). |

The desktop form/delete screens also show the new button in their background. Sample data ("Agenda de Bia", file names, dates) is illustrative only.

Dark versions follow the dark mapping in `docs/design/inicio/README.md` (sheet `lavender.900`, secondary text `lavender.300`, divider `lavender.800`, links in the dark Link variant).

## When it appears

- The action only appears when at least one agenda currently in view has an imported cronograma PDF. With no stored PDF, nothing is shown (no disabled button).
- Every household member can view and download the stored PDFs of the household's agendas. Access is authorized on the server (household membership) on every request.

## Entry point

- **Mobile (< 768 px):** icon-only circular buttons in the calendar card header, next to the "Ver agenda" arrow: upload icon = "Importar cronograma", document icon = "Ver cronograma". Each needs `aria-label` with the full action ("Importar cronograma", "Ver cronograma") and a tooltip on long-press/hover; hit area at least 40 × 40 px. While the list is open, the "Ver cronograma" button shows a pressed fill (`lavender.300` light / `lavender.700` dark).
- **Desktop (≥ 768 px):** labeled secondary buttons "Importar cronograma" and "Ver cronograma" in the page header (there is room for text on desktop).

## Behavior

- **One PDF in view:** the button opens the PDF directly in a new browser tab, using the browser's own PDF viewer. It carries the accessible name "Ver cronograma de {nome da agenda} (abre em nova aba)".
- **More than one PDF in view:** the button opens a list, as a bottom sheet on mobile and a popover anchored to the button on desktop.
  - Title: "Cronogramas".
  - One row per agenda: the agenda color dot, "Agenda de {nome}", the file name, and "Importado em {data}".
  - Each row has two actions: "Abrir" (a new tab) and "Baixar" (downloads with the original file name).
  - The sheet closes with "Fechar", a scrim tap or Esc. The popover closes with Esc or a click outside, and focus returns to the button.

## States

| State | UI |
|---|---|
| Loading the file | A spinner inside the pressed button/row action and the label "Abrindo…". The control is disabled while it waits. |
| Error | Toast "Não foi possível abrir o cronograma. Tente de novo." in `color.state.danger`. The file stays listed. |
| After re-import | The list shows the new file and date. The previous file is no longer available (it is replaced). |

## Technical notes

- The PDF is stored encrypted (see `docs/ARCHITECTURE.md` › "Sensitive data and field-level encryption"). The API decrypts it only for an authorized household member and streams it with `Content-Type: application/pdf`, `Content-Disposition: inline` (Abrir) or `attachment` (Baixar), and `Cache-Control: no-store`.
- Never expose a public or guessable file URL. Use the agenda's stable public identifier on an authenticated endpoint.
- The file name is decrypted server-side and sanitized in the `Content-Disposition` header.
