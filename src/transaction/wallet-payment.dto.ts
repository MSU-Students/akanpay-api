import { IsNumber, IsPositive } from 'class-validator';

export class WalletPaymentDto {
  @IsNumber()
  vendorId: number;

  @IsNumber()
  @IsPositive()
  amount: number;
}
