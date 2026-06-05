import type { Tx } from '../../../../app/database/types';
import type { Account } from '../../domain/aggregates/account.aggregate';
import type { AuthProvider } from '../../domain/value-objects/auth-provider.vo';

export interface AccountsRepositoryPort {
  save(account: Account, tx?: Tx): Promise<void>;
  findById(id: string, tx?: Tx): Promise<Account | null>;
  findByProvider(providerId: AuthProvider, accountId: string, tx?: Tx): Promise<Account | null>;
  findByUserId(userId: string): Promise<Account[]>;
  delete(id: string, tx?: Tx): Promise<boolean>;
  deleteAllByUserId(userId: string, tx?: Tx): Promise<number>;
}
