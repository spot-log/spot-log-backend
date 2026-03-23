import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthProvider } from '../users/user.entity';
import { OAuthProfile } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile']
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile
  ): OAuthProfile {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('Google profile email is required.');
    }
    const nickname = profile.displayName || email.split('@')[0] || 'user';

    return {
      provider: AuthProvider.GOOGLE,
      providerUserId: profile.id,
      email,
      nickname
    };
  }
}
