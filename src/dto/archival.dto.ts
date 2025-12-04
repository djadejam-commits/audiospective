// src/dto/archival.dto.ts

/**
 * Archival status types
 */
export type ArchivalStatus = 'success' | 'skipped' | 'failed';

/**
 * Archival failure types
 */
export type FailureType = 'AUTH' | 'NETWORK' | 'UNKNOWN';

/**
 * Archival result response
 */
export interface ArchivalResult {
  status: ArchivalStatus;
  songsArchived?: number;
  reason?: string;
  error?: string;
}

/**
 * Batch archival response
 */
export interface BatchArchivalResponse {
  totalUsers: number;
  successful: number;
  failed: number;
  skipped: number;
  results: {
    userId: string;
    status: ArchivalStatus;
    songsArchived?: number;
    error?: string;
  }[];
}
