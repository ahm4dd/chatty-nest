import type { BanLogEntry } from '../../../domain/entities/ban-log-entry.entity';

export interface BanLogEntryDto {
  id: string;
  action: 'BANNED' | 'UNBANNED';
  reason: string | null;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export function toBanLogEntryDto(entry: BanLogEntry): BanLogEntryDto {
  return {
    id: entry.id,
    action: entry.action,
    reason: entry.reason,
    expiresAt: entry.expiresAt?.toISOString() ?? null,
    createdBy: entry.createdBy,
    createdAt: entry.createdAt.toISOString(),
  };
}
