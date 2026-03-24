import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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

  private signAccessToken(userId: string) {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    return this.jwtService.signAsync({ sub: userId }, { expiresIn });
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

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        provider: user.provider,
        nickname: user.nickname,
        createdAt: user.createdAt
      }
    };
  }
}
