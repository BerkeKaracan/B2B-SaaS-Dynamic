/**
 * Normalize messy AI / LLM markdown before rendering.
 * Handles literal <br>, escaped newlines, whole-document fences,
 * missing blank lines around headings / lists / bold section labels.
 */

/** Map over non-fenced segments so code blocks stay untouched. */
function mapOutsideFences(
  source: string,
  transform: (segment: string) => string
): string {
  const parts = source.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part) => (part.startsWith('```') ? part : transform(part)))
    .join('');
}

/** Replace literal `\n` / `\r\n` outside fenced code blocks. */
function unescapeNewlinesOutsideFences(source: string): string {
  return mapOutsideFences(source, (part) =>
    part
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
  );
}

/** Whole-line bold label: `**Completed**` or `**Title:** value`. */
const BOLD_LINE =
  /^\*\*[^*\n]+?\*\*(?:\s*:)?[^\n]*$/;

/**
 * Ensure GFM-friendly blank lines around ATX headings, bold section
 * labels, and list blocks. Models often emit collapsed structure like:
 *   **Title:** *
 *   **Completed**
 *   - item
 * without the blank lines GFM needs to keep fields / sections separate.
 */
function ensureBlockSpacing(source: string): string {
  return mapOutsideFences(source, (part) => {
    let text = part;

    // Blank line before ATX heading when previous char isn't already a blank line
    text = text.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

    // Blank line after ATX heading when next line is non-empty content
    text = text.replace(/(^|\n)(#{1,6}[^\n]*?)\n(?!\n|$)/g, '$1$2\n\n');

    // Separate consecutive bold field / section lines so they don't merge
    // into one GFM paragraph (**Title:** *\n**Date:** * → blank between).
    text = text.replace(
      /^(\*\*[^*\n]+?\*\*[^\n]*)\n(?=\*\*[^*\n]+?\*\*)/gm,
      '$1\n\n'
    );

    // Blank line after a bold-only section header before non-blank content
    // (**Completed**\n- item → **Completed**\n\n- item)
    text = text.replace(
      /^(\*\*[^*\n]+?\*\*)\s*\n(?!\n)(?=\S)/gm,
      '$1\n\n'
    );

    // Blank line before a list that follows a non-list, non-blank line
    text = text.replace(
      /([^\n])\n((?:[-*+]|\d+[.)])\s+)/g,
      (match, prev: string, listStart: string, offset: number, full: string) => {
        const before = full.slice(0, offset);
        const prevLine = before.split('\n').pop() ?? '';
        if (/^\s*(?:[-*+]|\d+[.)])\s+/.test(prevLine)) return match;
        if (/^\s*$/.test(prevLine)) return match;
        return `${prev}\n\n${listStart}`;
      }
    );

    // Blank line before a bold section/field line that follows a list item
    text = text.replace(
      /([^\n])\n(\*\*[^*\n]+?\*\*[^\n]*)/g,
      (match, prev: string, boldLine: string, offset: number, full: string) => {
        const before = full.slice(0, offset);
        const prevLine = before.split('\n').pop() ?? '';
        if (/^\s*$/.test(prevLine)) return match;
        if (!BOLD_LINE.test(boldLine.trim())) return match;
        if (BOLD_LINE.test(prevLine.trim())) return match; // already handled above
        return `${prev}\n\n${boldLine}`;
      }
    );

    return text;
  });
}

/**
 * Pure formatter: take raw model text → clean GFM-friendly markdown string.
 * Safe to call from server or client; does not render HTML.
 */
export function preprocessAiMarkdown(input: string | null | undefined): string {
  if (input == null) return '';

  let text = String(input);

  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  text = text.replace(/\u2028|\u2029/g, '\n');

  // Strip BOM / zero-width noise AIs sometimes emit
  text = text.replace(/^\uFEFF/, '').replace(/\u200B/g, '');

  // Entire reply wrapped in a single ```markdown ... ``` fence
  const trimmed = text.trim();
  const wholeFence = trimmed.match(
    /^```(?:markdown|md|gfm|text)?\s*\n([\s\S]*?)\n```$/i
  );
  if (wholeFence) {
    text = wholeFence[1];
  }

  // Literal HTML line breaks (common LLM habit) → markdown newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/&lt;br\s*\/?&gt;/gi, '\n');

  // Other noisy HTML line / paragraph tags models paste as text
  text = text.replace(/<\/?p>/gi, '\n');
  text = text.replace(/&lt;\/?p&gt;/gi, '\n');

  // Unescape \n outside code fences
  text = unescapeNewlinesOutsideFences(text);

  // Structural spacing for headings / bold labels / lists
  text = ensureBlockSpacing(text);

  // Collapse 3+ blank lines → 2 (keeps paragraph breaks, trims spam)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/** Alias matching “formatter/parser” naming in product code. */
export const formatMarkdown = preprocessAiMarkdown;
