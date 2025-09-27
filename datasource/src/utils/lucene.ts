export type LuceneComparator = 'is' | 'is_not' | 'contains' | 'exists' | 'not_exists';

export interface LuceneClause {
  id: string;
  field: string;
  comparator: LuceneComparator;
  value?: string;
}

export interface ParsedLuceneQuery {
  clauses: LuceneClause[];
  operator: 'AND' | 'OR';
}

const DEFAULT_OPERATOR: ParsedLuceneQuery['operator'] = 'AND';

export function validateLuceneQuery(query: string): string[] {
  const errors: string[] = [];
  const trimmed = query.trim();
  if (!trimmed) {
    errors.push('Query cannot be empty.');
  }

  let depth = 0;
  for (const char of trimmed) {
    if (char === '(') {
      depth += 1;
    }
    if (char === ')') {
      depth -= 1;
      if (depth < 0) {
        errors.push('Unbalanced parentheses detected.');
        depth = 0;
        break;
      }
    }
  }
  if (depth > 0) {
    errors.push('Unbalanced parentheses detected.');
  }

  const quoteCount = (trimmed.match(/"/g) ?? []).length;
  if (quoteCount % 2 !== 0) {
    errors.push('Unmatched quotes detected.');
  }

  return Array.from(new Set(errors));
}

export function parseLuceneQuery(query: string): ParsedLuceneQuery {
  const trimmed = query.trim();
  if (!trimmed) {
    return { clauses: [], operator: DEFAULT_OPERATOR };
  }

  const operator: ParsedLuceneQuery['operator'] = trimmed.includes(' OR ') ? 'OR' : DEFAULT_OPERATOR;
  const clauses = extractClauses(trimmed)
    .map((match, index) => parseClause(match, index.toString()))
    .filter((clause): clause is LuceneClause => clause !== null);
  return { clauses, operator };
}

const CLAUSE_PATTERN = /(NOT\s+)?_exists_:(\w+)|(NOT\s+)?([A-Za-z0-9_.-]+):(\"([^\"]*)\"|\*([^*]+)\*|([^\s]+))/g;

function extractClauses(query: string): RegExpMatchArray[] {
  return Array.from(query.matchAll(CLAUSE_PATTERN));
}

function parseClause(match: RegExpMatchArray, id: string): LuceneClause | null {
  const whole = match[0].trim();

  if (whole.startsWith('NOT _exists_:')) {
    const field = whole.replace('NOT _exists_:', '').replace(/\s+/g, '');
    return { id, field, comparator: 'not_exists' };
  }

  if (whole.startsWith('_exists_:')) {
    const field = whole.replace('_exists_:', '').replace(/\s+/g, '');
    return { id, field, comparator: 'exists' };
  }

  const negated = Boolean(match[3]);
  const field = (match[4] ?? '').trim();
  if (!field) {
    return null;
  }

  const quotedValue = match[6];
  const containsValue = match[7];
  const bareValue = match[8];

  if (containsValue) {
    return {
      id,
      field,
      comparator: negated ? 'is_not' : 'contains',
      value: containsValue,
    };
  }

  if (quotedValue !== undefined) {
    return {
      id,
      field,
      comparator: negated ? 'is_not' : 'is',
      value: quotedValue,
    };
  }

  return {
    id,
    field,
    comparator: negated ? 'is_not' : 'is',
    value: bareValue,
  };
}

export function buildLuceneQuery(clauses: LuceneClause[], operator: 'AND' | 'OR'): string {
  if (!clauses.length) {
    return '';
  }

  const segments = clauses
    .filter((clause) => clause.field)
    .map((clause) => clauseToString(clause))
    .filter((segment): segment is string => segment !== null);

  return segments.join(` ${operator} `);
}

function clauseToString(clause: LuceneClause): string | null {
  switch (clause.comparator) {
    case 'exists':
      return `_exists_:${clause.field}`;
    case 'not_exists':
      return `NOT _exists_:${clause.field}`;
    case 'contains':
      return `${clause.field}:*${(clause.value ?? '').trim()}*`;
    case 'is_not':
      return `NOT ${clause.field}:"${(clause.value ?? '').trim()}"`;
    case 'is':
    default:
      return clause.value ? `${clause.field}:"${clause.value.trim()}"` : null;
  }
}

export function generateClauseId(prefix = 'clause'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
