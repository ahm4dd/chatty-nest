import type { Tx } from '../../../../app/database/types';
import { User } from '../../domain/aggregates/user.aggregate';

export interface UsersRepositoryPort {
  save(user: User, tx?: Tx): Promise<User>;
  findById(id: string, tx?: Tx): Promise<User | null>;
  exists(id: string): Promise<boolean>;
}
