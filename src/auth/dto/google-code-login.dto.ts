import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class GoogleCodeLoginDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsUrl({
    require_tld: false,
    require_protocol: true
  })
  redirectUri!: string;

  @IsOptional()
  @IsString()
  @MinLength(43)
  @MaxLength(128)
  codeVerifier?: string;
}
