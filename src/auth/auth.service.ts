import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthProvider } from '../users/user.entity';
import { GoogleCodeLoginDto } from './dto/google-code-login.dto';

export type OAuthProfile = {
  provider: AuthProvider;
  providerUserId: string;
  email: string;
  nickname: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
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

  async loginWithGoogleCode(body: GoogleCodeLoginDto) {
    const accessToken = await this.exchangeGoogleCodeForAccessToken(body);
    const profile = await this.fetchGoogleProfile(accessToken);

    return this.loginOAuth(profile);
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

  private async exchangeGoogleCodeForAccessToken({
    code,
    redirectUri,
    codeVerifier
  }: GoogleCodeLoginDto) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException('Google OAuth is not configured.');
    }

    const payload = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    if (codeVerifier) {
      payload.set('code_verifier', codeVerifier);
    }

    let response: Response;
    try {
      response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: payload
      });
    } catch {
      throw new BadGatewayException('Failed to reach Google token endpoint.');
    }

    const data = (await response.json()) as GoogleTokenResponse;

    if (!response.ok || !data.access_token) {
      if (data.error === 'invalid_grant' || data.error === 'redirect_uri_mismatch') {
        throw new UnauthorizedException('Invalid Google authorization code.');
      }

      throw new BadGatewayException(
        data.error_description || 'Google token exchange failed.'
      );
    }

    return data.access_token;
  }

  private async fetchGoogleProfile(accessToken: string): Promise<OAuthProfile> {
    let response: Response;
    try {
      response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    } catch {
      throw new BadGatewayException('Failed to reach Google userinfo endpoint.');
    }

    const data = (await response.json()) as GoogleUserInfoResponse;

    if (!response.ok) {
      throw new UnauthorizedException('Failed to load Google user profile.');
    }

    if (!data.sub || !data.email || !data.email_verified) {
      throw new UnauthorizedException('Google account information is invalid.');
    }

    return {
      provider: AuthProvider.GOOGLE,
      providerUserId: data.sub,
      email: data.email,
      nickname: data.name || data.email.split('@')[0] || 'user'
    };
  }
}
