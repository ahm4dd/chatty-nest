import { Module } from '@nestjs/common';
import { ModerationController } from './presentation/controllers/moderation.controller';
import { ModerationService } from './application/services/moderation.service';
import { BanLogRepositoryImpl } from './infrastructure/repositories/ban-log.repository';
import { UserRolesQueryImpl } from './infrastructure/repositories/user-roles.query';
import { UserUnbannedListener } from './application/listeners/user-unbanned.listener';
import {
  BAN_LOG_REPOSITORY_TOKEN,
  USER_ROLES_QUERY_TOKEN,
} from './application/ports/tokens';

@Module({
  controllers: [ModerationController],
  providers: [
    { provide: BAN_LOG_REPOSITORY_TOKEN, useClass: BanLogRepositoryImpl },
    { provide: USER_ROLES_QUERY_TOKEN, useClass: UserRolesQueryImpl },
    ModerationService,
    UserUnbannedListener,
  ],
})
export class ModerationModule {}
