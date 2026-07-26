/**
 * Normalize messy AI / LLM markdown before rendering.
 * Handles literal <br>, escaped newlines, whole-document fences, etc.
 */

/** Replace literal `\n` / `\r\n` outside fenced code blocks. */
function unescapeNewlinesOutsideFences(source: string): string {
  const parts = source.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part) => {
      if (part.startsWith('```')) return part;
      return part
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');
    })
    .join('');
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

  // Collapse 3+ blank lines → 2 (keeps paragraph breaks, trims spam)
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/** Alias matching “formatter/parser” naming in product code. */
export const formatMarkdown = preprocessAiMarkdown;
