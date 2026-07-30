// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file TopNavMegaMenu.tsx
 * @input Uses React, StyleX, usePopover (Popover API + CSS anchor positioning)
 * @output Exports TopNavMegaMenu component and related types
 * @position Navigation item with hover-triggered full-width mega menu for TopNav
 *
 * Uses usePopover to promote the panel to the top layer via the Popover API,
 * eliminating z-index stacking. CSS anchor positioning places the panel below
 * the nav wrapper.
 *
 * The default (desktop) trigger opens on hover and on click:
 * - Hover opens a *transient* panel that closes when the pointer leaves.
 * - A click (or keyboard activation) *pins* the panel open so it persists past
 *   mouse-leave. A hover-open that is then clicked within CLICK_GUARD_MS is
 *   pinned rather than toggled shut (the "click guard") — this is what fixes
 *   the hover-then-click flicker.
 * The panel is a *manual* popover (no native light dismiss): a native
 * `popover="auto"` light-dismisses on the trigger's pointerdown (the trigger
 * sits outside the panel), which closed a hover-opened panel before the guard
 * could run — the real cause of #3121. Outside-click dismissal is reproduced
 * explicitly. Keyboard (Enter/Space) always opens and moves focus into the
 * panel; Escape closes and returns focus to the trigger. Touch has no hover,
 * so taps toggle cleanly. See issue #3121.
 *
 * Supports three render modes via TopNavRenderContext:
 * - 'default': desktop popover mega menu (hover/click triggered)
 * - 'mobile-bar': returns null (hidden in compact mobile bar)
 * - 'drawer': drill-down navigation with back button
 *
 * SYNC: When modified, update these files to stay in sync:
 * - /packages/core/src/TopNav/TopNav.doc.mjs
 * - /packages/core/src/TopNav/index.ts
 * - /packages/cli/templates/blocks/components/TopNav/ (showcase blocks)
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as stylex from '@stylexjs/stylex';
import {
  colorVars,
  spacingVars,
  radiusVars,
  durationVars,
  easeVars,
  fontWeightVars,
  shadowVars,
  typeScaleVars,
  borderVars,
} from '../theme/tokens.stylex';
import {usePopover} from '../Popover/usePopover';
import {Grid} from '../Grid/Grid';
import {getIcon} from '../Icon/globalIconRegistry';
import {mergeProps, mergeRefs} from '../utils';
import type {BaseProps} from '../BaseProps';
import {navItemStyles} from '../NavItem/navItemStyles.stylex';
import {useTopNavSlot} from './TopNavContext';
import {useTopNavRenderMode} from './TopNavRenderContext';
import {themeProps} from '../utils/themeProps';

// =============================================================================
// Styles
// =============================================================================

