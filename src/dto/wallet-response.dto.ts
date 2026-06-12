import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty()
  availableBalance: number;

  @ApiProperty()
  pendingBalance: number;

  @ApiProperty()
  currency: string;
}
