import { buildLuceneQuery, parseLuceneQuery, validateLuceneQuery } from '../lucene';

describe('validateLuceneQuery', () => {
  it('detects empty query', () => {
    expect(validateLuceneQuery('')).toContain('Query cannot be empty.');
  });

  it('detects unbalanced parentheses and quotes', () => {
    const errors = validateLuceneQuery('((field:"value)');
    expect(errors).toContain('Unbalanced parentheses detected.');
    expect(errors).toContain('Unmatched quotes detected.');
  });

  it('returns no errors for valid query', () => {
    expect(validateLuceneQuery('service:"payments" AND level:"ERROR"')).toHaveLength(0);
  });
});

describe('parseLuceneQuery / buildLuceneQuery', () => {
  it('round trips simple clauses', () => {
    const parsed = parseLuceneQuery('service:"payments" AND level:"ERROR"');
    expect(parsed.operator).toBe('AND');
    expect(parsed.clauses).toHaveLength(2);
    const rebuilt = buildLuceneQuery(parsed.clauses, parsed.operator);
    expect(rebuilt).toBe('service:"payments" AND level:"ERROR"');
  });

  it('parses contains and not exists clauses', () => {
    const parsed = parseLuceneQuery('message:*timeout* OR NOT _exists_:trace_id');
    expect(parsed.operator).toBe('OR');
    expect(parsed.clauses[0].comparator).toBe('contains');
    expect(parsed.clauses[1].comparator).toBe('not_exists');
  });

  it('builds query from clauses', () => {
    const clauses = [
      { id: '1', field: 'service', comparator: 'is' as const, value: 'payments' },
      { id: '2', field: 'level', comparator: 'is_not' as const, value: 'DEBUG' },
    ];
    expect(buildLuceneQuery(clauses, 'AND')).toBe('service:"payments" AND NOT level:"DEBUG"');
  });
});
