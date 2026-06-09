import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import appConfig, { type AppConfig } from '../../../../app/config/app.config';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt.interface';
import { SESSIONS_REPOSITORY_TOKEN, USERS_REPOSITORY_TOKEN } from '../../application/ports/tokens';
import type { UsersRepositoryPort } from '../../application/ports/users.repository.port';
import type { SessionsRepositoryPort } from '../../application/ports/sessions.repository.port';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(appConfig.KEY) appConfig: AppConfig,
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(SESSIONS_REPOSITORY_TOKEN)
    private readonly sessionsRepository: SessionsRepositoryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.JWT_PUBLIC_KEY,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const isActive = await this.usersRepository.existsAndActive(payload.sub);
    if (!isActive) {
      throw new UnauthorizedException('Account is banned or not found');
    }

    const session = await this.sessionsRepository.findById(payload.sessionId);
    if (!session?.isValid || !session.belongsToUser(payload.sub)) {
      throw new UnauthorizedException('Session is invalid or expired');
    }

    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      sessionId: payload.sessionId,
    };
  }
}