const styles = stylex.create({
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacingVars['--spacing-2'],
    paddingBlock: spacingVars['--spacing-1-5'],
    paddingInline: spacingVars['--spacing-3'],
    borderRadius: radiusVars['--radius-element'],
    fontSize: typeScaleVars['--text-label-size'],
    lineHeight: typeScaleVars['--text-label-leading'],
    fontWeight: fontWeightVars['--font-weight-medium'],
    color: colorVars['--color-text-secondary'],
    textDecoration: 'none',
    cursor: 'pointer',
    transitionProperty: 'background-color, color',
    transitionDuration: durationVars['--duration-fast'],
    transitionTimingFunction: easeVars['--ease-standard'],
    backgroundColor: {
      default: 'transparent',
      ':hover': {
        '@media (hover: hover)': colorVars['--color-overlay-hover'],
      },
    },
    outline: {
      default: null,
      ':focus-visible': `2px solid ${colorVars['--color-accent']}`,
    },
    outlineOffset: {
      default: '0',
      ':focus-visible': '2px',
    },
    border: 'none',
    fontFamily: 'inherit',
  },
  triggerOpen: {
    color: colorVars['--color-text-primary'],
    backgroundColor: colorVars['--color-overlay-hover'],
  },
  chevron: {
    display: 'inline-flex',
    alignItems: 'center',
    transitionProperty: 'transform',
    transitionDuration: durationVars['--duration-fast'],
    transitionTimingFunction: easeVars['--ease-standard'],
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
  },
  // Animation styles applied to the layer's popover element.
  panelAnimation: {
    opacity: {
      default: 0,
      ':popover-open': 1,
    },
    transform: {
      default: 'translateY(-4px)',
      ':popover-open': 'translateY(0)',
    },
    transitionProperty: 'opacity, transform, overlay, display',
    transitionDuration: durationVars['--duration-medium-min'],
    transitionTimingFunction: easeVars['--ease-standard'],
    transitionBehavior: 'allow-discrete',
    '@starting-style': {
      opacity: 0,
      transform: 'translateY(-4px)',
    },
  },
  // Visual styles for the panel content container.
  panelContainer: {
    backgroundColor: colorVars['--color-background-popover'],
    borderTopWidth: borderVars['--border-width'],
    borderTopStyle: 'solid',
    borderTopColor: colorVars['--color-border'],
    borderRadius: radiusVars['--radius-container'],
    boxShadow: shadowVars['--shadow-low'],
    overflow: 'hidden',
  },
  panelContent: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacingVars['--spacing-6'],
    paddingBlock: spacingVars['--spacing-3'],
    paddingInline: spacingVars['--spacing-3'],
    maxWidth: 960,
  },
  menuWrapper: {
    flexGrow: 2,
    flexShrink: 1,
    flexBasis: 300,
    minWidth: 0,
  },
  featured: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 200,
    borderRadius: radiusVars['--radius-container'],
    backgroundColor: colorVars['--color-background-muted'],
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  // =========================================================================
  // Drawer mode styles (composes navItemStyles.item as base)
  // =========================================================================
  drawerSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  // Header button override — justifyContent and button resets only,
  // base layout/colors come from navItemStyles.item
  drawerHeader: {
    justifyContent: 'space-between',
    border: 'none',
    background: 'none',
  },
  drawerChevron: {
    display: 'inline-flex',
    transitionProperty: 'transform',
    transitionDuration: durationVars['--duration-fast'],
    transitionTimingFunction: easeVars['--ease-standard'],
  },
  drawerChevronExpanded: {
    transform: 'rotate(180deg)',
  },
  drawerItems: {
    display: 'grid',
    gridTemplateRows: '0fr',
    transitionProperty: 'grid-template-rows',
    transitionDuration: durationVars['--duration-medium'],
    transitionTimingFunction: easeVars['--ease-standard'],
  },
  drawerItemsExpanded: {
    gridTemplateRows: '1fr',
  },
  drawerItemsInner: {
    overflow: 'hidden',
    minHeight: 0,
  },

  // Featured card in drawer — compact version
  drawerFeatured: {
    marginBlockStart: spacingVars['--spacing-2'],
    marginInlineStart: spacingVars['--spacing-6'],
    borderRadius: radiusVars['--radius-container'],
    backgroundColor: colorVars['--color-background-muted'],
    overflow: 'hidden',
  },
});

// =============================================================================
// Types
// =============================================================================

export interface TopNavMegaMenuProps extends BaseProps<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>;
  /** The visible label for the nav item trigger. */
  label: string;
  /**
   * Menu items slot — typically one or more TopNavMegaMenuItem components,
   * but accepts any ReactNode for custom layouts.
   */
  items?: ReactNode;
  /**
   * Featured content slot — rendered in the right panel on desktop,
   * and below the items in the mobile drawer.
   */
  featured?: ReactNode;
  /** Delay before showing the menu on hover (ms). @default 150 */
  delay?: number;
  /** Delay before hiding the menu after mouse leaves (ms). @default 250 */
  hideDelay?: number;
  /**
   * Callback fired when the mega menu opens or closes.
   * Useful for coordinating wrapper styles (e.g. hiding other shadows).
   */
  onOpenChange?: (isOpen: boolean) => void;
}

// =============================================================================
// TopNavMegaMenu
// =============================================================================

