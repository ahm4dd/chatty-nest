import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import appConfig, { AppConfig } from '../../app/config/app.config';
import { DrizzleModule } from '../../app/database/db.module';
import { AuthController } from './presentation/controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { JwtAuthStrategy } from './infrastructure/strategies/jwt.strategy';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { UsersRepositoryImpl } from './infrastructure/repositories/users.repository';
import { AccountsRepositoryImpl } from './infrastructure/repositories/accounts.repository';
import { SessionsRepositoryImpl } from './infrastructure/repositories/sessions.repository';
import { BanStatusQueryImpl } from './infrastructure/repositories/ban-status.query';
import { Argon2PasswordHasher } from './infrastructure/hasher/argon2-password-hasher';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { UserBannedListener } from './application/listeners/user-banned.listener';
import {
  USERS_REPOSITORY_TOKEN,
  SESSIONS_REPOSITORY_TOKEN,
  ACCOUNTS_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  BAN_STATUS_QUERY_TOKEN,
} from './application/ports/tokens';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    { provide: USERS_REPOSITORY_TOKEN, useClass: UsersRepositoryImpl },
    { provide: SESSIONS_REPOSITORY_TOKEN, useClass: SessionsRepositoryImpl },
    { provide: ACCOUNTS_REPOSITORY_TOKEN, useClass: AccountsRepositoryImpl },
    { provide: PASSWORD_HASHER_TOKEN, useClass: Argon2PasswordHasher },
    { provide: BAN_STATUS_QUERY_TOKEN, useClass: BanStatusQueryImpl },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AuthService,
    JwtAuthStrategy,
    UserBannedListener,
  ],
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: async (appConfig: AppConfig) => ({
        publicKey: appConfig.JWT_PUBLIC_KEY,
        privateKey: appConfig.JWT_PRIVATE_KEY,
        signOptions: {
          expiresIn: appConfig.JWT_EXPIRATION,
          algorithm: 'RS256',
        },
      }),
      inject: [appConfig.KEY],
    }),
    DrizzleModule,
  ],
})
export class AuthModule {}
