# Figma screen export plan

**Status:** working plan for exporting every existing Figma screen into `docs/design/<categoria>/`, following the structure Amanda created manually in `docs/design/login/`. Not a design document — delete once the export below is done and committed.

Amanda's instruction (2026-10-01): export every existing Figma screen into `/docs/design`, one folder per category, using `docs/design/login` as the template. Also (2026-10-01, follow-up): use Figwright whenever the official Figma connector doesn't work, and export locally.

File key: `gqI9TEAGtBeenNCHW7gfPN` (Domiyo Figma file).

## Folder convention (from `docs/design/login`)

```
docs/design/<categoria>/
  mobile/
    tema-claro/<tela>.png
    tema-escuro/<tela>.png
  desktop/
    tema-claro/<tela>.png
    tema-escuro/<tela>.png
```

`<tela>` is the frame's base name, kebab-cased, without accents, with "Mobile"/"Desktop"/"Escuro" stripped (those become the folder path instead). Export each frame at its own size (no forced scale), PNG.

## Why the plan lives in a file, not just in chat

The official Figma MCP connector hit the Starter-plan rate limit while mapping pages (see thread), so the remaining export must run through the local Figwright session. That session can't be reached by direct message from this cloud session — the reliable handoff is this file, committed to the branch both sessions share.

## Priority (Amanda, 2026-10-01 14:58): export these 5 first

Agenda, Importar cronograma, Perfil e household, Erros, Tarefas — before moving to the nav-structure decision or any new screen. The tables below already cover Agenda, Importar cronograma and Perfil e household; Erros and Tarefas have their own sections. Notificações and Início are mapped too but are not in this priority batch — do them after.

## Pages already covered

- **Login** (`0:1`) — done, committed by Amanda directly (`docs/design/login/`).
- **Logo**, **Componentes** — not app screens, skip.

## Tarefas (`98:2501`) → `docs/design/tarefas/`

Still being built — only one frame exists so far, light mobile only. Export what's there now; re-export when the dark/desktop versions and the remaining screens (calendar, create/edit form, history, delete confirmation) land.

| Frame id | Frame name | Target path |
|---|---|---|
| (list via script below) | Lista de tarefas / Mobile | `mobile/tema-claro/lista-de-tarefas.png` |

```js
const page = await figma.getNodeByIdAsync('98:2501');
await figma.setCurrentPageAsync(page);
return page.children.filter(n => n.type === 'FRAME').map(n => ({ id: n.id, name: n.name, w: n.width, h: n.height }));
```

## Erros (`60:4842`) — not yet mapped

The official connector hit its rate limit before this page (and Notificações) could be listed. List it the same way as Notificações below, target folder `docs/design/erros/`.

## Início (`18:498`) → `docs/design/inicio/`

| Frame id | Frame name | Target path |
|---|---|---|
| 18:499 | Início / Mobile | `mobile/tema-claro/inicio.png` |
| 18:654 | Início / Mobile / Escuro | `mobile/tema-escuro/inicio.png` |
| 18:855 | Início / Desktop | `desktop/tema-claro/inicio.png` |
| 18:1008 | Loading / Mobile | `mobile/tema-claro/loading.png` |
| 19:1009 | Início / Desktop / Sidebar retraída | `desktop/tema-claro/inicio-sidebar-retraida.png` |
| 19:1194 | Loading / Desktop | `desktop/tema-claro/loading.png` |

