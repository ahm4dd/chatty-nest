import type { BanLogEntryDto } from './ban-log-entry.dto';

export interface BanStatusResponseDto {
  userId: string;
  isBanned: boolean;
  activeBan: BanLogEntryDto | null;
  history: BanLogEntryDto[];
}
