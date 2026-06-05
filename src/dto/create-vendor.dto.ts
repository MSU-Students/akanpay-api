import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({ example: 'MSU Canteen' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  businessName: string;

  @ApiProperty({
    example: 'MSU-CAF-01',
    description: 'University vendor code format e.g. MSU-CAF-01',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^MSU-[A-Z0-9]{3,4}-\d{2}$/, {
    message: 'Vendor code must follow the university format (e.g., MSU-CAF-01)',
  })
  vendorCode: string;

  @ApiProperty({ example: 'Juan Dela Cruz' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ example: 'vendor@msu.edu.ph' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Min 8 characters' })
  @IsString()
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters long' })
  password: string;

  @ApiProperty({ example: '09171234567', description: 'Valid GCash number' })
  @IsString()
  @Matches(/^(09|\+639)\d{9}$/, {
    message: 'Please provide a valid GCash mobile number (e.g., 09171234567)',
  })
  gcashNumber: string;
}
