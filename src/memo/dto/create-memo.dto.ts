import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Visibility } from '../entity/memo.entity';

export class CreateMemoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body!: string;

  @IsEnum(Visibility)
  visibility!: Visibility;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  placeName?: string;

  @IsOptional()
  @IsNumber()
  @IsEnum([50, 100, 200, 500])
  triggerRadius?: number;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
