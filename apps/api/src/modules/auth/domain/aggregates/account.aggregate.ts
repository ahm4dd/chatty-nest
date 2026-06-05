import { AggregateRoot } from '../../../../shared-kernal/domain/aggregates/root.aggregate';
import type { AuthProvider } from '../value-objects/auth-provider.vo';
import { AccountCreatedEvent } from '../events/account-created.event';

export interface AccountReconstitutionRecord {
  id: string;
  userId: string;
  providerId: AuthProvider;
  accountId: string;
  passwordHash: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  idToken: string | null;
  scope: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Account extends AggregateRoot {
  readonly #id: string;
  readonly #userId: string;
  readonly #providerId: AuthProvider;
  readonly #accountId: string;
  #passwordHash: string | null;
  #accessToken: string | null;
  #refreshToken: string | null;
  #accessTokenExpiresAt: Date | null;
  #refreshTokenExpiresAt: Date | null;
  #idToken: string | null;
  #scope: string | null;
  readonly #createdAt: Date;
  #updatedAt: Date;

  private constructor(props: {
    id: string;
    userId: string;
    providerId: AuthProvider;
    accountId: string;
    passwordHash: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiresAt: Date | null;
    refreshTokenExpiresAt: Date | null;
    idToken: string | null;
    scope: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    this.#id = props.id;
    this.#userId = props.userId;
    this.#providerId = props.providerId;
    this.#accountId = props.accountId;
    this.#passwordHash = props.passwordHash;
    this.#accessToken = props.accessToken;
    this.#refreshToken = props.refreshToken;
    this.#accessTokenExpiresAt = props.accessTokenExpiresAt;
    this.#refreshTokenExpiresAt = props.refreshTokenExpiresAt;
    this.#idToken = props.idToken;
    this.#scope = props.scope;
    this.#createdAt = props.createdAt;
    this.#updatedAt = props.updatedAt;
  }

  static createEmailIdentity(
    id: string,
    userId: string,
    email: string,
    passwordHash: string,
  ): Account {
    const now = new Date();
    const account = new Account({
      id,
      userId,
      providerId: 'email',
      accountId: email.toLowerCase(),
      passwordHash,
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      idToken: null,
      scope: null,
      createdAt: now,
      updatedAt: now,
    });

    account.addEvent(
      new AccountCreatedEvent(id, userId, 'email', email.toLowerCase()),
    );

    return account;
  }

  static createOAuthIdentity(
    id: string,
    userId: string,
    providerId: AuthProvider,
    accountId: string,
    accessToken?: string,
    refreshToken?: string,
    accessTokenExpiresAt?: Date,
    refreshTokenExpiresAt?: Date,
    idToken?: string,
    scope?: string,
  ): Account {
    const now = new Date();
    const account = new Account({
      id,
      userId,
      providerId,
      accountId,
      passwordHash: null,
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      accessTokenExpiresAt: accessTokenExpiresAt ?? null,
      refreshTokenExpiresAt: refreshTokenExpiresAt ?? null,
      idToken: idToken ?? null,
      scope: scope ?? null,
      createdAt: now,
      updatedAt: now,
    });

    account.addEvent(
      new AccountCreatedEvent(id, userId, providerId, accountId),
    );

    return account;
  }

  static reconstitute(record: AccountReconstitutionRecord): Account {
    return new Account({
      id: record.id,
      userId: record.userId,
      providerId: record.providerId,
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

  changePassword(newPasswordHash: string): void {
    if (this.#providerId !== 'email') {
      throw new Error('Password change is only supported for email authentication');
    }
    if (!this.#passwordHash) {
      throw new Error('Cannot change password on an account with no existing password');
    }
    this.#passwordHash = newPasswordHash;
    this.#updatedAt = new Date();
  }

  hasPassword(): boolean {
    return this.#passwordHash !== null;
  }

  updateTokens(data: {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: Date;
    refreshTokenExpiresAt?: Date;
    idToken?: string;
    scope?: string;
  }): void {
    if (data.accessToken !== undefined) this.#accessToken = data.accessToken;
    if (data.refreshToken !== undefined) this.#refreshToken = data.refreshToken;
    if (data.accessTokenExpiresAt !== undefined) this.#accessTokenExpiresAt = data.accessTokenExpiresAt;
    if (data.refreshTokenExpiresAt !== undefined) this.#refreshTokenExpiresAt = data.refreshTokenExpiresAt;
    if (data.idToken !== undefined) this.#idToken = data.idToken;
    if (data.scope !== undefined) this.#scope = data.scope;
    this.#updatedAt = new Date();
  }

  get requiresPassword(): boolean {
    return this.#providerId === 'email';
  }

  get id(): string {
    return this.#id;
  }

  get userId(): string {
    return this.#userId;
  }

  get providerId(): AuthProvider {
    return this.#providerId;
  }

  get accountId(): string {
    return this.#accountId;
  }

  get passwordHash(): string | null {
    return this.#passwordHash;
  }

  get accessToken(): string | null {
    return this.#accessToken;
  }

  get refreshToken(): string | null {
    return this.#refreshToken;
  }

  get accessTokenExpiresAt(): Date | null {
    return this.#accessTokenExpiresAt;
  }

  get refreshTokenExpiresAt(): Date | null {
    return this.#refreshTokenExpiresAt;
  }

  get idToken(): string | null {
    return this.#idToken;
  }

  get scope(): string | null {
    return this.#scope;
  }

  get createdAt(): Date {
    return this.#createdAt;
  }

  get updatedAt(): Date {
    return this.#updatedAt;
  }
}
