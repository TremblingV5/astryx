// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

/**
 * @file Pagination.tsx
 * @input Uses React, StyleX, Button, Icon, Selector, Text; page number buttons delegate to Button.
 *   Reads i18n direction via useDirection() to flip the prev/next/first/last chevrons under RTL.
 *   The input variant uses the chevronsLeft/chevronsRight (first/last) icons.
 * @output Exports Pagination component, PaginationProps, PaginationVariant,
 *   PaginationValueUnit, PaginationState, PaginationSize types
 * @position Core implementation; consumed by index.ts, tested by Pagination.test.tsx
 *
 * SYNC: When modified, update these files to stay in sync:
 * - /packages/core/src/Pagination/Pagination.test.tsx (tests for new/changed behavior)
 * - /packages/core/src/Pagination/index.ts (exports if types change)
 * - /apps/storybook/stories/Pagination.stories.tsx (storybook stories)
 * - /packages/cli/templates/blocks/components/Pagination/ (showcase blocks)
 *
 * Last synced props: page, onChange, changeAction, totalItems, totalPages, hasMore,
 *   pageSize, pageSizeOptions, onPageSizeChange, variant, valueUnit, formatLabel,
 *   onRowNavigate, hasFirstLast, siblingCount, size, isDisabled, label, data-testid, xstyle
 */

import {useOptimistic, useState, useTransition} from 'react';
import type {ReactNode} from 'react';
import * as stylex from '@stylexjs/stylex';
import {
  borderVars,
  colorVars,
  fontWeightVars,
  radiusVars,
  sizeVars,
  spacingVars,
  durationVars,
  easeVars,
  typographyVars,
  typeScaleVars,
} from '../theme/tokens.stylex';
import {Button} from '../Button';
import {Icon} from '../Icon';
import {Selector} from '../Selector';
import {Text} from '../Text';
import {useAnnounce} from '../hooks/useAnnounce';
import {useListFocus} from '../hooks/useListFocus';
import {mergeProps} from '../utils';
import type {BaseProps} from '../BaseProps';
import {themeProps} from '../utils/themeProps';
import {useTranslator} from '../i18n/useTranslator';
import {useDirection} from '../i18n/useDirection';

// =============================================================================
// Types
// =============================================================================

/**
 * Extensible variant map for Pagination.
 *
 * Theme packages can add custom variants via TypeScript module augmentation:
 * @example
 * ```
 * declare module '@astryxdesign/core/Pagination' {
 *   interface PaginationVariantMap {
 *     'progress': true;
 *   }
 * }
 * ```
 */
export interface PaginationVariantMap {
  pages: true;
  count: true;
  compact: true;
  dots: true;
  input: true;
  none: true;
}

/** Visual variant controlling what appears between prev/next buttons.
 * Extensible via module augmentation of PaginationVariantMap.
 */
export type PaginationVariant = keyof PaginationVariantMap;

/**
 * What the editable input's number *means* in the `input` variant. This drives
 * navigation semantics only — the visible wording is controlled by
 * `formatLabel`.
 * - page: the value is a 1-based page number (default).
 * - row: the value is a 1-based row index; committing it navigates to the page
 *   that contains that row (computed from pageSize) and reports the row via
 *   onRowNavigate. Requires totalItems to resolve rows to pages.
 */
export type PaginationValueUnit = 'page' | 'row';

/**
 * Snapshot of pagination state passed to `formatLabel` in the `input` variant,
 * alongside the pre-wired editable input node. Everything a consumer needs to
 * word the label however they like — "Page [n] / N", "n–m of T rows", a
 * localized/RTL ordering, or a bare box.
 */
export interface PaginationState {
  /** Current 1-based page. */
  page: number;
  /** Total page count, or null when unknown (cursor/hasMore pagination). */
  pageCount: number | null;
  /** 1-based index of the first row on the current page. */
  rowStart: number;
  /** 1-based index of the last row on the current page (clamped to totalItems). */
  rowEnd: number;
  /** Total item count, or null when unknown. */
  totalItems: number | null;
  /** Items per page. */
  pageSize: number;
}

/** Size of the pagination controls. */
export type PaginationSize = 'sm' | 'md';

export interface PaginationProps extends Omit<
  BaseProps<HTMLElement>,
  'onChange'
