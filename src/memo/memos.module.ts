import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { MemoController } from './memo.controller';
import { Memo } from './entity/memo.entity';
import { MemosService } from './memos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Memo]), UsersModule],
  controllers: [MemoController],
  providers: [MemosService],
  exports: [MemosService]
})
export class MemosModule {}
