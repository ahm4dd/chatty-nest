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
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';
import { RolesGuard } from '../../infrastructure/guards/roles.guard';
import { Roles } from '../../../../shared-kernal/infrastructure/decorators/roles.decorator';
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
import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cls: ClsService,
    @Inject(appConfig.KEY) private readonly appConfig: AppConfig,
  ) {}

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
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  async me(): Promise<CurrentSessionResponseDto> {
    const userId = this.cls.get<string>('userId');
    const sessionId = this.cls.get<string>('sessionId');
    const email = this.cls.get<string>('userEmail');
    const role = this.cls.get<RoleType[]>('roles')?.[0] ?? 'USER';

    if (!userId || !sessionId || !email) {
      throw new UnauthorizedException('Invalid authentication context');
    }

    return this.authService.getSession(sessionId, userId, email, role);
  }

  @Get('sessions')
  @UseGuards(AuthGuard('jwt'))
  async sessions(): Promise<SessionsListResponseDto> {
    const userId = this.cls.get<string>('userId');
    const sessionId = this.cls.get<string>('sessionId');

    if (!userId || !sessionId) {
      throw new UnauthorizedException('Invalid authentication context');
    }

    return this.authService.listSessions(userId, sessionId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(AuthGuard('jwt'))
  async revokeSession(
    @Param() params: RevokeSessionDto,
  ): Promise<RevokeSessionResponseDto> {
    const userId = this.cls.get<string>('userId');
    if (!userId) {
      throw new UnauthorizedException('Invalid authentication context');
    }

    return this.authService.revokeSession(
      params.sessionId,
      userId,
      this.cls.get<string>('sessionId') ?? '',
    );
  }

  @Delete('sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'))
  async revokeAllSessions(): Promise<void> {
    const userId = this.cls.get<string>('userId');
    if (!userId) {
      throw new UnauthorizedException('Invalid authentication context');
    }

    await this.authService.revokeAllSessions(userId);
  }

  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard('jwt'))
  async changePassword(@Body() dto: ChangePasswordDto): Promise<void> {
    const userId = this.cls.get<string>('userId');
    if (!userId) {
      throw new UnauthorizedException('Invalid authentication context');
    }

    await this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Get('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
