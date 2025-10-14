/**
 * Common types used across the application
 */

export interface TenantContext {
  tenantId?: string;
}

export interface AuthorInfo {
  author?: string;
}

export interface TaggedEntity {
  tags?: string[];
}

export interface TimestampedEntity {
  timestamp?: string;
}

export interface VersionedEntity {
  version?: string;
}

export type TimeRange = {
  start: number;
  end: number;
  step?: number;
};