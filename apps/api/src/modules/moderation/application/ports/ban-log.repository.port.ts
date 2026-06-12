import type { Tx } from '../../../../app/database/types';
import type { BanLogEntry } from '../../domain/entities/ban-log-entry.entity';

export interface BanLogRepositoryPort {
  save(entry: BanLogEntry, tx?: Tx): Promise<void>;

  findActiveBan(userId: string, tx?: Tx): Promise<BanLogEntry | null>;

  findHistory(userId: string, tx?: Tx): Promise<BanLogEntry[]>;
}
