import type { Tx } from '../../../../app/database/types';
import type { Session } from '../../domain/entities/session.entity';

export interface SessionsRepositoryPort {
  save(session: Session, tx?: Tx): Promise<void>;
  findById(id: string, tx?: Tx): Promise<Session | null>;
  findByToken(token: string, tx?: Tx): Promise<Session | null>;
  findActiveByUserId(userId: string): Promise<Session[]>;
  delete(id: string, tx?: Tx): Promise<boolean>;
  deleteAllByUserId(userId: string, tx?: Tx): Promise<number>;
}
