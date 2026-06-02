import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../notification-setting.entity';

export class NotificationSettingsResponseDto {
  @ApiProperty({
    enum: NotificationType,
    description: '공개 메모 알림 설정값'
  })
  publicMemo!: NotificationType;
}
