import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { VendorUserRole } from 'src/enums';

export class AddVendorUserDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  userId: number;

  @ApiProperty({ enum: VendorUserRole, required: false })
  @IsOptional()
  @IsEnum(VendorUserRole)
  role?: VendorUserRole;
}
