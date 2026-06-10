import { randomUUID } from 'node:crypto';

import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';

import { DB_TOKEN, type DrizzleDb, type Tx } from '../../../../app/database/types';
import { USERS_REPOSITORY_TOKEN } from '../ports/tokens';
import { ACCOUNTS_REPOSITORY_TOKEN } from '../ports/tokens';
import { SESSIONS_REPOSITORY_TOKEN } from '../ports/tokens';
import { PASSWORD_HASHER_TOKEN } from '../ports/tokens';
import type { UsersRepositoryPort } from '../ports/users.repository.port';
import type { AccountsRepositoryPort } from '../ports/accounts.repository.port';
import type { SessionsRepositoryPort } from '../ports/sessions.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import { User } from '../../domain/aggregates/user.aggregate';
import { Account } from '../../domain/aggregates/account.aggregate';
import { Session } from '../../domain/entities/session.entity';
import { DomainEventsPublisher } from '../../../../app/events/domain-events-publisher.service';
import appConfig, { type AppConfig } from '../../../../app/config/app.config';
import { parseExpiration } from '../../../../shared-kernal/application/utils/parse-expiration';
import { generateRefreshToken, hashRefreshToken } from '../utils/refresh-token';

interface DeviceContext {
  ipAddress?: string;
  userAgent?: string;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: RoleType;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(ACCOUNTS_REPOSITORY_TOKEN)
    private readonly accountsRepository: AccountsRepositoryPort,
    @Inject(SESSIONS_REPOSITORY_TOKEN)
    private readonly sessionsRepository: SessionsRepositoryPort,
    @Inject(PASSWORD_HASHER_TOKEN)
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    @Inject(appConfig.KEY)
    private readonly appConfig: AppConfig,
    private readonly domainEventsPublisher: DomainEventsPublisher,
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
    deviceContext?: DeviceContext,
  ): Promise<AuthResult> {
    const passwordHash = await this.passwordHasher.hash(password);

    const { user, userId, role, sessionId, refreshToken } = await this.db.transaction(async (tx) => {
      const existing = await this.accountsRepository.findByProvider('email', email, tx);
      if (existing) {
        throw new ConflictException({
          message: 'This email is already registered',
        });
      }

      const userId = randomUUID();
      const user = User.create({ id: userId, name, email });
      await this.usersRepository.save(user, tx);

      const accountId = randomUUID();
      const account = Account.createEmailIdentity(accountId, userId, email, passwordHash);
      await this.accountsRepository.save(account, tx);

      const session = await this.createSession(userId, deviceContext, tx);

      return { user, userId, role: user.role, sessionId: session.sessionId, refreshToken: session.refreshToken };
    });

    await this.domainEventsPublisher.publishEventsForAggregate(user);

    const accessToken = this.jwtService.sign({
      sub: userId,
      email,
      roles: [role],
      sessionId,
    });

    return { accessToken, refreshToken, user: { id: userId, email, role } };
  }

  async login(
    email: string,
    password: string,
    deviceContext?: DeviceContext,
  ): Promise<AuthResult> {
    const identity = await this.accountsRepository.findByProvider('email', email);
    if (!identity) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
      });
    }

    if (!identity.hasPassword()) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
      });
    }

    const passwordHash = identity.passwordHash;
    if (!passwordHash) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
      });
    }

    const isValid = await this.passwordHasher.verify(password, passwordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
      });
    }

    const user = await this.usersRepository.findById(identity.userId);
    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive()) {
      throw new UnauthorizedException({
        message: 'Account is banned',
      });
    }

    const { sessionId, refreshToken } = await this.createSession(user.id, deviceContext);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email,
      roles: [user.role],
      sessionId,
    });

    return { accessToken, refreshToken, user: { id: user.id, email, role: user.role } };
  }

  async rotateSession(refreshToken: string): Promise<AuthResult> {
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const { userId, email, role, sessionId, newRefreshToken } = await this.db.transaction(async (tx) => {
      const session = await this.sessionsRepository.findByRefreshTokenHash(refreshTokenHash, tx);
      if (!session?.isValid) {
        throw new UnauthorizedException({
          message: 'Invalid or expired refresh token',
        });
      }

      await this.sessionsRepository.delete(session.id, tx);

      const user = await this.usersRepository.findById(session.userId, tx);
      if (!user) {
        throw new UnauthorizedException({
          message: 'User not found',
        });
      }

      if (!user.isActive()) {
        throw new UnauthorizedException({
          message: 'Account is banned',
        });
      }

      const newSession = await this.createSession(user.id, undefined, tx);

      return { userId: user.id, email: user.email, role: user.role, sessionId: newSession.sessionId, newRefreshToken: newSession.refreshToken };
    });

    const accessToken = this.jwtService.sign({
      sub: userId,
      email,
      roles: [role],
      sessionId,
    });

    return { accessToken, refreshToken: newRefreshToken, user: { id: userId, email, role } };
  }

  async logout(refreshToken: string): Promise<boolean> {
    const session = await this.sessionsRepository.findByRefreshTokenHash(
      hashRefreshToken(refreshToken),
    );
    if (!session) return false;
    return this.sessionsRepository.delete(session.id);
  }

  async revokeAllSessions(userId: string): Promise<number> {
    return this.sessionsRepository.deleteAllByUserId(userId);
  }

  async revokeSession(
    sessionId: string,
    userId: string,
    currentSessionId: string,
  ) {
    if (sessionId === currentSessionId) {
      return { success: false, message: 'Cannot revoke the current session; use logout instead' };
    }

    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found or insufficient permissions' };
    }

    if (!session.belongsToUser(userId)) {
      return { success: false, message: 'Session not found or insufficient permissions' };
    }

    const deleted = await this.sessionsRepository.delete(sessionId);
    return { success: deleted, message: deleted ? 'Session revoked' : 'Revocation failed' };
  }

  async getSession(sessionId: string, userId: string, email: string, role: RoleType) {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new UnauthorizedException({
        message: 'Session not found or has expired',
      });
    }

    if (!session.belongsToUser(userId)) {
      throw new UnauthorizedException({
        message: 'Session not found or has expired',
      });
    }

    return {
      user: { id: userId, email, role },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
    };
  }

  async listSessions(userId: string, currentSessionId: string) {
    const sessions = await this.sessionsRepository.findActiveByUserId(userId);
    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === currentSessionId,
      })),
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const identities = await this.accountsRepository.findByUserId(userId);
    const emailIdentity = identities.find((i) => i.providerId === 'email');
    if (!emailIdentity) {
      throw new UnauthorizedException({
        message: 'No email authentication method found',
      });
    }

    if (!emailIdentity.hasPassword()) {
      throw new UnauthorizedException({
        message: 'Current password is incorrect',
      });
    }

    const currentPasswordHash = emailIdentity.passwordHash;
    if (!currentPasswordHash) {
      throw new UnauthorizedException({
        message: 'Current password is incorrect',
      });
    }

    const isValid = await this.passwordHasher.verify(currentPassword, currentPasswordHash);
    if (!isValid) {
      throw new UnauthorizedException({
        message: 'Current password is incorrect',
      });
    }

    const newPasswordHash = await this.passwordHasher.hash(newPassword);

    await this.db.transaction(async (tx) => {
      emailIdentity.changePassword(newPasswordHash);
      await this.accountsRepository.save(emailIdentity, tx);

      await this.sessionsRepository.deleteAllByUserId(userId, tx);
    });
  }

  private async createSession(
    userId: string,
    deviceContext?: DeviceContext,
    tx?: Tx,
  ) {
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);
    const expiresAt = parseExpiration(this.appConfig.JWT_REFRESH_EXPIRES_IN);

    const sessionId = randomUUID();
    const session = Session.create(
      sessionId,
      userId,
      refreshTokenHash,
      expiresAt,
      deviceContext?.ipAddress,
      deviceContext?.userAgent,
    );
    await this.sessionsRepository.save(session, tx);

    return { sessionId, refreshToken };
  }

}
