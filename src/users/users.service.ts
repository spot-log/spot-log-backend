import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthProvider, User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource
  ) {}

  findByProvider(provider: AuthProvider, providerUserId: string) {
    return this.usersRepository.findOne({ where: { provider, providerUserId } });
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async createFromOAuth(params: {
    email: string;
    provider: AuthProvider;
    providerUserId: string;
    nickname: string;
  }) {
    const user = this.usersRepository.create({
      email: params.email,
      provider: params.provider,
      providerUserId: params.providerUserId,
      nickname: params.nickname
    });
    return this.usersRepository.save(user);
  }

  async withdraw(userId: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `DELETE FROM memo_bookmarks
         WHERE user_id = ?
            OR memo_id IN (SELECT id FROM memos WHERE user_id = ?)`,
        [userId, userId]
      );
      await manager.query('DELETE FROM notification_settings WHERE user_id = ?', [
        userId
      ]);
      await manager.query('DELETE FROM memos WHERE user_id = ?', [userId]);
      await manager.query('DELETE FROM users WHERE id = ?', [userId]);
    });

    return { id: userId, deleted: true };
  }
}
