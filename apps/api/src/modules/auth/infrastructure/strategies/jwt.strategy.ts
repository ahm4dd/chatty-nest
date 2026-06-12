import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import appConfig, { type AppConfig } from '../../../../app/config/app.config';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt.interface';
import { SESSIONS_REPOSITORY_TOKEN, BAN_STATUS_QUERY_TOKEN } from '../../application/ports/tokens';
import type { BanStatusQueryPort } from '../../application/ports/ban-status.query.port';
import type { SessionsRepositoryPort } from '../../application/ports/sessions.repository.port';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(appConfig.KEY) appConfig: AppConfig,
    @Inject(SESSIONS_REPOSITORY_TOKEN)
    private readonly sessionsRepository: SessionsRepositoryPort,
    @Inject(BAN_STATUS_QUERY_TOKEN)
    private readonly banStatusQuery: BanStatusQueryPort,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.JWT_PUBLIC_KEY,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const banStatus = await this.banStatusQuery.getBanStatus(payload.sub);
    if (banStatus.isBanned) {
      throw new UnauthorizedException('Account is banned');
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
