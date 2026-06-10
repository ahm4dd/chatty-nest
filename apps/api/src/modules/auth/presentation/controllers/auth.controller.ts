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
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
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
import { parseMaxAge } from '../../../../shared-kernal/application/utils/parse-expiration';

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

    const { refreshToken, ...response } = result;
    this.setRefreshCookie(res, refreshToken);

    return response;
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

    const { refreshToken, ...response } = result;
    this.setRefreshCookie(res, refreshToken);

    return response;
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

    const result = await this.authService.rotateSession(refreshToken);

    const { refreshToken: newRefreshToken, ...response } = result;
    this.setRefreshCookie(res, newRefreshToken);

    return response;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: UwsRequest,
    @Res({ passthrough: true }) res: UwsResponse,
  ): Promise<{ success: boolean }> {
    const token = req.cookies.refreshToken;
    if (token) {
      await this.authService.logout(token);
    }

    res.clearCookie('refreshToken', {
      path: '/',
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
    });

    return { success: true };
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
    return parseMaxAge(this.appConfig.JWT_REFRESH_EXPIRES_IN);
  }
}
