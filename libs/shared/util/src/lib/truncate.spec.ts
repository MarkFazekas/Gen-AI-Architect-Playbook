import { truncate } from './truncate';

describe('truncate', () => {
  it('keeps a text that fits', () => {
    expect(truncate('Short text', 20)).toBe('Short text');
  });

  it('cuts a long text and adds an ellipsis', () => {
    expect(truncate('A rather long description', 10)).toBe('A rather…');
  });

  it('never exceeds the maximum length', () => {
    expect(truncate('A rather long description', 10).length).toBeLessThanOrEqual(10);
  });
});
