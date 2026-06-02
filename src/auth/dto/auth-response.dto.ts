import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '../../users/user.entity';

class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: AuthProvider })
  provider!: AuthProvider;

  @ApiProperty()
  nickname!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT 액세스 토큰' })
  accessToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
