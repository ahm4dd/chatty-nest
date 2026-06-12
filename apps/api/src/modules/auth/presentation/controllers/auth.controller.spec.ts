import { ClsService } from 'nestjs-cls';
import type { UwsRequest, UwsResponse } from 'uwestjs';
import type { AppConfig } from '../../../../app/config/app.config';
import { AuthService } from '../../application/services/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const appConfig: AppConfig = {
    NODE_ENV: 'test',
    PORT: 3000,
    JWT_PUBLIC_KEY: 'public-key',
    JWT_PRIVATE_KEY: 'private-key',
    JWT_EXPIRATION: 3600,
    JWT_REFRESH_EXPIRES_IN: '7d',
  };

  it('sets refresh token cookie without returning it in login JSON', async () => {
    const authService = {
      login: jest.fn(async () => ({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-id',
          email: 'user@example.com',
          roles: ['USER'],
        },
      })),
    } as unknown as AuthService;

    const cls = {
      get: jest.fn(() => '127.0.0.1'),
    } as unknown as ClsService;

    const controller = new AuthController(authService, cls, appConfig);
    const response = {
      cookie: jest.fn(),
    } as unknown as UwsResponse;
    const request = {
      headers: {
        'user-agent': 'jest',
      },
    } as unknown as UwsRequest;

    const body = await controller.login(
      { email: 'user@example.com', password: 'password123' },
      request,
      response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(body).toEqual({
      accessToken: 'access-token',
      user: {
        id: 'user-id',
        email: 'user@example.com',
        roles: ['USER'],
      },
    });
    expect('refreshToken' in body).toBe(false);
  });
});
