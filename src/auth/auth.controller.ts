import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { GoogleCodeLoginDto } from './dto/google-code-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google/code')
  @ApiOperation({ summary: '구글 인가 코드로 로그인' })
  @ApiOkResponse({ type: AuthResponseDto })
  loginWithGoogleCode(@Body() body: GoogleCodeLoginDto) {
    return this.authService.loginWithGoogleCode(body);
  }
}
