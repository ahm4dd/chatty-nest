import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { Roles } from '../../../../shared-kernal/infrastructure/decorators/roles.decorator';
import { isPublic } from '../../../../shared-kernal/infrastructure/decorators/public.decorator';
import { AuthService } from '../../application/services/auth.service';
import { RegisterDto } from '../dto/request/register.dto';
import { LoginDto } from '../dto/request/login.dto';
import { ChangePasswordDto } from '../dto/request/change-password.dto';
import { RevokeSessionDto } from '../dto/request/revoke-session.dto';
import type { AuthTokensResponseDto } from '../dto/response/auth-tokens-response.dto';
import type { CurrentSessionResponseDto } from '../dto/response/current-session-response.dto';
import type { SessionsListResponseDto } from '../dto/response/sessions-list-response.dto';
import type { RevokeSessionResponseDto } from '../dto/response/revoke-session-response.dto';
import { UwsRequest, UwsResponse } from 'uwestjs';
import appConfig, { type AppConfig } from '../../../../app/config/app.config';
import type { AuthenticatedUser } from '../../infrastructure/interfaces/jwt.interface';

type AuthenticatedRequest = UwsRequest & { user: AuthenticatedUser };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cls: ClsService,
    @Inject(appConfig.KEY) private readonly appConfig: AppConfig,
  ) {}

  @isPublic()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: UwsRequest,
    @Res({ passthrough: true }) res: UwsResponse,
  ): Promise<AuthTokensResponseDto> {
    const result = await this.authService.register(
      dto.email,
      dto.password,
      dto.name,
      {
        ipAddress: this.cls.get('ip') as string,
        userAgent: req.headers['user-agent'] as string,
      },
    );

    this.setRefreshCookie(res, result.refreshToken);

    return result;
  }

  @isPublic()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: UwsRequest,
    @Res({ passthrough: true }) res: UwsResponse,
  ): Promise<AuthTokensResponseDto> {
    const result = await this.authService.login(dto.email, dto.password, {
      ipAddress: this.cls.get('ip') as string,
      userAgent: req.headers['user-agent'] as string,
    });

    this.setRefreshCookie(res, result.refreshToken);

    return result;
  }

  @isPublic()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: UwsRequest,
    @Res({ passthrough: true }) res: UwsResponse,
  ): Promise<AuthTokensResponseDto> {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshToken(refreshToken);

    this.setRefreshCookie(res, result.refreshToken);

    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: UwsRequest,
    @Res({ passthrough: true }) res: UwsResponse,
  ): Promise<{ success: boolean }> {
    const refreshToken = req.cookies.refreshToken;
    const success = refreshToken
      ? await this.authService.logout(refreshToken)
      : false;

    res.clearCookie('refreshToken', {
      path: '/',
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
    });

    return { success };
  }

  @Get('me')
  async me(
    @Req() req: AuthenticatedRequest,
  ): Promise<CurrentSessionResponseDto> {
    const { id: userId, email, roles, sessionId } = req.user;

    return this.authService.getSession(sessionId, userId, email, roles[0] ?? 'USER');
  }

  @Get('sessions')
  async sessions(
    @Req() req: AuthenticatedRequest,
  ): Promise<SessionsListResponseDto> {
    const { id: userId, sessionId } = req.user;

    return this.authService.listSessions(userId, sessionId);
  }

  @Delete('sessions/:sessionId')
  async revokeSession(
    @Req() req: AuthenticatedRequest,
    @Param() params: RevokeSessionDto,
  ): Promise<RevokeSessionResponseDto> {
    const { id: userId, sessionId: currentSessionId } = req.user;

    return this.authService.revokeSession(
      params.sessionId,
      userId,
      currentSessionId,
    );
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeAllSessions(
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const { id: userId } = req.user;

    await this.authService.revokeAllSessions(userId);
  }

  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    const { id: userId } = req.user;

    await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  adminOnly(): { message: string } {
    return { message: 'Welcome, admin!' };
  }

  private setRefreshCookie(res: UwsResponse, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: this.refreshMaxAgeMs,
    });
  }

  private get isProduction(): boolean {
    return this.appConfig.NODE_ENV === 'production';
  }

  private get refreshMaxAgeMs(): number {
    return this.parseMaxAge(this.appConfig.JWT_REFRESH_EXPIRES_IN);
  }

  private parseMaxAge(expiresIn: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) return 7 * 24 * 60 * 60 * 1000;

    const value = Number.parseInt(match[1] as string, 10);
    const unit = match[2] as string;
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] ?? 7 * 24 * 60 * 60 * 1000);
  }
}
