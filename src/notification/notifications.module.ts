import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemosModule } from '../memo/memos.module';
import { UsersModule } from '../users/users.module';
import { NotificationController } from './notification.controller';
import { NotificationSetting } from './notification-setting.entity';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationSetting]),
    UsersModule,
    MemosModule
  ],
  controllers: [NotificationController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
