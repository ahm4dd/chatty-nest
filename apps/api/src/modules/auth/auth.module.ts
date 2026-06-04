import { Module } from '@nestjs/common';
import { AuthController } from './presentation/controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import appConfig, { AppConfig } from '../../app/config/app.config';
import { DrizzleModule } from '../../app/database/db.module';

@Module({
  controllers: [AuthController],
  imports: [
    JwtModule.registerAsync({
      useFactory: async (appConfig: AppConfig) => {
        return {
          publicKey: appConfig.JWT_PUBLIC_KEY,
          privateKey: appConfig.JWT_PRIVATE_KEY,
          signOptions: {
            expiresIn: appConfig.JWT_EXPIRATION,
          },
        };
      },
      inject: [appConfig.KEY],
    }),
    DrizzleModule,
  ],
})
export class AuthModule {}
