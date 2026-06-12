import type { BanLogEntryDto } from './ban-log-entry.dto';

export interface BanActionResponseDto {
  userId: string;
  isBanned: true;
  ban: BanLogEntryDto;
  alreadyBanned: boolean;
}
