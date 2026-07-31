---
'@astryxdesign/core': patch
---

[feat] Pagination: add an `input` variant — an editable page/row number box flanked by first/last («/») buttons. Word the label however you like via `formatLabel(state, input)` (gets `page`, `pageCount`, `rowStart`/`rowEnd`, `totalItems`, `pageSize` and the pre-wired input node); the default renders `Page [ n ] / N`. A `valueUnit: 'page' | 'row'` controls what the number means (row mode jumps to the containing page and fires `onRowNavigate`). Adds `chevronsLeft`/`chevronsRight` icons (#4248).

@freddymeta
