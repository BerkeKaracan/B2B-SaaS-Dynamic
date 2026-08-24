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

  it('inserts blank lines around headings and lists', () => {
    const raw = [
      '- Hata ölçütleri',
      '## Uygulama',
      '- Gerçek dünya örnekleri',
      '## Sonuç ve Kaynaklar',
    ].join('\n');

    expect(preprocessAiMarkdown(raw)).toBe(
      [
        '- Hata ölçütleri',
        '',
        '## Uygulama',
        '',
        '- Gerçek dünya örnekleri',
        '',
        '## Sonuç ve Kaynaklar',
      ].join('\n')
    );
  });

  it('formats standup-style bold fields and sections', () => {
    const raw = [
      '**Title:** *',
      '**Date:** *',
      '**Completed**',
      '- *',
      '**In Progress**',
      '- *',
      '**Blockers**',
      '- *',
      '**Next Steps**',
      '- *',
    ].join('\n');

    expect(preprocessAiMarkdown(raw)).toBe(
      [
        '**Title:** *',
        '',
        '**Date:** *',
        '',
        '**Completed**',
        '',
        '- *',
        '',
        '**In Progress**',
        '',
        '- *',
        '',
        '**Blockers**',
        '',
        '- *',
        '',
        '**Next Steps**',
        '',
        '- *',
      ].join('\n')
    );
  });

  it('does not break consecutive list items or fenced code', () => {
    const raw = '- a\n- b\n```\n# not a heading\n- still code\n```';
    const out = preprocessAiMarkdown(raw);
    expect(out).toContain('- a\n- b');
    expect(out).toContain('```\n# not a heading\n- still code\n```');
  });
});
