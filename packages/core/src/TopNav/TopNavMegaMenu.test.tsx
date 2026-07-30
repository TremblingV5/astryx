// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * @file TopNavMegaMenu.test.tsx
 * @input Uses vitest, @testing-library/react, TopNavMegaMenu and sub-components
 * @output Unit tests for TopNavMegaMenu slots API and mobile modes
 * @position Testing; validates TopNavMegaMenu behavior
 *
 * SYNC: When TopNavMegaMenu changes, update tests to match new behavior
 */

import {describe, it, expect, vi, beforeAll, afterAll, afterEach} from 'vitest';
import {render, screen, act, fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {TopNavMegaMenu} from './TopNavMegaMenu';
import {TopNavMegaMenuItem} from './TopNavMegaMenuItem';
import {TopNavRenderContext} from './TopNavRenderContext';

// =============================================================================
// Popover API mock — jsdom implements no Popover API, so default-mode tests
// that actually open/close the panel install these shims on HTMLElement.
// =============================================================================

let originalMatches: typeof HTMLElement.prototype.matches;

function installPopoverApiMock() {
  originalMatches = HTMLElement.prototype.matches;
  HTMLElement.prototype.showPopover = vi.fn(function (this: HTMLElement) {
    this.setAttribute('popover-open', '');
    const event = new Event('toggle', {bubbles: false});
    Object.defineProperty(event, 'newState', {value: 'open'});
    this.dispatchEvent(event);
  });
  HTMLElement.prototype.hidePopover = vi.fn(function (this: HTMLElement) {
    this.removeAttribute('popover-open');
    const event = new Event('toggle', {bubbles: false});
    Object.defineProperty(event, 'newState', {value: 'closed'});
    this.dispatchEvent(event);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLElement.prototype as any).matches = function (
    selector: string,
  ): boolean {
    if (selector === ':popover-open') {
      return this.hasAttribute('popover-open');
    }
    return originalMatches.call(this, selector);
  };
}

function restorePopoverApiMock() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLElement.prototype as any).matches = originalMatches;
}

// =============================================================================
// Default (desktop) mode
// =============================================================================

describe('TopNavMegaMenu — default mode', () => {
  it('renders the trigger button with label', () => {
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );
    expect(screen.getByRole('button', {name: 'Products'})).toBeInTheDocument();
  });

  it('trigger has aria-haspopup and aria-expanded attributes', () => {
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );
    const trigger = screen.getByRole('button', {name: 'Products'});
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders with multiple menu items', () => {
    render(
      <TopNavMegaMenu
        label="Products"
        items={
          <>
            <TopNavMegaMenuItem title="Analytics" href="/analytics" />
            <TopNavMegaMenuItem title="Reports" href="/reports" />
          </>
        }
      />,
    );
    expect(screen.getByRole('button', {name: 'Products'})).toBeInTheDocument();
  });

  it('renders with featured content', () => {
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
        featured={<span data-testid="featured">Featured content</span>}
      />,
    );
    expect(screen.getByRole('button', {name: 'Products'})).toBeInTheDocument();
  });

  it('renders without items or featured', () => {
    render(<TopNavMegaMenu label="Empty" />);
    expect(screen.getByRole('button', {name: 'Empty'})).toBeInTheDocument();
  });
});

// =============================================================================
// Popup semantics (default mode)
// =============================================================================