/**
 * A navigation item that displays a full-width mega menu on hover.
 *
 * Uses a composed children API with sub-components:
 * - `items` — ReactNode slot, typically TopNavMegaMenuItem components
 * - `featured` — ReactNode slot for the right-panel / drawer featured card
 *
 * Supports three render modes via TopNavRenderContext:
 * - `'default'`: desktop popover with hover/click trigger
 * - `'mobile-bar'`: hidden (returns null)
 * - `'drawer'`: inline collapsible matching TopNavMenu pattern
 *
 * @example
 * ```
 * <TopNav
 *   startContent={
 *     <TopNavMegaMenu
 *       label="Products"
 *       items={
 *         <>
 *           <TopNavMegaMenuItem
 *             title="Analytics"
 *             description="Track behavior"
 *             icon={<ChartIcon />}
 *             href="/analytics"
 *           />
 *           <TopNavMegaMenuItem
 *             title="Messaging"
 *             description="Real-time comms"
 *             icon={<ChatIcon />}
 *             href="/messaging"
 *           />
 *         </>
 *       }
 *       featured={
 *         <>
 *           <strong>New: AI Features</strong>
 *           <p>Explore our latest AI-powered tools.</p>
 *         </>
 *       }
 *     />
 *   }
 * />
 * ```
 */
export function TopNavMegaMenu({
  ref,
  label,
  items,
  featured,
  delay = 150,
  hideDelay = 250,
  onOpenChange,
}: TopNavMegaMenuProps) {
  const renderMode = useTopNavRenderMode();

  // =========================================================================
  // Mobile-bar mode — hidden
  // =========================================================================
  if (renderMode === 'mobile-bar') {
    return null;
  }

  // =========================================================================
  // Drawer mode — inline collapsible
  // =========================================================================
  if (renderMode === 'drawer') {
    return <DrawerMegaMenu label={label} items={items} featured={featured} />;
  }

  // =========================================================================
  // Default mode — desktop popover
  // =========================================================================
  return (
    <DefaultMegaMenu
      ref={ref}
      label={label}
      items={items}
      featured={featured}
      delay={delay}
      hideDelay={hideDelay}
      onOpenChange={onOpenChange}
    />
  );
}

TopNavMegaMenu.displayName = 'TopNavMegaMenu';

// =============================================================================
// DefaultMegaMenu — desktop popover mode
// =============================================================================

/**
 * How long (ms) after a hover-open a click on the trigger is treated as the
 * natural click that confirms (and pins open) the hover — rather than a
 * deliberate click-to-close. Mirrors the guard vercel.com uses on its Products
 * dropdown. See issue #3121.
 */
const CLICK_GUARD_MS = 500;

