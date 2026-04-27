import { IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationMemosQueryDto {
  @IsLatitude()
  @Type(() => Number)
  latitude!: number;

  @IsLongitude()
  @Type(() => Number)
  longitude!: number;
}