describe('TopNavMegaMenu — popup semantics', () => {
  beforeAll(installPopoverApiMock);
  afterAll(restorePopoverApiMock);

  it('trigger aria-controls resolves to the popup element', async () => {
    const user = userEvent.setup();
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );

    const trigger = screen.getByRole('button', {name: 'Products'});
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // aria-controls must be present and point at the real popup element.
    const controlsId = trigger.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    const popup = document.getElementById(controlsId as string);
    expect(popup).not.toBeNull();

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // The referenced element is the popup that contains the panel content.
    expect(popup).toContainElement(
      screen.getByRole('group', {name: 'Products', hidden: true}),
    );
  });

  it('does not wrap the panel in a role="dialog" aria-modal element', async () => {
    const user = userEvent.setup();
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );

    await user.click(screen.getByRole('button', {name: 'Products'}));

    // Focus stays on the trigger while the panel is open, so a modal dialog
    // wrapper would tell assistive tech the focused control is inert.
    expect(
      screen.queryByRole('dialog', {hidden: true}),
    ).not.toBeInTheDocument();
    expect(document.querySelector('[aria-modal="true"]')).toBeNull();
  });

  it('does not expose role="menu" — a link grid is not an ARIA menu', async () => {
    const user = userEvent.setup();
    render(
      <TopNavMegaMenu
        label="Products"
        items={
          <>
            <TopNavMegaMenuItem title="Analytics" href="/analytics" />
            <TopNavMegaMenuItem title="Reports" href="/reports" />
          </>
        }
      />,
    );

    await user.click(screen.getByRole('button', {name: 'Products'}));

    // Per the WAI-ARIA APG, mega menu panels of navigation links must not use
    // the menu role (reserved for action menus with menuitem children).
    expect(screen.queryByRole('menu', {hidden: true})).not.toBeInTheDocument();
    expect(screen.queryAllByRole('menuitem', {hidden: true})).toHaveLength(0);
  });

  it('exposes the panel as a labeled group', async () => {
    const user = userEvent.setup();
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );

    await user.click(screen.getByRole('button', {name: 'Products'}));

    expect(
      screen.getByRole('group', {name: 'Products', hidden: true}),
    ).toBeInTheDocument();
  });

  it('keeps item links with accessible names inside the panel', async () => {
    const user = userEvent.setup();
    render(
      <TopNavMegaMenu
        label="Products"
        items={
          <>
            <TopNavMegaMenuItem title="Analytics" href="/analytics" />
            <TopNavMegaMenuItem title="Reports" href="/reports" />
          </>
        }
      />,
    );

    await user.click(screen.getByRole('button', {name: 'Products'}));

    const analytics = screen.getByRole('link', {
      name: /Analytics/,
      hidden: true,
    });
    expect(analytics).toHaveAttribute('href', '/analytics');
    expect(
      screen.getByRole('link', {name: /Reports/, hidden: true}),
    ).toHaveAttribute('href', '/reports');
  });
});

// =============================================================================
// Hover → click guard (default mode) — issue #3121
//
// The trigger opens on hover and on click. A hover-open records a timestamp so
// the click that naturally follows a hover is ignored for CLICK_GUARD_MS (the
// panel just appeared under the cursor) instead of toggling it shut. Deliberate
// clicks — outside that window, or with no preceding hover — still toggle.
// =============================================================================

