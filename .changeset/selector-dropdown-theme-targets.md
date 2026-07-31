---
'@astryxdesign/core': patch
---

[feat] Selector & MultiSelector: add theme targets for the dropdown internals so themes can restyle them without fragile structural CSS. New targets: `selector-dropdown` / `multi-selector-dropdown` (the popover content — set `margin-block-start` here for a dropdown offset), `selector-search` / `selector-search-input` (and the multi-selector equivalents) for the dropdown search field, `selector-empty` / `multi-selector-empty` for the "no results" state, and `selector-section-header` / `multi-selector-section-header` for grouped-option titles. Both triggers also now reflect a `disabled` state on their root target (`astryx-selector` / `astryx-multi-selector`) so a theme can style the disabled trigger (e.g. suppress hover). Purely additive — default appearance is unchanged.
@freddymeta
