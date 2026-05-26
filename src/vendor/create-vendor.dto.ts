import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 255)
  businessName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^MSU-[A-Z0-9]{3,4}-\d{2}$/, {
    message: 'Vendor code must follow the university format (e.g., MSU-CAF-01)',
  })
  vendorCode: string;

  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 100, { message: 'Password must be between 8 and 100 characters long' })
  password: string;

  @IsString()
  @Matches(/^(09|\+639)\d{9}$/, {
    message: 'Please provide a valid GCash mobile number (e.g., 09171234567)',
  })
  gcashNumber: string; 
}