describe('TopNavMegaMenu — hover/click guard (default mode)', () => {
  beforeAll(installPopoverApiMock);
  afterAll(restorePopoverApiMock);
  afterEach(() => {
    vi.useRealTimers();
  });

  function renderMenu() {
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );
    return screen.getByRole('button', {name: 'Products'});
  }

  it('keeps the panel open when a hover-open is immediately clicked', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    const trigger = renderMenu();

    // Hover opens the panel after the show delay (150ms).
    await user.hover(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // The click that naturally follows the hover must NOT toggle it shut.
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on a click that lands well after the hover-open (past the guard)', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    const trigger = renderMenu();

    await user.hover(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Past the guard window, a click is a deliberate dismissal.
    act(() => {
      vi.advanceTimersByTime(600);
    });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles cleanly for click-only interaction (no hover, no guard)', async () => {
    const user = userEvent.setup();
    const trigger = renderMenu();

    // A click with no preceding hover opens...
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // ...and the next click closes — the guard only applies after a hover-open.
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes a hover-opened (transient) panel when the pointer leaves', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    const trigger = renderMenu();

    await user.hover(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Leaving closes it after hideDelay (250ms) — hover opens are transient.
    await user.unhover(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps a click-opened (pinned) panel open when the pointer leaves', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    const trigger = renderMenu();

    // A click pins the panel open (a deliberate open should persist).
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.unhover(trigger);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('re-entering the trigger cancels a pending hide', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    const trigger = renderMenu();

    await user.hover(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Leave (schedules a hide), then return before hideDelay elapses.
    await user.unhover(trigger);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    await user.hover(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('re-hovering an open panel does not refresh the click guard', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    const trigger = renderMenu();

    await user.hover(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Wait past the guard window, re-hovering along the way. The re-hover must
    // NOT re-stamp the guard timestamp (only a fresh open may), so the click
    // below is still judged a deliberate close.
    act(() => {
      vi.advanceTimersByTime(600);
    });
    await user.hover(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

// =============================================================================
// Dismissal (default mode) — issue #3121
//
// The panel is a *manual* popover (no native light dismiss) so a pointerdown on
// the trigger can't close it before the click guard runs. Outside-click
// dismissal is reproduced explicitly and excludes the trigger.
// =============================================================================

describe('TopNavMegaMenu — dismissal (default mode)', () => {
  beforeAll(installPopoverApiMock);
  afterAll(restorePopoverApiMock);

  function renderAndOpen() {
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );
    return screen.getByRole('button', {name: 'Products'});
  }

  it('renders the panel as a manual popover (no native light dismiss)', () => {
    const trigger = renderAndOpen();
    const popup = document.getElementById(
      trigger.getAttribute('aria-controls') as string,
    );
    // popover="manual" is what stops the browser from light-dismissing the
    // panel on a pointerdown on the trigger (the real cause of #3121).
    expect(popup).toHaveAttribute('popover', 'manual');
  });

  it('does not dismiss when a pointerdown lands on the trigger', async () => {
    const user = userEvent.setup();
    const trigger = renderAndOpen();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // A pointerdown on the trigger must be ignored by the outside-dismiss
    // handler so the click guard can decide what the click means.
    act(() => {
      fireEvent.pointerDown(trigger);
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('dismisses when a pointerdown lands outside the trigger and panel', async () => {
    const user = userEvent.setup();
    const trigger = renderAndOpen();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    act(() => {
      fireEvent.pointerDown(document.body);
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});

// =============================================================================
// Keyboard (default mode) — issue #3121
//
// Keyboard activation always OPENS (never toggles the panel closed) and moves
// focus into the panel; Escape closes it and returns focus to the trigger.
// =============================================================================

describe('TopNavMegaMenu — keyboard (default mode)', () => {
  beforeAll(installPopoverApiMock);
  afterAll(restorePopoverApiMock);

  it('opens on Enter (keyboard activation)', async () => {
    const user = userEvent.setup();
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );
    const trigger = screen.getByRole('button', {name: 'Products'});
    trigger.focus();

    await user.keyboard('{Enter}');

    // aria-expanded is the observable signal. Enter also auto-focuses the first
    // link (unlike pointer/hover opens, which keep focus on the trigger), but
    // that focus landing is only verifiable in a real browser — jsdom renders
    // the popover content display:none, so activeElement can't move onto it
    // (browser-verified via the Playwright checks for #3121). Panel content
    // presence is deliberately NOT asserted: useLayer renders it into the DOM
    // even while closed, so such an assertion would be vacuous.
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens on Space', async () => {
    const user = userEvent.setup();
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );
    const trigger = screen.getByRole('button', {name: 'Products'});
    trigger.focus();

    await user.keyboard(' ');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('keyboard activation never toggles an open panel closed', async () => {
    const user = userEvent.setup();
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );
    const trigger = screen.getByRole('button', {name: 'Products'});

    // Open via pointer (focus stays on the trigger).
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Enter on an already-open panel keeps it open — no toggle-close.
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(
      <TopNavMegaMenu
        label="Products"
        items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
      />,
    );
    const trigger = screen.getByRole('button', {name: 'Products'});

    // Pointer open leaves focus on the trigger.
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });
});

// =============================================================================
// Mobile-bar mode — should be hidden
// =============================================================================

describe('TopNavMegaMenu — mobile-bar mode', () => {
  it('returns null in mobile-bar mode', () => {
    const {container} = render(
      <TopNavRenderContext value="mobile-bar">
        <TopNavMegaMenu
          label="Products"
          items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
        />
      </TopNavRenderContext>,
    );
    expect(container.innerHTML).toBe('');
  });
});

// =============================================================================
// Drawer mode — inline collapsible
// =============================================================================

describe('TopNavMegaMenu — drawer mode', () => {
  it('renders a collapsible trigger with label', () => {
    render(
      <TopNavRenderContext value="drawer">
        <TopNavMegaMenu
          label="Products"
          items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
        />
      </TopNavRenderContext>,
    );
    const trigger = screen.getByRole('button', {name: 'Products'});
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands to show items when tapped', async () => {
    const user = userEvent.setup();

    render(
      <TopNavRenderContext value="drawer">
        <TopNavMegaMenu
          label="Products"
          items={
            <>
              <TopNavMegaMenuItem title="Analytics" href="/analytics" />
              <TopNavMegaMenuItem title="Reports" href="/reports" />
            </>
          }
        />
      </TopNavRenderContext>,
    );

    const trigger = screen.getByRole('button', {name: 'Products'});
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('collapses when trigger is clicked again', async () => {
    const user = userEvent.setup();

    render(
      <TopNavRenderContext value="drawer">
        <TopNavMegaMenu
          label="Products"
          items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
        />
      </TopNavRenderContext>,
    );

    const trigger = screen.getByRole('button', {name: 'Products'});
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows item descriptions when provided', async () => {
    const user = userEvent.setup();

    render(
      <TopNavRenderContext value="drawer">
        <TopNavMegaMenu
          label="Products"
          items={
            <TopNavMegaMenuItem
              title="Analytics"
              description="Track behavior"
              href="/analytics"
            />
          }
        />
      </TopNavRenderContext>,
    );

    await user.click(screen.getByRole('button', {name: 'Products'}));

    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Track behavior')).toBeInTheDocument();
  });

  it('renders items as links when href is provided', async () => {
    const user = userEvent.setup();

    render(
      <TopNavRenderContext value="drawer">
        <TopNavMegaMenu
          label="Products"
          items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
        />
      </TopNavRenderContext>,
    );

    await user.click(screen.getByRole('button', {name: 'Products'}));

    const link = screen.getByRole('link', {name: 'Analytics'});
    expect(link).toHaveAttribute('href', '/analytics');
  });

  it('renders items as buttons when onClick is provided without href', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <TopNavRenderContext value="drawer">
        <TopNavMegaMenu
          label="Tools"
          items={<TopNavMegaMenuItem title="Export" onClick={handleClick} />}
        />
      </TopNavRenderContext>,
    );

    await user.click(screen.getByRole('button', {name: 'Tools'}));
    await user.click(screen.getByRole('button', {name: 'Export'}));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders featured content when expanded', async () => {
    const user = userEvent.setup();

    render(
      <TopNavRenderContext value="drawer">
        <TopNavMegaMenu
          label="Products"
          items={<TopNavMegaMenuItem title="Analytics" href="/analytics" />}
          featured={<span>Featured: New AI Tools</span>}
        />
      </TopNavRenderContext>,
    );

    await user.click(screen.getByRole('button', {name: 'Products'}));

    expect(screen.getByText('Featured: New AI Tools')).toBeInTheDocument();
  });
});

// =============================================================================
// TopNavMegaMenuItem — standalone rendering
// =============================================================================

describe('TopNavMegaMenuItem', () => {
  it('renders as a desktop item by default', () => {
    render(<TopNavMegaMenuItem title="Analytics" href="/analytics" />);
    expect(screen.getByRole('link', {name: /Analytics/})).toBeInTheDocument();
  });

  it('renders description in desktop mode', () => {
    render(
      <TopNavMegaMenuItem
        title="Analytics"
        description="Track behavior"
        href="/analytics"
      />,
    );
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Track behavior')).toBeInTheDocument();
  });

  it('renders as a drawer item in drawer context', () => {
    render(
      <TopNavRenderContext value="drawer">
        <TopNavMegaMenuItem title="Analytics" href="/analytics" />
      </TopNavRenderContext>,
    );
    expect(screen.getByRole('link', {name: /Analytics/})).toBeInTheDocument();
  });
});