(No dark desktop or dark loading frames exist yet — don't invent them.)

Note: `docs/design/inicio/` already has some of these PNGs from an earlier export (flat, not in mobile/desktop × tema-claro/tema-escuro folders). Move/re-export into the folder structure above instead of leaving both layouts.

## Agenda (`60:4838`) → `docs/design/agenda/`

| Frame id | Frame name | Target path |
|---|---|---|
| 24:1396 | Agenda / Mobile | `mobile/tema-claro/agenda.png` |
| 40:1829 | Agenda / Mobile · Seletor aberto | `mobile/tema-claro/agenda-seletor-aberto.png` |
| 24:1516 | Agenda / Mobile · Vazio | `mobile/tema-claro/agenda-vazio.png` |
| 25:1626 | Agenda / Mobile · Carregando | `mobile/tema-claro/agenda-carregando.png` |
| 25:1739 | Agenda / Mobile · Erro | `mobile/tema-claro/agenda-erro.png` |
| 37:334 | Calendário mensal / Mobile | `mobile/tema-claro/calendario-mensal.png` |
| 26:1851 | Detalhe do item / Mobile | `mobile/tema-claro/detalhe-do-item.png` |
| 52:2399 | Item da agenda · Formulário / Mobile | `mobile/tema-claro/item-da-agenda-formulario.png` |
| 53:5197 | Item da agenda · Excluir / Mobile | `mobile/tema-claro/item-da-agenda-excluir.png` |
| 28:2228 | Modal de conflito / Mobile | `mobile/tema-claro/modal-de-conflito.png` |
| 77:5918 | Agenda / Mobile · Cronogramas | `mobile/tema-claro/agenda-cronogramas.png` |
| 31:2348 | Agenda / Mobile · Escuro | `mobile/tema-escuro/agenda.png` |
| 40:1912 | Agenda / Mobile · Seletor aberto · Escuro | `mobile/tema-escuro/agenda-seletor-aberto.png` |
| 37:368 | Calendário mensal / Mobile · Escuro | `mobile/tema-escuro/calendario-mensal.png` |
| 33:2701 | Detalhe do item / Mobile · Escuro | `mobile/tema-escuro/detalhe-do-item.png` |
| 53:6787 | Item da agenda · Formulário / Mobile · Escuro | `mobile/tema-escuro/item-da-agenda-formulario.png` |
| 53:6942 | Item da agenda · Excluir / Mobile · Escuro | `mobile/tema-escuro/item-da-agenda-excluir.png` |
| 33:2839 | Modal de conflito / Mobile · Escuro | `mobile/tema-escuro/modal-de-conflito.png` |
| 78:6076 | Agenda / Mobile · Cronogramas · Escuro | `mobile/tema-escuro/agenda-cronogramas.png` |
| 33:2473 | Agenda / Desktop | `desktop/tema-claro/agenda.png` |
| 47:3059 | Agenda / Desktop · Seletor aberto | `desktop/tema-claro/agenda-seletor-aberto.png` |
| 47:2306 | Agenda / Desktop · Vazio | `desktop/tema-claro/agenda-vazio.png` |
| 47:2557 | Agenda / Desktop · Carregando | `desktop/tema-claro/agenda-carregando.png` |
| 47:2808 | Agenda / Desktop · Erro | `desktop/tema-claro/agenda-erro.png` |
| 47:3310 | Calendário mensal / Desktop | `desktop/tema-claro/calendario-mensal.png` |
| 47:3561 | Detalhe do item / Desktop | `desktop/tema-claro/detalhe-do-item.png` |
| 52:4074 | Item da agenda · Formulário / Desktop | `desktop/tema-claro/item-da-agenda-formulario.png` |
| 53:5321 | Item da agenda · Excluir / Desktop | `desktop/tema-claro/item-da-agenda-excluir.png` |
| 47:3812 | Modal de conflito / Desktop | `desktop/tema-claro/modal-de-conflito.png` |
| 78:6232 | Agenda / Desktop · Cronogramas | `desktop/tema-claro/agenda-cronogramas.png` |
| 77:5542 | Agenda / Desktop · Escuro | `desktop/tema-escuro/agenda.png` |
| 53:7716 | Item da agenda · Formulário / Desktop · Escuro | `desktop/tema-escuro/item-da-agenda-formulario.png` |
| 53:8037 | Item da agenda · Excluir / Desktop · Escuro | `desktop/tema-escuro/item-da-agenda-excluir.png` |
| 78:6596 | Agenda / Desktop · Cronogramas · Escuro | `desktop/tema-escuro/agenda-cronogramas.png` |

(Desktop · Escuro has no Seletor aberto / Vazio / Carregando / Erro / Calendário mensal / Detalhe do item / Modal de conflito frames yet — don't invent them, just export what exists.)

## Importar cronograma (`60:4839`) → `docs/design/importar-cronograma/`

| Frame id | Frame name | Target path |
|---|---|---|
| 52:2510 | Importar PDF / 0 · Escolher agenda | `mobile/tema-claro/importar-pdf-0-escolher-agenda.png` |
| 26:1989 | Importar PDF / 1 · Upload | `mobile/tema-claro/importar-pdf-1-upload.png` |
| 52:2522 | Importar PDF / Erro no arquivo | `mobile/tema-claro/importar-pdf-erro-no-arquivo.png` |
| 27:2003 | Importar PDF / 2 · Preview | `mobile/tema-claro/importar-pdf-2-preview.png` |
| 27:2049 | Importar PDF / 3 · Confirmação | `mobile/tema-claro/importar-pdf-3-confirmacao.png` |
| 27:2096 | Importar PDF / 4 · Carregando | `mobile/tema-claro/importar-pdf-4-carregando.png` |
| 52:2534 | Importar PDF / 5 · Resultado | `mobile/tema-claro/importar-pdf-5-resultado.png` |
| 53:7067 | Importar PDF / 0 · Escolher agenda · Escuro | `mobile/tema-escuro/importar-pdf-0-escolher-agenda.png` |
| 33:2873 | Importar PDF / 1 · Upload · Escuro | `mobile/tema-escuro/importar-pdf-1-upload.png` |
| 53:7088 | Importar PDF / Erro no arquivo · Escuro | `mobile/tema-escuro/importar-pdf-erro-no-arquivo.png` |
| 33:2887 | Importar PDF / 2 · Preview · Escuro | `mobile/tema-escuro/importar-pdf-2-preview.png` |
| 33:2925 | Importar PDF / 3 · Confirmação · Escuro | `mobile/tema-escuro/importar-pdf-3-confirmacao.png` |
| 33:2972 | Importar PDF / 4 · Carregando · Escuro | `mobile/tema-escuro/importar-pdf-4-carregando.png` |
| 53:7102 | Importar PDF / 5 · Resultado · Escuro | `mobile/tema-escuro/importar-pdf-5-resultado.png` |
| 52:2908 | Importar PDF / 0 · Escolher agenda · Desktop | `desktop/tema-claro/importar-pdf-0-escolher-agenda.png` |
| 47:4412 | Importar PDF / 1 · Upload · Desktop | `desktop/tema-claro/importar-pdf-1-upload.png` |
| 52:3249 | Importar PDF / Erro no arquivo · Desktop | `desktop/tema-claro/importar-pdf-erro-no-arquivo.png` |
| 47:4663 | Importar PDF / 2 · Preview · Desktop | `desktop/tema-claro/importar-pdf-2-preview.png` |
| 47:4914 | Importar PDF / 3 · Confirmação · Desktop | `desktop/tema-claro/importar-pdf-3-confirmacao.png` |
| 47:5165 | Importar PDF / 4 · Carregando · Desktop | `desktop/tema-claro/importar-pdf-4-carregando.png` |
| 52:3523 | Importar PDF / 5 · Resultado · Desktop | `desktop/tema-claro/importar-pdf-5-resultado.png` |
| 53:8328 | Importar PDF / 0 · Escolher agenda · Desktop · Escuro | `desktop/tema-escuro/importar-pdf-0-escolher-agenda.png` |
| 53:8623 | Importar PDF / Erro no arquivo · Desktop · Escuro | `desktop/tema-escuro/importar-pdf-erro-no-arquivo.png` |
| 53:8917 | Importar PDF / 5 · Resultado · Desktop · Escuro | `desktop/tema-escuro/importar-pdf-5-resultado.png` |

(Desktop · Escuro is missing steps 1–4 — not designed yet, don't invent them.)

## Perfil e household (`60:4840`) → `docs/design/perfil-e-household/`

| Frame id | Frame name | Target path |
|---|---|---|
| 29:2262 | Perfil / Mobile | `mobile/tema-claro/perfil.png` |
| 52:2315 | Convidar membro / Mobile | `mobile/tema-claro/convidar-membro.png` |
| 52:2357 | Remover membro / Mobile | `mobile/tema-claro/remover-membro.png` |
| 53:5604 | Sair do household / Mobile | `mobile/tema-claro/sair-do-household.png` |
| 83:7367 | Perfil / Mobile · Convites | `mobile/tema-claro/perfil-convites.png` |
| 33:2624 | Perfil / Mobile · Escuro | `mobile/tema-escuro/perfil.png` |
| 53:6552 | Convidar membro / Mobile · Escuro | `mobile/tema-escuro/convidar-membro.png` |
| 53:6635 | Remover membro / Mobile · Escuro | `mobile/tema-escuro/remover-membro.png` |
| 53:6711 | Sair do household / Mobile · Escuro | `mobile/tema-escuro/sair-do-household.png` |
| 83:7472 | Perfil / Mobile · Convites · Escuro | `mobile/tema-escuro/perfil-convites.png` |
| 47:5594 | Perfil / Desktop | `desktop/tema-claro/perfil.png` |
| 52:3812 | Convidar membro / Desktop | `desktop/tema-claro/convidar-membro.png` |
| 52:3944 | Remover membro / Desktop | `desktop/tema-claro/remover-membro.png` |
| 53:5700 | Sair do household / Desktop | `desktop/tema-claro/sair-do-household.png` |
| 83:7579 | Perfil / Desktop · Convites | `desktop/tema-claro/perfil-convites.png` |
| 53:7397 | Convidar membro / Desktop · Escuro | `desktop/tema-escuro/convidar-membro.png` |
| 53:7510 | Remover membro / Desktop · Escuro | `desktop/tema-escuro/remover-membro.png` |
| 53:7613 | Sair do household / Desktop · Escuro | `desktop/tema-escuro/sair-do-household.png` |
| 83:7710 | Perfil / Desktop · Convites · Escuro | `desktop/tema-escuro/perfil-convites.png` |

(No "Perfil / Desktop · Escuro" base frame yet — not designed, don't invent it.)

## Notificações (`60:4841`) and Erros (`60:4842`) — not yet mapped

The official connector hit its rate limit before these two pages could be listed (9 and 14 children respectively, per an earlier `figma.root.children` count). Whoever runs the export (Figwright session) should list these two pages' frames first:

```js
const page = await figma.getNodeByIdAsync('60:4841'); // Notificações; use '60:4842' for Erros
await figma.setCurrentPageAsync(page);
return page.children.filter(n => n.type === 'FRAME').map(n => ({ id: n.id, name: n.name, w: n.width, h: n.height }));
```

Then apply the same naming convention as the tables above: strip `/ Mobile`, `/ Desktop`, `Escuro` into the folder path, kebab-case the rest, no accents.

Target folders: `docs/design/notificacoes/` and `docs/design/erros/`.

## Execution notes

- Export via Figwright's `save_screenshots` (or `get_screenshot` if the official connector recovers) at native frame size — don't upscale/downscale.
- Work one category at a time, one `use_figma`/Figwright page-switch per call (see `figma-use` skill's page rules) — don't loop pages in a single script.
- Commit as the export completes; no need to wait for every category before pushing the first ones.
- Delete this file once every category above is exported and committed.

## Post-export cleanup (2026-10-01 15:54 UTC)

**Status**: 87 screens exported to `docs/design/<categoria>/telas/` (flat folder structure, not following the `mobile/desktop × tema-claro/tema-escuro` layout from EXPORT_PLAN.md).

**Before commit:**
1. **Email privacy**: Figma Perfil screens show `amanda.pintoh@gmail.com`. Replace with `user@example.com` in Figma, then re-export the 19 Perfil e household screens.
2. **JPG fallback**: 7 screens exported as JPG (timeout on PNG): some agenda, erros, perfil screens. Attempt re-export as PNG 1x. If timeout persists, JPG is acceptable.

**After cleanup, commit with message**: `"export: add 87 Figma design screens to docs/design"` and delete this file.
