import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthProvider, User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
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
}
