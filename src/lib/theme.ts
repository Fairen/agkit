/**
 * agkit brand theme — charte graphique v3.0 ("Monolithe Modulaire").
 *
 * A single source of truth for the CLI's visual identity: the neon gradient
 * (Electric Indigo → Cyber Purple → Neon Pink) on Dark Code Black, rendered
 * with 24-bit truecolor ANSI. Everything degrades to plain text when colors
 * are unsupported (piped output, NO_COLOR, dumb terminals) via picocolors'
 * `isColorSupported`, so scripts and CI stay clean.
 */
import pc from "picocolors";

type RGB = readonly [number, number, number];

/** Official palette (see charte.md §2). RGB triples for truecolor output. */
export const PALETTE = {
  /** #6366f1 — Electric Indigo · execution start, cold borders. */
  indigo: [99, 102, 241],
  /** #a855f7 — Cyber Purple · gradient transition. */
  purple: [168, 85, 247],
  /** #ec4899 — Neon Pink / Fuchsia · active cursor, living light. */
  pink: [236, 72, 153],
  /** #0B0F19 — Dark Code Black · backgrounds. */
  black: [11, 15, 25],
  /** #121826 — Shadow Grey · internal cube faces, contrast zones. */
  grey: [18, 24, 38],
} as const satisfies Record<string, RGB>;

/** Gradient stops, in order, matching the SVG `brandGrad` (indigo→purple→pink). */
const STOPS = [PALETTE.indigo, PALETTE.purple, PALETTE.pink] as const;
const FIRST: RGB = PALETTE.indigo;
const LAST: RGB = PALETTE.pink;

const enabled = pc.isColorSupported;

const fg = ([r, g, b]: RGB, s: string): string =>
  `\x1b[38;2;${r};${g};${b}m${s}\x1b[39m`;

const bg = ([r, g, b]: RGB, s: string): string =>
  `\x1b[48;2;${r};${g};${b}m${s}\x1b[49m`;

const lerp = (a: number, b: number, t: number): number =>
  Math.round(a + (b - a) * t);

/** Interpolate the brand gradient at position `t` in [0, 1]. */
function sample(t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t));
  const span = STOPS.length - 1;
  const scaled = clamped * span;
  const i = Math.min(Math.floor(scaled), span - 1);
  const local = scaled - i;
  const [r1, g1, b1] = STOPS[i] ?? FIRST;
  const [r2, g2, b2] = STOPS[i + 1] ?? LAST;
  return [lerp(r1, r2, local), lerp(g1, g2, local), lerp(b1, b2, local)];
}

/** Solid brand accents — the three gradient stops as standalone colorizers. */
export const indigo = (s: string): string =>
  enabled ? fg(PALETTE.indigo, s) : s;
export const purple = (s: string): string =>
  enabled ? fg(PALETTE.purple, s) : s;
export const pink = (s: string): string => (enabled ? fg(PALETTE.pink, s) : s);

/** Muted metadata text (Shadow Grey reads too dark; use picocolors dim). */
export const muted = (s: string): string => (enabled ? pc.dim(s) : s);

/** Matches SGR escape sequences (colors, bold, …) so they pass through intact. */
const ANSI_RE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");

/**
 * Paint `text` across the neon gradient, one step per visible character.
 * ANSI escape sequences already present in `text` (e.g. a `pc.bold(...)`
 * wrapper) are passed through untouched, not consumed as paintable glyphs —
 * each per-char color resets only the foreground (`\x1b[39m`), so an outer
 * bold/dim stays active across the span.
 */
export function gradient(text: string): string {
  if (!enabled) return text;
  type Token = { ansi: boolean; value: string };
  const tokens: Token[] = [];
  let last = 0;
  for (const m of text.matchAll(ANSI_RE)) {
    for (const ch of text.slice(last, m.index)) {
      tokens.push({ ansi: false, value: ch });
    }
    tokens.push({ ansi: true, value: m[0] });
    last = m.index + m[0].length;
  }
  for (const ch of text.slice(last)) tokens.push({ ansi: false, value: ch });

  const paintable = tokens.filter((t) => !t.ansi && t.value !== " ").length;
  if (paintable <= 1) {
    return tokens
      .map((t) => (t.ansi || t.value === " " ? t.value : fg(FIRST, t.value)))
      .join("");
  }
  let i = 0;
  let out = "";
  for (const t of tokens) {
    if (t.ansi || t.value === " ") {
      out += t.value;
      continue;
    }
    out += fg(sample(i / (paintable - 1)), t.value);
    i++;
  }
  return out;
}

/**
 * The brand tag used for `p.intro(...)` — a gradient wordmark preceded by the
 * terminal-prompt glyph and trailed by the pink cursor from the logo, echoing
 * the CLI-box metaphor. `label` is the sub-command (e.g. "agkit init").
 */
export function banner(label: string): string {
  if (!enabled) return `${label} _`;
  return `${indigo(pc.bold("›"))} ${gradient(pc.bold(label))} ${pink(pc.bold("_"))}`;
}

/**
 * Compact isometric "monolith" logo for `--help`. Renders the cube from the
 * charte (top lid + two shaded faces) with the CLI chevron `>` and cursor `_`,
 * beside the gradient wordmark and tagline. Falls back to a plain wordmark.
 */
export function logo(): string {
  if (!enabled) {
    return "agkit — AGent marketplace KIT\nOne canonical catalog → every AI coding agent → any Git forge.\n";
  }
  const top = indigo("◢◣");
  const g1 = gradient("▛▀▜");
  const g2 = gradient("▙▄▟");
  const word = gradient(pc.bold("agkit"));
  const chevron = pink(pc.bold("›_"));
  const tag = pc.bold("AGent marketplace KIT");
  const sub = muted(
    "One canonical catalog → every AI coding agent → any Git forge.",
  );
  return [
    `   ${top}`,
    `  ${g1}    ${word}  ${chevron}`,
    `  ${g2}    ${muted(tag)}`,
    "",
    `  ${sub}`,
    "",
  ].join("\n");
}

/** Semantic status colors — conventional green/red, kept for scanability. */
export const success = (s: string): string => (enabled ? pc.green(s) : s);
export const error = (s: string): string => (enabled ? pc.red(s) : s);

/** Re-export the raw helpers for one-off custom styling. */
export const paint = { fg, bg, sample };
