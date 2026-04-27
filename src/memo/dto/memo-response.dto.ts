import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Visibility } from '../entity/memo.entity';

export class MemoResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({ enum: Visibility })
  visibility!: Visibility;

  @ApiPropertyOptional({ nullable: true })
  placeName!: string | null;

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;

  @ApiProperty()
  triggerRadius!: number;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  expiresAt!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ format: 'uuid' })
  authorId!: string;

  @ApiPropertyOptional()
  distanceMeters?: number;
}
