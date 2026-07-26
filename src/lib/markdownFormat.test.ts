import { describe, expect, it } from 'vitest';
import { formatMarkdown, preprocessAiMarkdown } from './markdownFormat';

describe('preprocessAiMarkdown', () => {
  it('turns literal <br> tags into newlines', () => {
    expect(preprocessAiMarkdown('Hello<br>World<br/>!')).toBe(
      'Hello\nWorld\n!'
    );
  });

  it('decodes escaped &lt;br&gt; and unwraps markdown fences', () => {
    const raw = '```markdown\nA&lt;br&gt;B\n```';
    expect(preprocessAiMarkdown(raw)).toBe('A\nB');
  });

  it('unescapes \\n outside code fences only', () => {
    const raw = 'line1\\nline2\n```\nkeep\\nme\n```';
    expect(preprocessAiMarkdown(raw)).toContain('line1\nline2');
    expect(preprocessAiMarkdown(raw)).toContain('keep\\nme');
  });

  it('exposes formatMarkdown alias', () => {
    expect(formatMarkdown('x<br>y')).toBe('x\ny');
  });
});
