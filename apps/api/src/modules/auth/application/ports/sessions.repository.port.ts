import type { Session } from '../../domain/entities/session.entity';

export interface SessionsRepositoryPort {
  save(session: Session): Promise<void>;
  findById(id: string): Promise<Session | null>;
  findByToken(token: string): Promise<Session | null>;
  findActiveByUserId(userId: string): Promise<Session[]>;
  delete(id: string): Promise<boolean>;
  deleteAllByUserId(userId: string): Promise<number>;
}
