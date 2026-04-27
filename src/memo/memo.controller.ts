import {
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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMemoDto } from './dto/create-memo.dto';
import { ListMemosQueryDto } from './dto/list-memos-query.dto';
import { LocationMemosQueryDto } from './dto/location-memos-query.dto';
import { MemoResponseDto } from './dto/memo-response.dto';
import { NearbyPublicMemosQueryDto } from './dto/nearby-public-memos-query.dto';
import { UpdateMemoDto } from './dto/update-memo.dto';
import { MemosService } from './memos.service';

type AuthenticatedRequest = {
  user: {
    userId: string;
  };
};

@ApiTags('memos')
@Controller('memos')
export class MemoController {
  constructor(private readonly memosService: MemosService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 메모 목록 조회' })
  @ApiOkResponse({ type: [MemoResponseDto] })
  getMemos(@Req() req: AuthenticatedRequest, @Query() query: ListMemosQueryDto) {
    return this.memosService.findAllByUser(req.user.userId, {
      tab: query.tab,
      sort: query.sort,
      latitude: query.latitude,
      longitude: query.longitude,
    });
  }

  @Get('at')
  @ApiOperation({ summary: '특정 좌표의 공개 메모 조회' })
  @ApiOkResponse({ type: [MemoResponseDto] })
  getMemosAtLocation(@Query() query: LocationMemosQueryDto) {
    return this.memosService.findByLocation(query.latitude, query.longitude);
  }

  @Get('nearby')
  @ApiOperation({ summary: '주변 공개 메모 탐색' })
  @ApiOkResponse({ type: [MemoResponseDto] })
  getNearbyPublicMemos(@Query() query: NearbyPublicMemosQueryDto) {
    return this.memosService.findNearbyPublicMemos({
      latitude: query.latitude,
      longitude: query.longitude,
      radius: query.radius,
    });
  }

  @Get(':memoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '메모 상세 조회' })
  @ApiOkResponse({ type: MemoResponseDto })
  getMemo(
    @Req() req: AuthenticatedRequest,
    @Param('memoId', new ParseUUIDPipe()) memoId: string,
  ) {
    return this.memosService.findOneByUser(req.user.userId, memoId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '메모 작성' })
  @ApiCreatedResponse({ type: MemoResponseDto })
  createMemo(@Req() req: AuthenticatedRequest, @Body() body: CreateMemoDto) {
    return this.memosService.create(req.user.userId, body);
  }

  @Patch(':memoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '메모 수정' })
  @ApiOkResponse({ type: MemoResponseDto })
  updateMemo(
    @Req() req: AuthenticatedRequest,
    @Param('memoId', new ParseUUIDPipe()) memoId: string,
    @Body() body: UpdateMemoDto,
  ) {
    return this.memosService.update(req.user.userId, memoId, body);
  }

  @Delete(':memoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '메모 삭제' })
  @ApiOkResponse({ schema: { properties: { id: { type: 'string' }, deleted: { type: 'boolean' } } } })
  deleteMemo(
    @Req() req: AuthenticatedRequest,
    @Param('memoId', new ParseUUIDPipe()) memoId: string,
  ) {
    return this.memosService.remove(req.user.userId, memoId);
  }

  @Post(':memoId/republish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '만료 메모 재공개' })
  @ApiCreatedResponse({ type: MemoResponseDto })
  republishMemo(
    @Req() req: AuthenticatedRequest,
    @Param('memoId', new ParseUUIDPipe()) memoId: string,
    @Body('expiresAt') expiresAt?: string,
  ) {
    return this.memosService.republish(req.user.userId, memoId, expiresAt);
  }
}