function DefaultMegaMenu({
  ref,
  label,
  items,
  featured,
  delay = 150,
  hideDelay = 250,
  onOpenChange,
}: TopNavMegaMenuProps) {
  const slot = useTopNavSlot();
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  // Timestamp (ms) of the last hover-triggered open. Set ONLY when a hover
  // opens the panel; the click handler consults it to tell a hover-follow
  // "confirm" click apart from a deliberate one (the Vercel-style guard).
  // Stays 0 for click / touch / keyboard opens. See issue #3121.
  const hoverOpenedAtRef = useRef(0);
  // Whether the panel is "pinned" open by a click or keyboard activation.
  // Pinned panels ignore mouse-leave (a deliberate open should persist);
  // hover-opened panels stay transient and close when the pointer leaves.
  const stickyRef = useRef(false);

  const handlePopoverShow = useCallback(() => {
    onOpenChange?.(true);
  }, [onOpenChange]);

  const handlePopoverHide = useCallback(() => {
    // Any close (click, mouseleave, Escape, outside pointerdown) resets the
    // hover guard and the pinned state so the next interaction starts fresh.
    hoverOpenedAtRef.current = 0;
    stickyRef.current = false;
    onOpenChange?.(false);
  }, [onOpenChange]);

  const popover = usePopover({
    // role: 'none' — the panel exposes its own role="group" labeled by
    // `label`. Pointer/hover opens keep focus on the trigger; keyboard and
    // assistive-tech opens move focus into the panel (a labeled group you exit
    // with Escape or by tabbing out). Either way role="dialog"
    // aria-modal="true" would be wrong: it announces an unnamed modal dialog
    // around a grid of links (and, when focus stays on the trigger, marks the
    // focused control inert).
    role: 'none',
    // hasSurface: false — mega menu provides its own surface (panelContainer)
    // with border-top and custom overflow. Animation is applied via the
    // render() call's xstyle prop (panelAnimation), not the hook options.
    hasSurface: false,
    // Manual (not light-dismiss): a native popover="auto" light-dismisses on a
    // pointerdown on the trigger — which sits outside the panel — closing a
    // hover-opened panel before the click guard runs. That was the real cause
    // of the hover-then-click flicker (#3121). Outside-click dismissal is
    // handled by the effect below; Escape still closes via the focus trap.
    hasLightDismiss: false,
    onShow: handlePopoverShow,
    onHide: handlePopoverHide,
  });

  // Set the CSS anchor to the parent <nav> element (the TopNav).
  useEffect(() => {
    const nav = triggerButtonRef.current?.closest('nav');
    if (nav) {
      popover.triggerRef(nav);
    }
    return () => {
      popover.triggerRef(null);
    };
  }, [popover]);

  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const scheduleShow = useCallback(() => {
    clearTimeouts();
    showTimeoutRef.current = setTimeout(() => {
      // Hover-intent fired: record when the panel opened so the click that
      // often follows a hover can be told apart from a deliberate one.
      hoverOpenedAtRef.current = Date.now();
      popover.show({skipAutoFocus: true});
    }, delay);
  }, [clearTimeouts, popover, delay]);

  const scheduleHide = useCallback(() => {
    clearTimeouts();
    hideTimeoutRef.current = setTimeout(() => {
      popover.hide();
    }, hideDelay);
  }, [clearTimeouts, popover, hideDelay]);

  // Move keyboard focus to the first link inside the open panel.
  const focusFirstPanelItem = useCallback(() => {
    popover.contentRef.current
      ?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      ?.focus();
  }, [popover.contentRef]);

  const handleMouseEnter = useCallback(() => {
    // Entering the trigger (or the open panel) cancels a pending hide. Only
    // arm a hover-open while closed — never re-stamp the guard on an already
    // open panel, which would keep swallowing deliberate close clicks.
    clearTimeouts();
    if (!popover.isOpen) {
      scheduleShow();
    }
  }, [clearTimeouts, popover.isOpen, scheduleShow]);

  const handleMouseLeave = useCallback(() => {
    // A panel pinned open by a click/keyboard stays open when the pointer
    // leaves; only hover-opened (transient) panels close on mouse-leave.
    if (!stickyRef.current) {
      scheduleHide();
    }
  }, [scheduleHide]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      clearTimeouts();

      // Keyboard (Enter/Space) and programmatic activation fire a click with
      // detail 0; real pointer clicks report detail >= 1. Keyboard always
      // OPENS (never toggles closed), pins the panel open, and moves focus
      // into it — the accessible open/focus model. See issue #3121.
      if (e.detail === 0) {
        stickyRef.current = true;
        hoverOpenedAtRef.current = 0;
        if (popover.isOpen) {
          focusFirstPanelItem();
        } else {
          // usePopover auto-focuses the first link once the panel mounts.
          popover.show();
        }
        return;
      }

      if (!popover.isOpen) {
        // Pointer open (click / tap). A deliberate open is pinned so it
        // persists past mouse-leave; focus stays on the trigger.
        stickyRef.current = true;
        popover.show({skipAutoFocus: true});
      } else if (Date.now() - hoverOpenedAtRef.current < CLICK_GUARD_MS) {
        // The panel just opened on hover and appeared under the cursor. This
        // click confirms it rather than dismissing it: pin it open (so it no
        // longer closes on mouse-leave) and reset the guard so the NEXT click
        // is a deliberate close.
        stickyRef.current = true;
        hoverOpenedAtRef.current = 0;
      } else {
        // Deliberate click-to-close.
        popover.hide();
        triggerButtonRef.current?.focus();
      }
    },
    [clearTimeouts, popover, focusFirstPanelItem],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      // Escape closes the panel and returns focus to the trigger. Escape from
      // within the panel is handled by usePopover's focus trap (which restores
      // focus to the trigger); this covers Escape while focus is on the
      // trigger (e.g. a pointer-opened panel). See issue #3121.
      if (e.key === 'Escape' && popover.isOpen) {
        e.preventDefault();
        clearTimeouts();
        popover.hide();
        triggerButtonRef.current?.focus();
      }
    },
    [clearTimeouts, popover],
  );

  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Outside-click dismissal. The panel is a manual popover (no native light
  // dismiss — see the usePopover call), so we reproduce "click outside closes"
  // ourselves while EXCLUDING the trigger and the panel. Excluding the trigger
  // is the point: a pointerdown on it must not close the panel, so the click
  // guard in handleClick can decide whether the click confirms or dismisses
  // (#3121). Capture phase so a child's stopPropagation can't hide the panel
  // from us.
  useEffect(() => {
    if (!popover.isOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      const trigger = triggerButtonRef.current;
      const panel = document.getElementById(popover.id);
      if (trigger?.contains(target) || panel?.contains(target)) {
        return;
      }
      clearTimeouts();
      popover.hide();
    };
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [popover.isOpen, popover, clearTimeouts]);

  return (
    <>
      <button
        ref={mergeRefs(triggerButtonRef, ref)}
        type="button"
        {...popover.triggerProps}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...mergeProps(
          themeProps('top-nav-mega-menu'),
          stylex.props(styles.trigger, popover.isOpen && styles.triggerOpen),
        )}>
        {label}
        <span
          {...stylex.props(
            styles.chevron,
            popover.isOpen && styles.chevronOpen,
          )}>
          {getIcon('chevronDown')}
        </span>
      </button>
      {popover.render(
        <div
          // role="group" — a mega menu is a browsing grid of links, not an
          // ARIA menu of menuitems (per the WAI-ARIA APG, the menu role is
          // for action menus; link mega menus are the documented anti-case).
          role="group"
          aria-label={label}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...stylex.props(styles.panelContainer)}>
          <div {...stylex.props(styles.panelContent)}>
            {/* Menu items section */}
            {items != null && (
              <div {...stylex.props(styles.menuWrapper)}>
                <Grid columns={2} gap={2}>
                  {items}
                </Grid>
              </div>
            )}

            {/* Featured section */}
            {featured != null && (
              <div {...stylex.props(styles.featured)}>{featured}</div>
            )}
          </div>
        </div>,
        {
          placement: 'below',
          alignment: slot,
          xstyle: styles.panelAnimation,
        },
      )}
    </>
  );
}

