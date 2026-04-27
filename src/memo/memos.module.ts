import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { MemoBookmark } from './entity/memo-bookmark.entity';
import { Memo } from './entity/memo.entity';
import { MemoExpiryScheduler } from './memo-expiry.scheduler';
import { MemoController } from './memo.controller';
import { MemosService } from './memos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Memo, MemoBookmark]), UsersModule],
  controllers: [MemoController],
  providers: [MemosService, MemoExpiryScheduler],
  exports: [MemosService]
})
export class MemosModule {}
