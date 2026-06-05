import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import appConfig, { AppConfig } from '../../app/config/app.config';
import { DrizzleModule } from '../../app/database/db.module';
import { AuthController } from './presentation/controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { JwtAuthStrategy } from './infrastructure/strategies/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from './infrastructure/guards/roles.guard';
import { UsersRepositoryImpl } from './infrastructure/repositories/users.repository';
import { AccountsRepositoryImpl } from './infrastructure/repositories/accounts.repository';
import { SessionsRepositoryImpl } from './infrastructure/repositories/sessions.repository';
import { Argon2PasswordHasher } from './infrastructure/hasher/argon2-password-hasher';
import { UserBannedListener } from './application/listeners/user-banned.listener';
import {
  USERS_REPOSITORY_TOKEN,
  SESSIONS_REPOSITORY_TOKEN,
  ACCOUNTS_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
} from './application/ports/tokens';

@Module({
  controllers: [AuthController],
  providers: [
    { provide: USERS_REPOSITORY_TOKEN, useClass: UsersRepositoryImpl },
    { provide: SESSIONS_REPOSITORY_TOKEN, useClass: SessionsRepositoryImpl },
    { provide: ACCOUNTS_REPOSITORY_TOKEN, useClass: AccountsRepositoryImpl },
    { provide: PASSWORD_HASHER_TOKEN, useClass: Argon2PasswordHasher },
    AuthService,
    JwtAuthStrategy,
    JwtAuthGuard,
    RolesGuard,
    UserBannedListener,
  ],
  imports: [
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
