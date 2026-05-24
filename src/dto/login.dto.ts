import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsString()
  IDNumber: string; //during login, user will use their IDNumber

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string; //dont use ur real password for now
}