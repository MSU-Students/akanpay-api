import { ApiProperty } from '@nestjs/swagger';
import { IsEAN, IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: '20261234' })
  @IsString()
  @IsNotEmpty()
  IDNumber: string;  // added this field in the schema for dto

  @ApiProperty()
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;  // also this

  @ApiProperty({
    description: 'Min 8 chars with uppercase, lowercase, and a number',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'password must contain uppercase, lowercase, and a number',
  })
  password: string;
}