> {
  /** Ref forwarded to the root element */
  ref?: React.Ref<HTMLElement>;
  // --- Core (required) ---
  /** Current page number (1-based). Page 1 is the first page. */
  page: number;
  /** Called when the page changes. */
  onChange: (page: number) => void;
  /**
   * Async action on page change. Fires after onChange.
   * Uses React transitions for built-in loading state.
   */
  changeAction?: (page: number) => void | Promise<void>;

  // --- Data shape (provide one) ---
  /**
   * Total number of items. Used to calculate page count.
   * Takes precedence over totalPages if both provided.
   */
  totalItems?: number;
  /**
   * Total number of pages. Use when you know page count but not item count.
   */
  totalPages?: number;
  /**
   * Whether more pages exist after the current one.
   * Use for cursor-based pagination where total is unknown.
   */
  hasMore?: boolean;

  // --- Page size ---
  /** Number of items per page. @default 10 */
  pageSize?: number;
  /** Available page size options. Shows a page size selector when provided. */
  pageSizeOptions?: number[];
  /** Called when the page size changes. */
  onPageSizeChange?: (pageSize: number) => void;

  // --- Display ---
  /**
   * Visual variant controlling what appears between prev/next buttons.
   * - pages: Page number buttons with ellipsis (default)
   * - count: "X–Y of Z" text
   * - compact: "Page X of Y" text
   * - dots: Dot indicators
   * - input: An editable number box. By default renders "Page [ n ] / N"
   *   (page unit) or "Row [ n ]" (row unit); pass `formatLabel` to control the
   *   wording. First/last double-chevron buttons flank prev/next by default
   *   (see hasFirstLast).
   * - none: Just prev/next buttons
   * @default 'pages'
   */
  variant?: PaginationVariant;
  /**
   * What the editable box's number means in the `input` variant.
   * - page: the box holds a 1-based page number (default).
   * - row: the box holds a 1-based row index; committing it navigates to the
   *   page containing that row (computed from pageSize) and fires
   *   onRowNavigate. Requires totalItems in `'row'` mode to resolve rows to
   *   pages.
   * @default 'page'
   */
  valueUnit?: PaginationValueUnit;
  /**
   * Customize the `input` variant's label wording. Receives the current
   * pagination `state` and the pre-wired editable `input` node, and returns the
   * full label layout — e.g. `"Page [n] / N"`, `"n–m of T rows"`, a localized
   * ordering, or a bare box. The default reproduces "Page [ n ] / N" (page
   * unit) and "Row [ n ]" (row unit), so most consumers never set this.
   */
  formatLabel?: (state: PaginationState, input: ReactNode) => ReactNode;
  /**
   * Called with the committed 1-based row index when the `input` variant uses
   * `valueUnit='row'`. Fires alongside onChange (which moves to the page
   * containing that row). No-op in page mode.
   */
  onRowNavigate?: (row: number) => void;
  /**
   * Whether to show first/last («/») double-chevron buttons flanking
   * prev/next. Only applies to the `input` variant; other variants ignore it.
   * The last button needs a known total — it is omitted when the page count is
   * unknown (cursor/hasMore pagination). @default true
   */
  hasFirstLast?: boolean;
  /**
   * Number of page buttons to show on each side of the current page.
   * Only applies when variant='pages'. @default 1
   */
  siblingCount?: number;
  /**
   * Size of the pagination controls.
   * @default 'md'
   */
  size?: PaginationSize;

  // --- Behavior ---
  /** Whether the component is disabled. @default false */
  isDisabled?: boolean;

  // --- Accessibility ---
  /**
   * Accessible label for the navigation landmark.
   * @default 'Pagination'
   */
  label?: string;

  // --- Standard Astryx ---
  /** Test ID for automated testing. */
  'data-testid'?: string;
}

// =============================================================================
// Styles
// =============================================================================

