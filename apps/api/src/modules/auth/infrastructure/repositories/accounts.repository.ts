import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { accounts } from '@chatty-nest/database';
import { DB_TOKEN, type DrizzleDb } from '../../../../app/database/types';
import { Account } from '../../domain/aggregates/account.aggregate';
import type { AuthProvider } from '../../domain/value-objects/auth-provider.vo';
import type { AccountsRepositoryPort } from '../../application/ports/accounts.repository.port';

@Injectable()
export class AccountsRepositoryImpl implements AccountsRepositoryPort {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async save(account: Account): Promise<void> {
    const data = {
      id: account.id,
      userId: account.userId,
      providerId: account.providerId,
      accountId: account.accountId,
      passwordHash: account.passwordHash,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
      refreshTokenExpiresAt: account.refreshTokenExpiresAt,
      idToken: account.idToken,
      scope: account.scope,
      updatedAt: account.updatedAt,
    };

    const existing = await this.findById(account.id);

    if (existing) {
      await this.db.update(accounts).set(data).where(eq(accounts.id, account.id));
    } else {
      await this.db.insert(accounts).values({
        ...data,
        createdAt: account.createdAt,
      });
    }
  }

  async findById(id: string): Promise<Account | null> {
    const [record] = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    if (!record) return null;
    return this.toDomain(record);
  }

  async findByProvider(providerId: AuthProvider, accountId: string): Promise<Account | null> {
    const [record] = await this.db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.providerId, providerId),
          eq(accounts.accountId, accountId.toLowerCase()),
        ),
      )
      .limit(1);

    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUserId(userId: string): Promise<Account[]> {
    const records = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));

    return records.map((record) => this.toDomain(record));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(accounts).where(eq(accounts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.db.delete(accounts).where(eq(accounts.userId, userId));
    return result.rowCount ?? 0;
  }

  private toDomain(record: typeof accounts.$inferSelect): Account {
    return Account.reconstitute({
      id: record.id,
      userId: record.userId,
      providerId: record.providerId as AuthProvider,
      accountId: record.accountId,
      passwordHash: record.passwordHash,
      accessToken: record.accessToken,
      refreshToken: record.refreshToken,
      accessTokenExpiresAt: record.accessTokenExpiresAt,
      refreshTokenExpiresAt: record.refreshTokenExpiresAt,
      idToken: record.idToken,
      scope: record.scope,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
