import type { Tx } from '../../../../app/database/types';

export interface BanStatus {
  isBanned: boolean;
  reason: string | null;
  expiresAt: Date | null;
}

export interface BanStatusQueryPort {
  getBanStatus(userId: string, tx?: Tx): Promise<BanStatus>;
}
