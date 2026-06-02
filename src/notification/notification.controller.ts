import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MemoResponseDto } from '../memo/dto/memo-response.dto';
import { NotificationCandidatesQueryDto } from './dto/notification-candidates-query.dto';
import { NotificationSettingsResponseDto } from './dto/notification-settings-response.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
  };
};

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('settings')
  @ApiOperation({ summary: '알림 설정 조회' })
  @ApiOkResponse({ type: NotificationSettingsResponseDto })
  getSettings(@Req() req: AuthenticatedRequest) {
    return this.notificationsService.getSettings(req.user.userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: '알림 설정 수정' })
  @ApiOkResponse({ type: NotificationSettingsResponseDto })
  updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateNotificationSettingsDto
  ) {
    return this.notificationsService.updateSettings(req.user.userId, body);
  }

  @Get('candidates')
  @ApiOperation({
    summary: '현재 위치 기준 알림 후보 메모 조회',
    description:
      '클라이언트가 진입/재진입 판단에 사용할 현재 위치 기준 개인/공개 메모 후보 배열을 반환합니다. 공개 메모 알림 설정이 OFF면 공개 메모는 제외됩니다.'
  })
  @ApiOkResponse({ type: [MemoResponseDto] })
  getNotificationCandidates(
    @Req() req: AuthenticatedRequest,
    @Query() query: NotificationCandidatesQueryDto
  ) {
    return this.notificationsService.getNotificationCandidates(
      req.user.userId,
      query.latitude,
      query.longitude
    );
  }
}
