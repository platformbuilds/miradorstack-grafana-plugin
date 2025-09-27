import { documentsToCsv } from '../export';

describe('utils/export', () => {
  it('serializes documents to CSV including attributes', () => {
    const csv = documentsToCsv([
      {
        id: '1',
        timestamp: '2025-01-01T00:00:00Z',
        message: 'First entry',
        level: 'INFO',
        service: 'checkout',
        attributes: { env: 'prod', status: 200 },
      },
      {
        id: '2',
        timestamp: '2025-01-01T00:01:00Z',
        message: 'Second entry',
        level: 'ERROR',
        service: 'billing',
        attributes: { env: 'prod', error: 'timeout' },
      },
    ] as any);

    const lines = csv.split('\n');
    expect(lines[0]).toContain('env');
    expect(lines[1]).toContain('First entry');
    expect(lines[2]).toContain('timeout');
  });
});
