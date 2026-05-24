import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiPropertyOptional()
  address: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}
