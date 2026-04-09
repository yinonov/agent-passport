import type { MemoryItem, MemoryCategory, ReviewDecision } from '@agent-passport/schema';

// ---------------------------------------------------------------------------
// ANSI helpers — zero dependencies
// ---------------------------------------------------------------------------

const ESC = '\x1b[';
const RESET = `${ESC}0m`;

export function bold(text: string): string {
  return `${ESC}1m${text}${RESET}`;
}

export function dim(text: string): string {
  return `${ESC}2m${text}${RESET}`;
}

export function green(text: string): string {
  return `${ESC}32m${text}${RESET}`;
}

export function red(text: string): string {
  return `${ESC}31m${text}${RESET}`;
}

export function yellow(text: string): string {
  return `${ESC}33m${text}${RESET}`;
}

export function blue(text: string): string {
  return `${ESC}34m${text}${RESET}`;
}

export function purple(text: string): string {
  return `${ESC}35m${text}${RESET}`;
}

// ---------------------------------------------------------------------------
// Composite helpers
// ---------------------------------------------------------------------------

export function heading(text: string): string {
  return `${ESC}1m${ESC}4m${ESC}35m${text}${RESET}`;
}

export function success(text: string): string {
  return `${green('✔')} ${text}`;
}

export function error(text: string): string {
  return `${red('✖')} ${text}`;
}

export function warn(text: string): string {
  return `${yellow('⚠')} ${text}`;
}

// ---------------------------------------------------------------------------
// Category badge colors
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<MemoryCategory, (t: string) => string> = {
  PROFILE: blue,
  PREFERENCE: purple,
  PROJECT: green,
  TASK: yellow,
  DECISION: red,
  PERSON: blue,
  CONSTRAINT: red,
  RECURRING: yellow,
};

const STATE_COLORS: Record<ReviewDecision, (t: string) => string> = {
  APPROVED: green,
  REJECTED: red,
  EDITED: yellow,
  PENDING: dim,
};

// ---------------------------------------------------------------------------
// Memory formatting
// ---------------------------------------------------------------------------

export function formatMemory(item: MemoryItem): string {
  const colorCat = CATEGORY_COLORS[item.category] ?? dim;
  const colorState = STATE_COLORS[item.reviewState] ?? dim;

  const idShort = item.id.slice(0, 8);
  const badge = colorCat(`[${item.category}]`);
  const state = colorState(item.reviewState);
  const ts = dim(item.timestamp);
  const tags = item.tags.length > 0 ? dim(` tags: ${item.tags.join(', ')}`) : '';

  return [
    `${dim(idShort)}  ${badge}  ${state}`,
    `  ${item.content}`,
    `  ${ts}  ${dim(`source: ${item.source}`)}${tags}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Simple table formatter
// ---------------------------------------------------------------------------

export function formatTable(rows: string[][]): string {
  if (rows.length === 0) return '';

  // Compute max width for each column (strip ANSI for measurement)
  const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
  const colCount = Math.max(...rows.map((r) => r.length));
  const widths: number[] = Array.from({ length: colCount }, () => 0);

  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      widths[i] = Math.max(widths[i], stripAnsi(row[i]).length);
    }
  }

  return rows
    .map((row) =>
      row
        .map((cell, i) => {
          const visible = stripAnsi(cell).length;
          const pad = widths[i] - visible;
          return cell + ' '.repeat(Math.max(pad, 0));
        })
        .join('  '),
    )
    .join('\n');
}
