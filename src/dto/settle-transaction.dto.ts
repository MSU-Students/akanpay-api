import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from 'src/enums';

export class SettleTransactionDto {
  @ApiProperty({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  status: TransactionStatus.Success | TransactionStatus.Failed;

  @ApiProperty({ required: false, description: 'ISO timestamp of settlement' })
  @IsOptional()
  @IsString()
  paidAt?: string;
}
