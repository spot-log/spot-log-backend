import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { GoogleCodeLoginDto } from './dto/google-code-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google/code')
  loginWithGoogleCode(@Body() body: GoogleCodeLoginDto) {
    return this.authService.loginWithGoogleCode(body);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    return;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any) {
    return this.authService.loginOAuth(req.user);
  }
}
