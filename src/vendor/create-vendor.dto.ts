import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  businessName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^MSU-[A-Z0-9]{3,10}-[0-9]{2,4}$/, {
    message: 'Vendor code must follow university standard formatting (e.g., MSU-CAF-01)',
  })
  vendorCode: string;

  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @IsEmail({}, { message: 'Please provide a valid university-approved vendor email.' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 64, { message: 'Password must be between 8 and 64 characters long.' })
  password: string;

  @IsString()
  @IsNotEmpty()
  bankAccountNumber: string;
}