import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleCodeLoginDto } from './dto/google-code-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google/code')
  loginWithGoogleCode(@Body() body: GoogleCodeLoginDto) {
    return this.authService.loginWithGoogleCode(body);
  }
}
