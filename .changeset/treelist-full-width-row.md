---
'@astryxdesign/core': patch
---

[fix] TreeList: the row is now a full-width surface at every depth. The per-level indent moved from the row's outer margin to inner padding, so the row box spans the tree's full width instead of starting at the indent. This makes the `astryx-tree-list-item` theme target a full-bleed surface — a theme can paint the whole row (background/hover/selected via `defineTheme`) for a file-explorer-style highlight — and the built-in hover/selected/focus highlight now reaches edge-to-edge. Labels are unchanged, and a leaf's highlight is now flush with its sibling parents' (previously a leaf was inset past them by the chevron column). No API change.
@freddymeta
