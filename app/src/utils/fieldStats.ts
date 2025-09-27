import { dateTime } from '@grafana/data';
import type { FieldStat, LogDocument } from '../types/discover';

function normaliseValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value as string | number | boolean;
}

const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function detectType(value: unknown): FieldStat['type'] {
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'string' && ISO_LIKE.test(value)) {
    const parsed = dateTime(value);
    if (parsed.isValid()) {
      return 'date';
    }
  }
  return 'string';
}

export function buildFieldStats(documents: LogDocument[]): FieldStat[] {
  const statsMap = new Map<string, FieldStat>();

  for (const doc of documents) {
    for (const [key, value] of Object.entries({
      level: doc.level,
      service: doc.service,
      tenant: doc.tenant,
      traceId: doc.traceId,
      spanId: doc.spanId,
      ...doc.attributes,
    })) {
      if (value === undefined) {
        continue;
      }
      const current = statsMap.get(key);
      const normalised = normaliseValue(value);
      if (!current) {
        statsMap.set(key, {
          name: key,
          type: detectType(value),
          count: 1,
          examples: [normalised],
        });
        continue;
      }
      current.count += 1;
      if (!current.examples.includes(normalised)) {
        current.examples = [...current.examples, normalised].slice(0, 5);
      }
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => b.count - a.count);
}

export function filterFieldStats(
  stats: FieldStat[],
  search: string,
  sort: 'count' | 'alpha'
): FieldStat[] {
  const filtered = search
    ? stats.filter((stat) => stat.name.toLowerCase().includes(search.toLowerCase()))
    : stats;

  if (sort === 'alpha') {
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }

  return [...filtered].sort((a, b) => b.count - a.count);
}

export interface ValueDistribution {
  value: string;
  count: number;
  percentage: number;
}

export function calculateValueDistribution(
  documents: LogDocument[],
  field: string
): ValueDistribution[] {
  const histogram = new Map<string, number>();
  let total = 0;

  for (const doc of documents) {
    const attributes = doc.attributes as Record<string, unknown>;
    const fallback = doc as unknown as Record<string, unknown>;
    const value = attributes[field] ?? fallback[field];
    if (value === undefined) {
      continue;
    }
    const key = String(normaliseValue(value));
    histogram.set(key, (histogram.get(key) ?? 0) + 1);
    total += 1;
  }

  return Array.from(histogram.entries())
    .map(([value, count]) => ({
      value,
      count,
      percentage: total ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}
