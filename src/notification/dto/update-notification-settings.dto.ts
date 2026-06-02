import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '../notification-setting.entity';
import { NotificationSettingsResponseDto } from './notification-settings-response.dto';

export class UpdateNotificationSettingsDto extends PartialType(
  NotificationSettingsResponseDto
) {
  @ApiPropertyOptional({
    enum: NotificationType,
    description: '변경할 공개 메모 알림 설정값'
  })
  @IsOptional()
  @IsEnum(NotificationType)
  declare publicMemo?: NotificationType;
}
