import type { Account } from '../../domain/aggregates/account.aggregate';
import type { AuthProvider } from '../../domain/value-objects/auth-provider.vo';

export interface AccountsRepositoryPort {
  save(account: Account): Promise<void>;
  findById(id: string): Promise<Account | null>;
  findByProvider(providerId: AuthProvider, accountId: string): Promise<Account | null>;
  findByUserId(userId: string): Promise<Account[]>;
  delete(id: string): Promise<boolean>;
  deleteAllByUserId(userId: string): Promise<number>;
}
