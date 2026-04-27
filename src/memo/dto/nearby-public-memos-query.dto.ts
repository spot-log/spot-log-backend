import { IsLatitude, IsLongitude, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class NearbyPublicMemosQueryDto {
  @IsLatitude()
  @Type(() => Number)
  latitude!: number;

  @IsLongitude()
  @Type(() => Number)
  longitude!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  radius?: number;
}
