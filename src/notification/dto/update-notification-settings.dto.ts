import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '../notification-setting.entity';
import { NotificationSettingsResponseDto } from './notification-settings-response.dto';

export class UpdateNotificationSettingsDto extends PartialType(
  NotificationSettingsResponseDto
) {
  @IsOptional()
  @IsEnum(NotificationType)
  declare publicMemo?: NotificationType;
}
