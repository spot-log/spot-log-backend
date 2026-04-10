import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMemoDto } from './dto/create-memo.dto';
import { UpdateMemoDto } from './dto/update-memo.dto';
import { MemosService } from './memos.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
  };
};

type ListMemosQuery = {
  tab?: string;
  sort?: string;
  latitude?: string;
  longitude?: string;
};

type NearbyPublicMemosQuery = {
  latitude: string;
  longitude: string;
  radius?: string;
};

@Controller('memos')
export class MemoController {
  constructor(private readonly memosService: MemosService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMemos(@Req() req: AuthenticatedRequest, @Query() query: ListMemosQuery) {
    return this.memosService.findAllByUser(req.user.userId, {
      tab: query.tab,
      sort: query.sort,
      latitude: this.parseOptionalNumber(query.latitude),
      longitude: this.parseOptionalNumber(query.longitude),
    });
  }

  @Get('nearby')
  getNearbyPublicMemos(@Query() query: NearbyPublicMemosQuery) {
    return this.memosService.findNearbyPublicMemos({
      latitude: this.parseRequiredNumber(query.latitude, 'latitude'),
      longitude: this.parseRequiredNumber(query.longitude, 'longitude'),
      radius: this.parseOptionalNumber(query.radius),
    });
  }

  @Get(':memoId')
  @UseGuards(JwtAuthGuard)
  getMemo(
    @Req() req: AuthenticatedRequest,
    @Param('memoId', new ParseUUIDPipe()) memoId: string,
  ) {
    return this.memosService.findOneByUser(req.user.userId, memoId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  createMemo(@Req() req: AuthenticatedRequest, @Body() body: CreateMemoDto) {
    return this.memosService.create(req.user.userId, body);
  }

  @Patch(':memoId')
  @UseGuards(JwtAuthGuard)
  updateMemo(
    @Req() req: AuthenticatedRequest,
    @Param('memoId', new ParseUUIDPipe()) memoId: string,
    @Body() body: UpdateMemoDto,
  ) {
    return this.memosService.update(req.user.userId, memoId, body);
  }

  @Delete(':memoId')
  @UseGuards(JwtAuthGuard)
  deleteMemo(
    @Req() req: AuthenticatedRequest,
    @Param('memoId', new ParseUUIDPipe()) memoId: string,
  ) {
    return this.memosService.remove(req.user.userId, memoId);
  }

  @Post(':memoId/republish')
  @UseGuards(JwtAuthGuard)
  republishMemo(
    @Req() req: AuthenticatedRequest,
    @Param('memoId', new ParseUUIDPipe()) memoId: string,
    @Body('expiresAt') expiresAt?: string,
  ) {
    return this.memosService.republish(req.user.userId, memoId, expiresAt);
  }

  private parseOptionalNumber(value?: string) {
    if (value === undefined) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private parseRequiredNumber(value: string | undefined, fieldName: string) {
    const parsed = this.parseOptionalNumber(value);

    if (parsed === undefined) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    return parsed;
  }
}
