import { Inject, Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import appConfig, { type AppConfig } from '../../../../app/config/app.config';
import { ClsService } from 'nestjs-cls';
import { JwtPayload } from '../interfaces/jwt.interface';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(appConfig.KEY) private readonly appConfig: AppConfig,
    private readonly cls: ClsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: appConfig.JWT_PUBLIC_KEY,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload) {
    this.cls.set('userId', payload.sub);
    this.cls.set('userEmail', payload.email);
    this.cls.set('sessionId', payload.sessionId);
    this.cls.set('roles', payload.roles);

    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      sessionId: payload.sessionId,
    };
  }
}
