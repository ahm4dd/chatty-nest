import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Roles } from '../../../../shared-kernal/infrastructure/decorators/roles.decorator';
import { ModerationService } from '../../application/services/moderation.service';
import { UserIdParamDto } from '../dto/request/user-id-param.dto';
import { BanUserDto } from '../dto/request/ban-user.dto';
import { UnbanUserDto } from '../dto/request/unban-user.dto';
import type { BanActionResponseDto } from '../dto/response/ban-action-response.dto';
import type { UnbanActionResponseDto } from '../dto/response/unban-action-response.dto';
import type { BanStatusResponseDto } from '../dto/response/ban-status-response.dto';

interface AuthenticatedRequest {
  user: { id: string };
  [key: string]: unknown;
}

@Controller('moderation')
@Roles('MODERATOR')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('users/:userId/ban')
  @HttpCode(HttpStatus.OK)
  async banUser(
    @Req() req: AuthenticatedRequest,
    @Param() params: UserIdParamDto,
    @Body() dto: BanUserDto,
  ): Promise<BanActionResponseDto> {
    return this.moderationService.banUser(req.user.id, params.userId, dto.reason, dto.expiresAt);
  }

  @Post('users/:userId/unban')
  @HttpCode(HttpStatus.OK)
  async unbanUser(
    @Req() req: AuthenticatedRequest,
    @Param() params: UserIdParamDto,
    @Body() dto: UnbanUserDto,
  ): Promise<UnbanActionResponseDto> {
    return this.moderationService.unbanUser(req.user.id, params.userId, dto.reason);
  }

  @Get('users/:userId/bans')
  @HttpCode(HttpStatus.OK)
  async getBanHistory(
    @Param() params: UserIdParamDto,
  ): Promise<BanStatusResponseDto> {
    return this.moderationService.getBanStatus(params.userId);
  }
}
