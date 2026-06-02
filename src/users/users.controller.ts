import { Controller, Delete, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
  };
};

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '회원 탈퇴',
    description:
      '현재 로그인한 사용자를 탈퇴 처리하고 사용자의 메모, 북마크, 알림 설정을 함께 삭제합니다.'
  })
  @ApiOkResponse({
    schema: {
      properties: {
        id: { type: 'string', format: 'uuid' },
        deleted: { type: 'boolean' }
      }
    }
  })
  withdraw(@Req() req: AuthenticatedRequest) {
    return this.usersService.withdraw(req.user.userId);
  }
}
