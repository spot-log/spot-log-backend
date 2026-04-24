import {
  BadGatewayException,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider } from '../users/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const usersService = {
    findByProvider: jest.fn(),
    createFromOAuth: jest.fn()
  };
  const jwtService = {
    signAsync: jest.fn()
  };
  const configService = {
    get: jest.fn()
  } as unknown as ConfigService;

  let authService: AuthService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(
      usersService as any,
      jwtService as unknown as JwtService,
      configService
    );
    fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;

    usersService.findByProvider.mockResolvedValue({
      id: 'user-id',
      email: 'spotlog@example.com',
      provider: AuthProvider.GOOGLE,
      nickname: 'SpotLog',
      createdAt: new Date('2026-04-24T00:00:00.000Z')
    });
    jwtService.signAsync.mockResolvedValue('signed-jwt');
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'GOOGLE_CLIENT_ID') {
        return 'google-client-id';
      }
      if (key === 'GOOGLE_CLIENT_SECRET') {
        return 'google-client-secret';
      }
      if (key === 'JWT_EXPIRES_IN') {
        return '15m';
      }
      return undefined;
    });
  });

  afterEach(() => {
    delete (global as Partial<typeof globalThis>).fetch;
  });

  it('exchanges a Google code and returns the service JWT payload', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'google-access-token'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'google-user-id',
          email: 'spotlog@example.com',
          email_verified: true,
          name: 'SpotLog'
        })
      });

    const result = await authService.loginWithGoogleCode({
      code: 'google-auth-code',
      redirectUri: 'http://localhost:5173',
      codeVerifier: '0123456789012345678901234567890123456789012'
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({
        method: 'POST'
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://openidconnect.googleapis.com/v1/userinfo',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer google-access-token'
        }
      })
    );
    expect(usersService.findByProvider).toHaveBeenCalledWith(
      AuthProvider.GOOGLE,
      'google-user-id'
    );
    expect(result).toEqual({
      accessToken: 'signed-jwt',
      user: {
        id: 'user-id',
        email: 'spotlog@example.com',
        provider: AuthProvider.GOOGLE,
        nickname: 'SpotLog',
        createdAt: new Date('2026-04-24T00:00:00.000Z')
      }
    });
  });

  it('throws unauthorized when Google rejects the code', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'invalid_grant'
      })
    });

    await expect(
      authService.loginWithGoogleCode({
        code: 'bad-code',
        redirectUri: 'http://localhost:5173'
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('throws when Google OAuth credentials are missing', async () => {
    (configService.get as jest.Mock).mockReturnValue(undefined);

    await expect(
      authService.loginWithGoogleCode({
        code: 'google-auth-code',
        redirectUri: 'http://localhost:5173'
      })
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('throws bad gateway when Google userinfo cannot be reached', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'google-access-token'
        })
      })
      .mockRejectedValueOnce(new Error('network error'));

    await expect(
      authService.loginWithGoogleCode({
        code: 'google-auth-code',
        redirectUri: 'http://localhost:5173'
      })
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
