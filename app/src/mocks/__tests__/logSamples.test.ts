import samples from '../logSamples.json';

describe('logSamples.json', () => {
  it('contains representative fixtures with required fields', () => {
    expect(Array.isArray(samples)).toBe(true);
    for (const entry of samples) {
      expect(entry.id).toMatch(/^log-/);
      expect(typeof entry.timestamp).toBe('string');
      expect(entry.message.length).toBeGreaterThan(5);
      expect(entry.level).toBeDefined();
      expect(entry.service).toBeDefined();
      expect(entry.attributes).toBeDefined();
    }
  });
});