const styles = stylex.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacingVars['--spacing-4'],
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: spacingVars['--spacing-1'],
  },
  ellipsis: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: sizeVars['--size-element-md'],
    height: sizeVars['--size-element-md'],
    color: colorVars['--color-text-secondary'],
    fontSize: typeScaleVars['--text-label-size'],
    userSelect: 'none',
  },
  ellipsisSm: {
    minWidth: sizeVars['--size-element-sm'],
    height: sizeVars['--size-element-sm'],
    fontSize: typeScaleVars['--text-supporting-size'],
  },
  infoText: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  dotsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: spacingVars['--spacing-1'],
  },
  dot: {
    width: spacingVars['--spacing-2'],
    height: spacingVars['--spacing-2'],
    borderWidth: 0,
    borderStyle: 'none',
    padding: 0,
    borderRadius: '50%',
    backgroundColor: colorVars['--color-neutral'],
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: durationVars['--duration-fast'],
    transitionTimingFunction: easeVars['--ease-standard'],
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colorVars['--color-accent']}`,
    },
    outlineOffset: {
      default: '0',
      ':focus-visible': '2px',
    },
  },
  dotSm: {
    width: spacingVars['--spacing-1-5'],
    height: spacingVars['--spacing-1-5'],
  },
  dotActive: {
    backgroundColor: colorVars['--color-accent'],
  },
  dotDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  activePage: {
    backgroundColor: colorVars['--color-neutral'],
    fontWeight: fontWeightVars['--font-weight-medium'],
  },
  input: {
    width: sizeVars['--size-element-md'],
    height: sizeVars['--size-element-md'],
    textAlign: 'center',
    boxSizing: 'border-box',
    borderWidth: borderVars['--border-width'],
    borderStyle: 'solid',
    borderColor: {
      default: colorVars['--color-border-emphasized'],
      ':focus-visible': colorVars['--color-accent'],
    },
    borderRadius: radiusVars['--radius-element'],
    padding: 0,
    fontFamily: typographyVars['--font-family-body'],
    fontSize: {
      default: typeScaleVars['--text-label-size'],
      '@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-label-size']})`,
    },
    color: colorVars['--color-text-primary'],
    backgroundColor: colorVars['--color-background-surface'],
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colorVars['--color-accent']}`,
    },
    outlineOffset: {
      default: '0',
      ':focus-visible': '2px',
    },
  },
  inputSm: {
    width: sizeVars['--size-element-sm'],
    height: sizeVars['--size-element-sm'],
    fontSize: {
      default: typeScaleVars['--text-supporting-size'],
      '@media (pointer: coarse)': `max(1rem, ${typeScaleVars['--text-supporting-size']})`,
    },
  },
  inputDisabled: {
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  inputGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacingVars['--spacing-1'],
    whiteSpace: 'nowrap',
  },
  inputLabel: {
    color: colorVars['--color-text-secondary'],
    fontSize: typeScaleVars['--text-label-size'],
    userSelect: 'none',
  },
  inputLabelSm: {
    fontSize: typeScaleVars['--text-supporting-size'],
  },
  inputTotal: {
    color: colorVars['--color-text-secondary'],
    fontSize: typeScaleVars['--text-label-size'],
    userSelect: 'none',
  },
  inputTotalSm: {
    fontSize: typeScaleVars['--text-supporting-size'],
  },
  pageSizeSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: spacingVars['--spacing-2'],
  },
  pageSizeSelectorControl: {
    width: 80,
  },
  disabled: {
    opacity: 0.5,
    pointerEvents: 'none' as const,
  },
});

// =============================================================================
// Helpers
// =============================================================================

/**
 * Generates the range of page numbers to display, including ellipsis markers.
 * Returns an array of page numbers and '...' strings.
 *
 * @example
 * ```
 * generatePageRange(5, 10, 1) → [1, '...', 4, 5, 6, '...', 10]
 * generatePageRange(1, 10, 1) → [1, 2, 3, '...', 10]
 * generatePageRange(1, 5, 1)  → [1, 2, 3, 4, 5]
 * ```
 */
export function generatePageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
): (number | '...')[] {
  // Total page number slots (excluding ellipses):
  // first + last + current + 2*siblings = 3 + 2*siblings
  // With 2 potential ellipsis slots: 5 + 2*siblings
  const totalSlots = 5 + 2 * siblingCount;

  // If total pages fit within slots, show all pages
  if (totalPages <= totalSlots) {
    return Array.from({length: totalPages}, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    // Near the start: show more pages on the left
    const leftRange = 3 + 2 * siblingCount;
    const pages: (number | '...')[] = Array.from(
      {length: leftRange},
      (_, i) => i + 1,
    );
    pages.push('...', totalPages);
    return pages;
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    // Near the end: show more pages on the right
    const rightRange = 3 + 2 * siblingCount;
    const pages: (number | '...')[] = [1, '...'];
    for (let i = totalPages - rightRange + 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // In the middle: show ellipsis on both sides
  const pages: (number | '...')[] = [1, '...'];
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    pages.push(i);
  }
  pages.push('...', totalPages);
  return pages;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Standalone pagination controls for navigating through pages of content.
 *
 * Supports multiple display variants: page numbers, count text, compact text,
 * dot indicators, or minimal prev/next navigation. Works with known totals
 * or cursor-based pagination.
 *
 * @example
 * ```
 * <Pagination
 *   page={page}
 *   onChange={setPage}
 *   totalItems={200}
 *   pageSize={20}
 * />
 * ```
 */
export function Pagination({
  page,
  onChange,
  changeAction,
  totalItems,
  totalPages: totalPagesProp,
  hasMore,
  pageSize: pageSizeProp = 10,
  pageSizeOptions,
  onPageSizeChange,
  variant = 'pages',
  valueUnit = 'page',
  formatLabel,
  onRowNavigate,
  hasFirstLast = true,
  siblingCount = 1,
  size = 'md',
  isDisabled = false,
  label: labelFromProps,
  'data-testid': testId,
  xstyle,
  className,
  style,
  ref,
  ...rest
}: PaginationProps) {
  const [, startTransition] = useTransition();

  // Resolve system strings once per render. Prop overrides win.
  const t = useTranslator();
  const label = labelFromProps ?? t('@astryx.pagination.label');
  const previousLabel = t('@astryx.pagination.previous');
  const nextLabel = t('@astryx.pagination.next');
  const firstLabel = t('@astryx.pagination.first');
  const lastLabel = t('@astryx.pagination.last');

  // Directional icons: under RTL, the "previous"/"first" controls point right
  // and the "next"/"last" controls point left. aria-labels stay semantic.
  const direction = useDirection();
  const previousIcon = direction === 'rtl' ? 'chevronRight' : 'chevronLeft';
  const nextIcon = direction === 'rtl' ? 'chevronLeft' : 'chevronRight';
  const firstIcon = direction === 'rtl' ? 'chevronsRight' : 'chevronsLeft';
  const lastIcon = direction === 'rtl' ? 'chevronsLeft' : 'chevronsRight';
  const pageIndicatorsLabel = t('@astryx.pagination.pageIndicators');
  const itemsPerPageLabel = t('@astryx.pagination.itemsPerPage');
  const goToPageLabel = t('@astryx.pagination.goToPageInput');
  const inputLabelText =
    valueUnit === 'row'
      ? t('@astryx.pagination.rowLabel')
      : t('@astryx.pagination.pageLabel');

  // pageSize is typed as number, so 0, NaN, and negatives are valid at the
  // type level but yield Infinity/NaN page counts, and
  // Array.from({length: Infinity}) crashes the dots variant. Coerce to a
  // positive integer; non-finite values fall back to the default.
  const pageSize = Number.isFinite(pageSizeProp)
    ? Math.max(1, Math.floor(pageSizeProp))
    : 10;

  // Announce page changes politely (navigation-10). The controls carry no
  // live region, so page transitions were previously silent to screen readers.
  // Only user-driven changes go through handlePageChange, so initial mount is
  // never announced.
  const announce = useAnnounce();

  // Track the page optimistically so rapid prev/next clicks advance from the
  // in-flight target instead of stalling on the last committed page.
  const [optimisticPage, setOptimisticPage] = useOptimistic(page);

  // The `input` variant edits a raw string while the user types, mirroring
  // NumberInput/DateInput: null means "show the committed value", a string means
  // "show what the user is typing". Commit (Enter/blur) parses + clamps and
  // clears it; an invalid or empty commit reverts by clearing it too.
  const [pendingInput, setPendingInput] = useState<string | null>(null);

  // Roving-tabindex + arrow/Home/End keyboard nav for the dots variant, owned
  // by the shared useListFocus primitive (mirrors SegmentedControl). It stamps a
  // single tab stop across the dots and moves focus horizontally; selection
  // follows focus via handleDotsFocus so arrow keys move the active page.
  const {
    listRef: dotsListRef,
    handleKeyDown: handleDotsKeyDown,
    handleFocus: handleDotsRovingFocus,
  } = useListFocus<HTMLDivElement>({
    itemSelector: 'button',
    hasRovingTabIndex: true,
    wrap: true,
    orientation: 'horizontal',
  });

  // Compute pagination state
  const computedTotalPages =
    totalPagesProp ??
    (totalItems != null ? Math.ceil(totalItems / pageSize) : undefined);

  const hasPrevious = optimisticPage > 1;
  const hasNext =
    computedTotalPages != null
      ? optimisticPage < computedTotalPages
      : (hasMore ?? false);

  // Return null for empty state
  if (totalItems != null && totalItems <= 0) {
    return null;
  }
  if (computedTotalPages != null && computedTotalPages <= 0) {
    return null;
  }

  // Interruptible: re-clicking before the transition settles starts a fresh one
  // with the next optimistic page rather than being dropped, so there is no
  // re-entry guard.
  const handlePageChange = (newPage: number) => {
    if (isDisabled) {
      return;
    }
    // Keep onChange urgent so controlled page state updates in the same commit
    // as the click; only the optimistic indicator and changeAction defer.
    onChange(newPage);
    announce(
      computedTotalPages != null
        ? t('@astryx.pagination.pageOfTotal', {
            current: newPage,
            total: computedTotalPages,
          })
        : t('@astryx.pagination.pageAnnounce', {current: newPage}),
    );
    startTransition(async () => {
      setOptimisticPage(newPage);
      await changeAction?.(newPage);
    });
  };

  // Selection-follows-focus for the dots (APG radiogroup pattern): useListFocus
  // only *moves* focus, so when focus lands on a dot -- via arrow/Home/End, or a
  // click that focuses it -- we select that dot's page. handleDotsRovingFocus
  // keeps the roving tab stop in sync. The current page is skipped so tabbing
  // into the group is a no-op.
  const handleDotsFocus = (e: React.FocusEvent) => {
    handleDotsRovingFocus(e);
    if (isDisabled) {
      return;
    }
    const focused = (e.target as HTMLElement | null)?.closest<HTMLElement>(
      'button[data-page]',
    );
    if (!focused) {
      return;
    }
    const nextPage = Number(focused.dataset.page);
    if (Number.isFinite(nextPage) && nextPage !== optimisticPage) {
      handlePageChange(nextPage);
    }
  };

  const handlePrevious = () => {
    if (hasPrevious) {
      handlePageChange(optimisticPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      handlePageChange(optimisticPage + 1);
    }
  };

  const handleFirst = () => {
    if (hasPrevious) {
      handlePageChange(1);
    }
  };

  const handleLast = () => {
    if (hasNext && computedTotalPages != null) {
      handlePageChange(computedTotalPages);
    }
  };

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    onPageSizeChange?.(newSize);
    // Reset to page 1 when page size changes.
    handlePageChange(1);
  };

  // In `'row'` mode the box holds a 1-based row index; the page that contains
  // it is ceil(row / pageSize). Page mode is the identity mapping.
  const pageForRow = (row: number) => Math.ceil(row / pageSize);

  // The value currently shown in the input box: the page number, or the first
  // row of the current page in row mode. Committed value only — the pending
  // string shadows this while typing.
  const inputCommittedValue =
    valueUnit === 'row' ? (optimisticPage - 1) * pageSize + 1 : optimisticPage;

  // Parse + clamp a committed input to a 1-based row. Returns null when the
  // value is invalid (revert on commit). Page mode clamps to 1..totalPages;
  // row mode clamps to 1..totalItems. The bound the value maps to differs by
  // mode, but the shape (parse -> clamp -> null-on-invalid) is shared.
  const parseCommittedInput = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return null;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return null;
    }
    if (valueUnit === 'row') {
      return totalItems != null ? Math.min(parsed, totalItems) : null;
    }
    return computedTotalPages != null
      ? Math.min(parsed, computedTotalPages)
      : null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPendingInput(e.target.value);
  };

  // Commit on Enter/blur: parse, clamp, navigate; clear the pending string so
  // the box snaps back to the committed value (which reverts silently on an
  // invalid or empty entry). In row mode the committed value is a row index —
  // report it via onRowNavigate and move to the page that contains it.
  const commitInput = () => {
    if (pendingInput === null) {
      return;
    }
    const committed = isDisabled ? null : parseCommittedInput(pendingInput);
    if (committed !== null) {
      if (valueUnit === 'row') {
        onRowNavigate?.(committed);
      }
      const targetPage =
        valueUnit === 'row' ? pageForRow(committed) : committed;
      if (targetPage !== optimisticPage) {
        handlePageChange(targetPage);
      }
    }
    setPendingInput(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInput();
    } else if (e.key === 'Escape') {
      // Discard the in-progress edit without navigating.
      setPendingInput(null);
    }
  };

  // Item range for count display
  const rangeStart = (optimisticPage - 1) * pageSize + 1;
  const rangeEnd =
    totalItems != null
      ? Math.min(optimisticPage * pageSize, totalItems)
      : optimisticPage * pageSize;

  const buttonSize = size === 'sm' ? 'sm' : 'md';
  const isSm = size === 'sm';

  const renderIndicator = () => {
    switch (variant) {
      case 'pages': {
        if (computedTotalPages == null) {
          return null;
        }
        const pageRange = generatePageRange(
          optimisticPage,
          computedTotalPages,
          siblingCount,
        );
        return (
          <>
            {pageRange.map((item, index) => {
              if (item === '...') {
                const previousPage = pageRange[index - 1];
                const nextPage = pageRange[index + 1];
                return (
                  <span
                    key={`ellipsis-${previousPage}-${nextPage}`}
                    aria-hidden="true"
                    {...stylex.props(
                      styles.ellipsis,
                      isSm && styles.ellipsisSm,
                    )}>
                    …
                  </span>
                );
              }
              const isActive = item === optimisticPage;
              return (
                <Button
                  key={item}
                  label={t('@astryx.pagination.goToPage', {page: item})}
                  aria-label={t('@astryx.pagination.goToPage', {
                    page: item,
                  })}
                  variant="ghost"
                  size={buttonSize}
                  onClick={() => handlePageChange(item)}
                  isDisabled={isDisabled}
                  aria-current={isActive ? 'page' : undefined}
                  xstyle={isActive && styles.activePage}>
                  {item}
                </Button>
              );
            })}
          </>
        );
      }

      case 'count': {
        if (totalItems == null) {
          return null;
        }
        return (
          <span {...stylex.props(styles.infoText)}>
            <Text type="body" size="sm" color="secondary">
              {t('@astryx.pagination.count', {
                from: rangeStart,
                to: rangeEnd,
                total: totalItems,
              })}
            </Text>
          </span>
        );
      }

      case 'compact': {
        if (computedTotalPages == null) {
          return null;
        }
        return (
          <span {...stylex.props(styles.infoText)}>
            <Text type="body" size="sm" color="secondary">
              {t('@astryx.pagination.pageOfTotal', {
                current: optimisticPage,
                total: computedTotalPages,
              })}
            </Text>
          </span>
        );
      }

      case 'dots': {
        if (computedTotalPages == null) {
          return null;
        }

        return (
          <div
            ref={dotsListRef}
            {...stylex.props(styles.dotsContainer)}
            role="group"
            aria-label={pageIndicatorsLabel}
            onKeyDown={handleDotsKeyDown}
            onFocus={handleDotsFocus}>
            {Array.from({length: computedTotalPages}, (_, i) => {
              const isActive = i + 1 === optimisticPage;
              return (
                <button
                  key={i + 1}
                  type="button"
                  data-page={i + 1}
                  aria-label={t('@astryx.pagination.goToPage', {
                    page: i + 1,
                  })}
                  aria-current={isActive ? 'page' : undefined}
                  // The active dot is the single roving tab stop; useListFocus
                  // maintains it as focus and the active page move.
                  tabIndex={isActive ? 0 : -1}
                  // Selection is driven by focus (handleDotsFocus); clicking only
                  // needs to focus the dot, which some browsers (Safari) skip for
                  // buttons, so focus it explicitly.
                  onClick={e => e.currentTarget.focus()}
                  disabled={isDisabled}
                  {...mergeProps(
                    themeProps('pagination-dot', {
                      active: isActive ? 'active' : null,
                      size,
                    }),
                    stylex.props(
                      styles.dot,
                      isSm && styles.dotSm,
                      isActive && styles.dotActive,
                      isDisabled && styles.dotDisabled,
                    ),
                  )}
                />
              );
            })}
          </div>
        );
      }

      case 'input': {
        // The pre-wired editable box: consumers that pass `formatLabel` drop
        // this straight into whatever wording they want, without re-deriving
        // the value/commit plumbing.
        const inputNode = (
          <input
            type="text"
            inputMode="numeric"
            aria-label={goToPageLabel}
            value={pendingInput ?? String(inputCommittedValue)}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={commitInput}
            disabled={isDisabled}
            data-testid={testId != null ? `${testId}-input` : undefined}
            {...mergeProps(
              themeProps('pagination-input', {size}),
              stylex.props(
                styles.input,
                isSm && styles.inputSm,
                isDisabled && styles.inputDisabled,
              ),
            )}
          />
        );

        const paginationState: PaginationState = {
          page: optimisticPage,
          pageCount: computedTotalPages ?? null,
          rowStart: rangeStart,
          rowEnd: rangeEnd,
          totalItems: totalItems ?? null,
          pageSize,
        };

        // Default label wording: "Page [ n ] / N" (page unit) or "Row [ n ]"
        // (row unit). A consumer-provided `formatLabel` replaces this entirely.
        const labelContent = formatLabel ? (
          formatLabel(paginationState, inputNode)
        ) : (
          <>
            <span
              aria-hidden="true"
              {...mergeProps(
                themeProps('pagination-input-label', {size}),
                stylex.props(styles.inputLabel, isSm && styles.inputLabelSm),
              )}>
              {inputLabelText}
            </span>
            {inputNode}
            {valueUnit === 'page' && computedTotalPages != null && (
              <span
                {...mergeProps(
                  themeProps('pagination-input-total', {size}),
                  stylex.props(styles.inputTotal, isSm && styles.inputTotalSm),
                )}>
                {t('@astryx.pagination.ofTotalPages', {
                  total: computedTotalPages,
                })}
              </span>
            )}
          </>
        );

        return <span {...stylex.props(styles.inputGroup)}>{labelContent}</span>;
      }

      case 'none':
      default:
        return null;
    }
  };

  return (
    <nav
      ref={ref}
      {...mergeProps(
        themeProps('pagination', {variant, size}),
        stylex.props(styles.root, xstyle),
        className,
        style,
      )}
      {...rest}
      aria-label={label}
      data-testid={testId}>
      {pageSizeOptions != null && pageSizeOptions.length > 0 && (
        <div {...stylex.props(styles.pageSizeSelector)}>
          <div {...stylex.props(styles.pageSizeSelectorControl)}>
            <Selector
              label={itemsPerPageLabel}
              isLabelHidden
              options={pageSizeOptions.map(opt => String(opt))}
              value={String(pageSize)}
              onChange={handlePageSizeChange}
              size={buttonSize}
              isDisabled={isDisabled}
            />
          </div>
        </div>
      )}
      <div {...stylex.props(styles.controls)}>
        {hasFirstLast && variant === 'input' && computedTotalPages != null && (
          <Button
            label={firstLabel}
            variant="ghost"
            size={buttonSize}
            icon={<Icon icon={firstIcon} size={isSm ? 'sm' : 'md'} />}
            onClick={handleFirst}
            isDisabled={isDisabled || !hasPrevious}
            isIconOnly
          />
        )}

        <Button
          label={previousLabel}
          variant="ghost"
          size={buttonSize}
          icon={<Icon icon={previousIcon} size={isSm ? 'sm' : 'md'} />}
          onClick={handlePrevious}
          isDisabled={isDisabled || !hasPrevious}
          isIconOnly
        />

        {renderIndicator()}

        <Button
          label={nextLabel}
          variant="ghost"
          size={buttonSize}
          icon={<Icon icon={nextIcon} size={isSm ? 'sm' : 'md'} />}
          onClick={handleNext}
          isDisabled={isDisabled || !hasNext}
          isIconOnly
        />

        {hasFirstLast && variant === 'input' && computedTotalPages != null && (
          <Button
            label={lastLabel}
            variant="ghost"
            size={buttonSize}
            icon={<Icon icon={lastIcon} size={isSm ? 'sm' : 'md'} />}
            onClick={handleLast}
            isDisabled={isDisabled || !hasNext}
            isIconOnly
          />
        )}
      </div>
    </nav>
  );
}

Pagination.displayName = 'Pagination';
