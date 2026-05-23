import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString()
  IDNumber: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;
}