// =============================================================================
// DrawerMegaMenu — mobile drawer inline collapsible mode
// =============================================================================

function DrawerMegaMenu({
  label,
  items,
  featured,
}: Pick<TopNavMegaMenuProps, 'label' | 'items' | 'featured'>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const menuId = `mega-menu-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div {...stylex.props(styles.drawerSection)}>
      {/* Header toggle — same pattern as TopNavMenu drawer */}
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        aria-expanded={isExpanded}
        aria-controls={`${menuId}-items`}
        {...mergeProps(
          themeProps('top-nav-mega-menu', {mode: 'drawer'}),
          stylex.props(navItemStyles.item, styles.drawerHeader),
        )}>
        {label}
        <span
          {...stylex.props(
            styles.drawerChevron,
            isExpanded && styles.drawerChevronExpanded,
          )}>
          {getIcon('chevronDown')}
        </span>
      </button>

      {/* Animated expand/collapse container */}
      <div
        id={`${menuId}-items`}
        {...stylex.props(
          styles.drawerItems,
          isExpanded && styles.drawerItemsExpanded,
        )}>
        <div {...stylex.props(styles.drawerItemsInner)}>
          {/* Items render themselves in drawer mode via TopNavRenderContext */}
          {items}

          {/* Featured card */}
          {featured != null && (
            <div {...stylex.props(styles.drawerFeatured)}>{featured}</div>
          )}
        </div>
      </div>
    </div>
  );
}
