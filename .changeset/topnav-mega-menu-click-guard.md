---
'@astryxdesign/core': patch
---

[fix] TopNavMegaMenu: fix the hover-then-click flicker where clicking a nav item after hovering dismissed the mega menu. The panel is now a manual popover (the native `popover="auto"` light-dismiss fired on the trigger's pointerdown and closed the panel before any JS ran) with a Vercel-style hover→click guard, so the click that naturally follows a hover confirms and pins the panel open instead of toggling it shut. Click/keyboard opens are pinned (persist past mouse-leave); hover opens stay transient. Keyboard activation (Enter/Space) always opens and moves focus into the panel, Escape closes and returns focus to the trigger, and outside-click still dismisses. Touch/click without a preceding hover toggles cleanly (#3121)
@imdreamrunner
