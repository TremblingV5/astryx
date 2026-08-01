// Copyright (c) Meta Platforms, Inc. and affiliates.

'use client';

import {Fragment, type ReactNode} from 'react';
import * as stylex from '@stylexjs/stylex';
import {Code} from '@astryxdesign/core/CodeBlock';

const TOKEN = /(`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
const CODE_SPAN = /`([^`]+)`/g;

const styles = stylex.create({
  link: {
    color: 'var(--color-text-accent)',
    textDecorationLine: 'underline',
    textDecorationThickness: '1px',
    textUnderlineOffset: '0.16em',
    transition: 'color 120ms ease, text-decoration-color 120ms ease',
    ':hover': {
      '@media (hover: hover)': {
        color: 'var(--color-accent)',
        textDecorationThickness: '2px',
      },
    },
    ':focus-visible': {
      borderRadius: 'var(--radius-sm)',
      outline: '2px solid var(--color-accent)',
      outlineOffset: 2,
    },
  },
});

// Render the label of a markdown link, expanding any `code` spans into
// <Code> components so that [`code`](href) renders as monospace text.
function renderLinkLabel(label: string, baseKey: number): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let i = 0;
  CODE_SPAN.lastIndex = 0;
  while ((match = CODE_SPAN.exec(label)) !== null) {
    if (match.index > lastIndex) {
      parts.push(label.slice(lastIndex, match.index));
    }
    parts.push(<Code key={`${baseKey}-code-${i++}`}>{match[1]}</Code>);
    lastIndex = match.index + match[0].length;
  }
  if (parts.length === 0) {
    // No code spans found; render the label as plain text.
    return label;
  }
  if (lastIndex < label.length) {
    parts.push(label.slice(lastIndex));
  }
  return parts;
}

function renderLink(label: string, href: string, key: number): ReactNode {
  const isExternal = /^https?:\/\//.test(href);
  return (
    <a
      key={key}
      href={href}
      rel={isExternal ? 'noreferrer' : undefined}
      target={isExternal ? '_blank' : undefined}
      {...stylex.props(styles.link)}>
      {renderLinkLabel(label, key)}
    </a>
  );
}

// Render a small inline markdown subset for authored docs: code spans and links.
export function renderInlineMarkdown(text: string) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  TOKEN.lastIndex = 0;
  while ((match = TOKEN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const code = match[2];
    const linkLabel = match[3];
    const linkHref = match[4];
    if (code != null) {
      nodes.push(<Code key={match.index}>{code}</Code>);
    } else if (linkLabel != null && linkHref != null) {
      nodes.push(renderLink(linkLabel, linkHref, match.index));
    }

    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.map((node, i) => <Fragment key={i}>{node}</Fragment>);
}
