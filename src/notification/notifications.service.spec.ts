import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './notification-setting.entity';

describe('NotificationsService', () => {
  const notificationSettingsRepository = {
    query: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn()
  };
  const usersService = {
    findById: jest.fn()
  };
  const memosService = {
    findPrivateNotificationCandidates: jest.fn(),
    findPublicNotificationCandidates: jest.fn()
  };

  let notificationsService: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    notificationsService = new NotificationsService(
      notificationSettingsRepository as any,
      usersService as any,
      memosService as any
    );

    usersService.findById.mockResolvedValue({ id: 'user-1' });
    notificationSettingsRepository.query.mockResolvedValue(undefined);
    notificationSettingsRepository.findOne.mockResolvedValue({
      publicMemo: NotificationType.OFF
    });
    notificationSettingsRepository.createQueryBuilder.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue(undefined)
    });
    memosService.findPrivateNotificationCandidates.mockResolvedValue([]);
    memosService.findPublicNotificationCandidates.mockResolvedValue([]);
  });

  it('creates default settings on first read and returns public OFF default', async () => {
    const result = await notificationsService.getSettings('user-1');

    expect(notificationSettingsRepository.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO notification_settings'),
      ['user-1', NotificationType.OFF]
    );
    expect(result).toEqual({
      publicMemo: NotificationType.OFF
    });
  });

  it('re-reads settings when ensure hits a duplicate-key race', async () => {
    notificationSettingsRepository.query.mockRejectedValue({ code: 'ER_DUP_ENTRY' });
    notificationSettingsRepository.findOne.mockResolvedValue({
      publicMemo: NotificationType.ON
    });

    const result = await notificationsService.getSettings('user-1');

    expect(result).toEqual({
      publicMemo: NotificationType.ON
    });
  });

  it('updates only provided fields on patch', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const set = jest.fn().mockReturnThis();

    notificationSettingsRepository.createQueryBuilder.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      set,
      where: jest.fn().mockReturnThis(),
      execute
    });
    notificationSettingsRepository.findOne.mockResolvedValue({
      publicMemo: NotificationType.ON
    });

    const result = await notificationsService.updateSettings('user-1', {
      publicMemo: NotificationType.ON
    });

    expect(set).toHaveBeenCalledWith({ publicMemo: NotificationType.ON });
    expect(execute).toHaveBeenCalled();
    expect(result).toEqual({
      publicMemo: NotificationType.ON
    });
  });

  it('re-reads successfully when first patch sees a duplicate-key race', async () => {
    notificationSettingsRepository.query.mockRejectedValue({ code: 'ER_DUP_ENTRY' });
    notificationSettingsRepository.findOne.mockResolvedValue({
      publicMemo: NotificationType.OFF
    });

    const result = await notificationsService.updateSettings('user-1', {
      publicMemo: NotificationType.OFF
    });

    expect(result).toEqual({
      publicMemo: NotificationType.OFF
    });
  });

  it('suppresses public candidates when public notifications are OFF', async () => {
    notificationSettingsRepository.findOne.mockResolvedValue({
      publicMemo: NotificationType.OFF
    });
    memosService.findPrivateNotificationCandidates.mockResolvedValue([
      { id: 'private-1', distanceMeters: 30 }
    ]);

    const result = await notificationsService.getNotificationCandidates(
      'user-1',
      37.5,
      127.0
    );

    expect(memosService.findPrivateNotificationCandidates).toHaveBeenCalledWith(
      'user-1',
      37.5,
      127.0
    );
    expect(memosService.findPublicNotificationCandidates).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 'private-1', distanceMeters: 30 }]);
  });

  it('always includes private candidates because only public notifications are configurable', async () => {
    notificationSettingsRepository.findOne.mockResolvedValue({
      publicMemo: NotificationType.OFF
    });
    memosService.findPrivateNotificationCandidates.mockResolvedValue([
      { id: 'private-1', distanceMeters: 10 }
    ]);

    const result = await notificationsService.getNotificationCandidates(
      'user-1',
      37.5,
      127.0
    );

    expect(memosService.findPrivateNotificationCandidates).toHaveBeenCalledWith(
      'user-1',
      37.5,
      127.0
    );
    expect(result).toEqual([{ id: 'private-1', distanceMeters: 10 }]);
  });

  it('includes public candidates when public notifications are ON', async () => {
    notificationSettingsRepository.findOne.mockResolvedValue({
      publicMemo: NotificationType.ON
    });
    memosService.findPublicNotificationCandidates.mockResolvedValue([
      { id: 'public-1', distanceMeters: 20 }
    ]);

    const result = await notificationsService.getNotificationCandidates(
      'user-1',
      37.5,
      127.0
    );

    expect(memosService.findPrivateNotificationCandidates).toHaveBeenCalledWith(
      'user-1',
      37.5,
      127.0
    );
    expect(memosService.findPublicNotificationCandidates).toHaveBeenCalledWith(
      37.5,
      127.0
    );
    expect(result).toEqual([{ id: 'public-1', distanceMeters: 20 }]);
  });

  it('returns enabled private and public candidates as one distance-sorted array', async () => {
    notificationSettingsRepository.findOne.mockResolvedValue({
      publicMemo: NotificationType.ON
    });
    memosService.findPrivateNotificationCandidates.mockResolvedValue([
      { id: 'private-1', distanceMeters: 80 }
    ]);
    memosService.findPublicNotificationCandidates.mockResolvedValue([
      { id: 'public-1', distanceMeters: 20 }
    ]);

    const result = await notificationsService.getNotificationCandidates(
      'user-1',
      37.5,
      127.0
    );

    expect(result).toEqual([
      { id: 'public-1', distanceMeters: 20 },
      { id: 'private-1', distanceMeters: 80 }
    ]);
  });

  it('throws when the authenticated user no longer exists', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(notificationsService.getSettings('missing-user')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('throws when the settings row cannot be loaded after ensure', async () => {
    notificationSettingsRepository.findOne.mockResolvedValue(null);

    await expect(notificationsService.getSettings('user-1')).rejects.toBeInstanceOf(
      InternalServerErrorException
    );
  });
});
