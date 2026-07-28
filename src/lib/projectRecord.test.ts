import { describe, expect, it } from 'vitest';
import {
  getProjectDisplayName,
  isMeaningfulProjectRecord,
} from './projectRecord';

describe('projectRecord', () => {
  it('prefers name, then title, then truncated description', () => {
    expect(
      getProjectDisplayName({ name: '  Alpha  ', title: 'Beta' }, 'id-1')
    ).toBe('Alpha');
    expect(getProjectDisplayName({ title: ' Beta ' }, 'id-1')).toBe('Beta');
    expect(
      getProjectDisplayName(
        {
          description:
            'This is a long description that should be truncated for display',
        },
        'id-1'
      )
    ).toBe('This is a long description that should be trunca...');
  });

  it('falls back to project id slice or Untitled', () => {
    expect(getProjectDisplayName({}, 'abcdefghijkl')).toBe('Project abcdefgh');
    expect(getProjectDisplayName({})).toBe('Untitled Project');
  });

  it('treats labeled, described, or blocked records as meaningful', () => {
    expect(isMeaningfulProjectRecord({ name: 'X' })).toBe(true);
    expect(isMeaningfulProjectRecord({ title: 'Y' })).toBe(true);
    expect(isMeaningfulProjectRecord({ description: 'Z' })).toBe(true);
    expect(
      isMeaningfulProjectRecord({
        blocks: [{ id: 'b1' } as never],
      })
    ).toBe(true);
    expect(isMeaningfulProjectRecord({})).toBe(false);
    expect(isMeaningfulProjectRecord({ name: '   ' })).toBe(false);
  });
});
