import { IsInt, IsPositive } from 'class-validator';

export class RepublishMemoDto {
  @IsInt()
  @IsPositive()
  durationDays!: number;
}
