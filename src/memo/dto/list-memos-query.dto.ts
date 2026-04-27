import { IsEnum, IsLatitude, IsLongitude, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum MemoTab {
  PRIVATE = 'private',
  PUBLIC = 'public',
  EXPIRED = 'expired',
}

export enum MemoSort {
  RECENT = 'recent',
  EXPIRES_SOON = 'expiresSoon',
  DISTANCE = 'distance',
}

export class ListMemosQueryDto {
  @IsOptional()
  @IsEnum(MemoTab)
  tab?: MemoTab;

  @IsOptional()
  @IsEnum(MemoSort)
  sort?: MemoSort;

  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;
}
