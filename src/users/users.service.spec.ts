import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService withdrawal', () => {
  const usersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn()
  };
  const manager = {
    query: jest.fn()
  };
  const dataSource = {
    transaction: jest.fn()
  };

  let usersService: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    usersService = new UsersService(usersRepository as any, dataSource as any);
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));
  });

  it('deletes user-owned data and the user in one transaction', async () => {
    usersRepository.findOne.mockResolvedValue({ id: 'user-1' });

    await expect(usersService.withdraw('user-1')).resolves.toEqual({
      id: 'user-1',
      deleted: true
    });

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('DELETE FROM memo_bookmarks'),
      ['user-1', 'user-1']
    );
    expect(manager.query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM notification_settings WHERE user_id = ?',
      ['user-1']
    );
    expect(manager.query).toHaveBeenNthCalledWith(
      3,
      'DELETE FROM memos WHERE user_id = ?',
      ['user-1']
    );
    expect(manager.query).toHaveBeenNthCalledWith(
      4,
      'DELETE FROM users WHERE id = ?',
      ['user-1']
    );
  });

  it('throws when the user does not exist', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await expect(usersService.withdraw('missing-user')).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
