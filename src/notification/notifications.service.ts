import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemoResponseDto } from '../memo/dto/memo-response.dto';
import { MemosService } from '../memo/memos.service';
import { UsersService } from '../users/users.service';
import { NotificationSettingsResponseDto } from './dto/notification-settings-response.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { NotificationSetting, NotificationType } from './notification-setting.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationSetting)
    private readonly notificationSettingsRepository: Repository<NotificationSetting>,
    private readonly usersService: UsersService,
    private readonly memosService: MemosService
  ) {}

  async getSettings(userId: string): Promise<NotificationSettingsResponseDto> {
    await this.ensureUserExists(userId);
    const settings = await this.ensureSettingsAndRead(userId);
    return this.toSettingsResponse(settings);
  }

  async updateSettings(
    userId: string,
    patchDto: UpdateNotificationSettingsDto
  ): Promise<NotificationSettingsResponseDto> {
    await this.ensureUserExists(userId);
    await this.ensureSettingsRow(userId);

    const updatePayload: Partial<NotificationSetting> = {};

    if (patchDto.publicMemo !== undefined) {
      updatePayload.publicMemo = patchDto.publicMemo;
    }

    if (Object.keys(updatePayload).length > 0) {
      await this.notificationSettingsRepository
        .createQueryBuilder()
        .update(NotificationSetting)
        .set(updatePayload)
        .where('user_id = :userId', { userId })
        .execute();
    }

    const settings = await this.findSettingsByUserIdOrThrow(userId);
    return this.toSettingsResponse(settings);
  }

  async getNotificationCandidates(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<MemoResponseDto[]> {
    const settings = await this.getSettings(userId);

    const privateMemos = await this.memosService.findPrivateNotificationCandidates(
      userId,
      latitude,
      longitude
    );

    const publicMemos =
      settings.publicMemo === NotificationType.ON
        ? await this.memosService.findPublicNotificationCandidates(latitude, longitude)
        : [];

    return [...privateMemos, ...publicMemos].sort(
      (a, b) =>
        (a.distanceMeters ?? Number.MAX_SAFE_INTEGER) -
        (b.distanceMeters ?? Number.MAX_SAFE_INTEGER)
    );
  }

  private async ensureUserExists(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  private async ensureSettingsAndRead(userId: string) {
    await this.ensureSettingsRow(userId);
    return this.findSettingsByUserIdOrThrow(userId);
  }

  private async ensureSettingsRow(userId: string) {
    try {
      await this.notificationSettingsRepository.query(
        `INSERT INTO notification_settings (
          id,
          user_id,
          public_memo,
          created_at,
          updated_at
        )
        VALUES (UUID(), ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE user_id = user_id`,
        [userId, NotificationType.OFF]
      );
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) {
        throw error;
      }
    }
  }

  private async findSettingsByUserIdOrThrow(userId: string) {
    const settings = await this.notificationSettingsRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true }
    });

    if (!settings) {
      throw new InternalServerErrorException(
        'Notification settings row could not be loaded.'
      );
    }

    return settings;
  }

  private toSettingsResponse(
    settings: NotificationSetting
  ): NotificationSettingsResponseDto {
    return {
      publicMemo: settings.publicMemo
    };
  }

  private isDuplicateKeyError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'ER_DUP_ENTRY'
    );
  }
}
