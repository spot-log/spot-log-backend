import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../notification-setting.entity';

export class NotificationSettingsResponseDto {
  @ApiProperty({ enum: NotificationType })
  publicMemo!: NotificationType;
}
