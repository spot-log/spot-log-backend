import { NotFoundException } from '@nestjs/common';
import { MemosService } from './memos.service';
import { Visibility } from './entity/memo.entity';

describe('MemosService notification helpers', () => {
  const memosRepository = {
    find: jest.fn(),
    findOne: jest.fn()
  };
  const bookmarksRepository = {};
  const usersService = {
    findById: jest.fn()
  };

  let memosService: MemosService;

  beforeEach(() => {
    jest.clearAllMocks();
    memosService = new MemosService(
      memosRepository as any,
      bookmarksRepository as any,
      usersService as any
    );
    usersService.findById.mockResolvedValue({ id: 'user-1' });
  });

  it('returns only private memos within each memo trigger radius, sorted by distance', async () => {
    memosRepository.find.mockResolvedValue([
      createMemo({
        id: 'private-near',
        visibility: Visibility.PRIVATE,
        latitude: 37.5003,
        longitude: 127.0,
        triggerRadius: 50,
        userId: 'user-1'
      }),
      createMemo({
        id: 'private-far',
        visibility: Visibility.PRIVATE,
        latitude: 37.502,
        longitude: 127.0,
        triggerRadius: 50,
        userId: 'user-1'
      }),
      createMemo({
        id: 'private-mid',
        visibility: Visibility.PRIVATE,
        latitude: 37.5007,
        longitude: 127.0,
        triggerRadius: 100,
        userId: 'user-1'
      })
    ]);

    const result = await memosService.findPrivateNotificationCandidates(
      'user-1',
      37.5,
      127.0
    );

    expect(result.map((memo) => memo.id)).toEqual(['private-near', 'private-mid']);
    expect(result[0].distanceMeters).toBeLessThanOrEqual(50);
    expect(result[1].distanceMeters).toBeLessThanOrEqual(100);
  });

  it('returns active public candidates including the callers own public memo', async () => {
    memosRepository.find.mockResolvedValue([
      createMemo({
        id: 'public-own',
        visibility: Visibility.PUBLIC,
        latitude: 37.5003,
        longitude: 127.0,
        triggerRadius: 50,
        userId: 'user-1',
        expiresAt: new Date('2099-01-01T00:00:00.000Z')
      }),
      createMemo({
        id: 'public-other',
        visibility: Visibility.PUBLIC,
        latitude: 37.5006,
        longitude: 127.0,
        triggerRadius: 100,
        userId: 'user-2',
        expiresAt: new Date('2099-01-01T00:00:00.000Z')
      }),
      createMemo({
        id: 'public-expired',
        visibility: Visibility.PUBLIC,
        latitude: 37.5001,
        longitude: 127.0,
        triggerRadius: 100,
        userId: 'user-3',
        expiresAt: new Date('2020-01-01T00:00:00.000Z')
      })
    ]);

    const result = await memosService.findPublicNotificationCandidates(37.5, 127.0);

    expect(result.map((memo) => memo.id)).toEqual(['public-own', 'public-other']);
    expect(result.every((memo) => memo.visibility === Visibility.PUBLIC)).toBe(true);
  });

  it('returns owned memo detail or active public memo detail by id', async () => {
    memosRepository.findOne
      .mockResolvedValueOnce(
        createMemo({
          id: 'owned-private',
          visibility: Visibility.PRIVATE,
          userId: 'user-1',
        })
      )
      .mockResolvedValueOnce(
        createMemo({
          id: 'public-other',
          visibility: Visibility.PUBLIC,
          userId: 'user-2',
          expiresAt: new Date('2099-01-01T00:00:00.000Z')
        })
      );

    await expect(
      memosService.findOneVisibleToUser('user-1', 'owned-private')
    ).resolves.toMatchObject({
      id: 'owned-private',
      visibility: Visibility.PRIVATE
    });
    await expect(
      memosService.findOneVisibleToUser('user-1', 'public-other')
    ).resolves.toMatchObject({
      id: 'public-other',
      visibility: Visibility.PUBLIC,
      authorId: 'user-2'
    });
  });

  it('hides other users private memos and expired public memos', async () => {
    memosRepository.findOne
      .mockResolvedValueOnce(
        createMemo({
          id: 'private-other',
          visibility: Visibility.PRIVATE,
          userId: 'user-2'
        })
      )
      .mockResolvedValueOnce(
        createMemo({
          id: 'expired-other',
          visibility: Visibility.PUBLIC,
          userId: 'user-2',
          expiresAt: new Date('2020-01-01T00:00:00.000Z')
        })
      );

    await expect(
      memosService.findOneVisibleToUser('user-1', 'private-other')
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      memosService.findOneVisibleToUser('user-1', 'expired-other')
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps owned expired public memos visible through the detail endpoint', async () => {
    memosRepository.findOne.mockResolvedValueOnce(
      createMemo({
        id: 'expired-owned',
        visibility: Visibility.PUBLIC,
        userId: 'user-1',
        expiresAt: new Date('2020-01-01T00:00:00.000Z')
      })
    );

    await expect(
      memosService.findOneVisibleToUser('user-1', 'expired-owned')
    ).resolves.toMatchObject({
      id: 'expired-owned',
      visibility: Visibility.PUBLIC
    });
  });
});

function createMemo(params: {
  id: string;
  visibility: Visibility;
  userId: string;
  latitude?: number;
  longitude?: number;
  triggerRadius?: number;
  expiresAt?: Date | null;
}) {
  return {
    id: params.id,
    title: params.id,
    body: `${params.id}-body`,
    visibility: params.visibility,
    placeName: null,
    latitude: params.latitude ?? 37.5,
    longitude: params.longitude ?? 127.0,
    triggerRadius: params.triggerRadius ?? 100,
    expiresAt:
      params.expiresAt !== undefined
        ? params.expiresAt
        : params.visibility === Visibility.PUBLIC
          ? new Date('2099-01-01T00:00:00.000Z')
          : null,
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    user: {
      id: params.userId
    }
  };
}
