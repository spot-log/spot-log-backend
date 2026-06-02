import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationCandidatesQueryDto {
  @ApiProperty({
    description: '현재 사용자 위치의 위도',
    example: 37.5665
  })
  @IsLatitude()
  @Type(() => Number)
  latitude!: number;

  @ApiProperty({
    description: '현재 사용자 위치의 경도',
    example: 126.978
  })
  @IsLongitude()
  @Type(() => Number)
  longitude!: number;
}
