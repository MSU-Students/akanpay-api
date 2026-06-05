import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @IsOptional()
  @IsString()
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters long' })
  password?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(09|\+639)\d{9}$/, {
    message: 'Please provide a valid GCash mobile number (e.g., 09171234567)',
  })
  gcashNumber?: string;
}
