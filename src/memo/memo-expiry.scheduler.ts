import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { MemoBookmark } from './entity/memo-bookmark.entity';
import { Memo, Visibility } from './entity/memo.entity';

@Injectable()
export class MemoExpiryScheduler {
  private readonly logger = new Logger(MemoExpiryScheduler.name);

  constructor(
    @InjectRepository(Memo)
    private readonly memosRepository: Repository<Memo>,
    @InjectRepository(MemoBookmark)
    private readonly bookmarksRepository: Repository<MemoBookmark>
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleBookmarkCleanup() {
    const now = new Date();

    const expiredMemos = await this.memosRepository.find({
      where: {
        visibility: Visibility.PUBLIC,
        expiresAt: LessThanOrEqual(now)
      },
      select: ['id']
    });

    if (expiredMemos.length === 0) return;

    const expiredMemoIds = expiredMemos.map((m) => m.id);

    const result = await this.bookmarksRepository
      .createQueryBuilder()
      .delete()
      .where('memo_id IN (:...ids)', { ids: expiredMemoIds })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(`삭제된 만료 북마크: ${result.affected}건`);
    }
  }
}
