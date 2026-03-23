import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { UsersService } from '../users/users.service';
import { AuthProvider } from '../users/user.entity';

export type OAuthProfile = {
  provider: AuthProvider;
  providerUserId: string;
  email: string;
  nickname: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private signAccessToken(userId: string) {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    return this.jwtService.signAsync({ sub: userId }, { expiresIn });
  }

  private signRefreshToken(userId: string) {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '14d';
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is required');
    }
    return this.jwtService.signAsync({ sub: userId }, { secret, expiresIn });
  }

  async loginOAuth(profile: OAuthProfile) {
    let user = await this.usersService.findByProvider(
      profile.provider,
      profile.providerUserId
    );

    if (!user) {
      user = await this.usersService.createFromOAuth(profile);
    }

    const accessToken = await this.signAccessToken(user.id);
    const refreshToken = await this.signRefreshToken(user.id);

    await this.usersService.updateRefreshToken(
      user.id,
      this.hashToken(refreshToken)
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        provider: user.provider,
        nickname: user.nickname,
        createdAt: user.createdAt
      }
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is required');
    }

    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const incomingHash = this.hashToken(refreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = await this.signAccessToken(user.id);
    const newRefreshToken = await this.signRefreshToken(user.id);

    await this.usersService.updateRefreshToken(
      user.id,
      this.hashToken(newRefreshToken)
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }
}
