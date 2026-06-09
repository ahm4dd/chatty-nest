import { JwtService } from '@nestjs/jwt';
import { DomainEventsPublisher } from '../../../../app/events/domain-events-publisher.service';
import type { DrizzleDb, Tx } from '../../../../app/database/types';
import { Account } from '../../domain/aggregates/account.aggregate';
import type { Session } from '../../domain/entities/session.entity';
import type { UsersRepositoryPort } from '../ports/users.repository.port';
import type { AccountsRepositoryPort } from '../ports/accounts.repository.port';
import type { SessionsRepositoryPort } from '../ports/sessions.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import { AuthService } from './auth.service';

describe('AuthService refresh sessions', () => {
  const appConfig = {
    NODE_ENV: 'test',
    PORT: 3000,
    JWT_PUBLIC_KEY: 'public-key',
    JWT_PRIVATE_KEY: 'private-key',
    JWT_EXPIRATION: 3600,
    JWT_REFRESH_EXPIRES_IN: '7d',
  } as const;

  function createService() {
    const db = {
      transaction: jest.fn(async <T>(callback: (tx: Tx) => Promise<T>) =>
        callback({} as Tx),
      ),
    } as unknown as DrizzleDb;

    const usersRepository = {
      save: jest.fn(async (user) => user),
      findById: jest.fn(),
      exists: jest.fn(),
      existsAndActive: jest.fn(),
    } as unknown as jest.Mocked<UsersRepositoryPort>;

    const accountsRepository = {
      save: jest.fn(async () => undefined),
      findById: jest.fn(),
      findByProvider: jest.fn(),
      findByUserId: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn(),
    } as unknown as jest.Mocked<AccountsRepositoryPort>;

    const sessionsRepository = {
      save: jest.fn(async () => undefined),
      findById: jest.fn(),
      findByRefreshTokenHash: jest.fn(),
      findActiveByUserId: jest.fn(),
      delete: jest.fn(),
      deleteAllByUserId: jest.fn(),
    } as unknown as jest.Mocked<SessionsRepositoryPort>;

    const passwordHasher = {
      hash: jest.fn(async () => 'password-hash'),
      verify: jest.fn(),
    } as unknown as jest.Mocked<PasswordHasher>;

    const jwtService = {
      sign: jest.fn(() => 'access-token'),
    } as unknown as JwtService;

    const domainEventsPublisher = {
      publishEventsForAggregate: jest.fn(async () => undefined),
    } as unknown as DomainEventsPublisher;

    const service = new AuthService(
      db,
      usersRepository,
      accountsRepository,
      sessionsRepository,
      passwordHasher,
      jwtService,
      appConfig,
      domainEventsPublisher,
    );

    return {
      service,
      accountsRepository,
      sessionsRepository,
    };
  }

  it('stores only a hash of the generated refresh token on register', async () => {
    const { service, accountsRepository, sessionsRepository } = createService();
    accountsRepository.findByProvider.mockResolvedValue(null);

    const result = await service.register('USER@example.com', 'password123', 'User');

    const savedSession = sessionsRepository.save.mock.calls[0]?.[0] as
      | Session
      | undefined;
    expect(result.refreshToken).toBeDefined();
    expect(savedSession?.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(savedSession?.refreshTokenHash).not.toBe(result.refreshToken);
  });

  it('looks up logout sessions by refresh token hash', async () => {
    const { service, sessionsRepository } = createService();
    sessionsRepository.findByRefreshTokenHash.mockResolvedValue(null);

    await service.logout('raw-refresh-token');

    expect(sessionsRepository.findByRefreshTokenHash).toHaveBeenCalledWith(
      '0881b36898a91d864edaf39d2b2bd5801d5f873e3142a9ec5b3b574c4f6b51e5',
    );
  });

  it('verifies email password accounts without non-null assertions', async () => {
    const { service, accountsRepository, sessionsRepository } = createService();
    const account = Account.createEmailIdentity(
      'account-id',
      'user-id',
      'user@example.com',
      'stored-hash',
    );
    accountsRepository.findByProvider.mockResolvedValue(account);
    accountsRepository.findByUserId.mockResolvedValue([account]);
    sessionsRepository.deleteAllByUserId.mockResolvedValue(1);

    await expect(
      service.changePassword('user-id', 'old-password', 'new-password'),
    ).rejects.toMatchObject({
      response: { message: 'Current password is incorrect' },
    });
  });
});
