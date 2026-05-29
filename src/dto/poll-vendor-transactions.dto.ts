import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from 'src/enums';

export class PollVendorTransactionsDto {
  @ApiProperty({ required: false, description: 'ISO timestamp for polling window start' })
  @IsOptional()
  @IsString()
  since?: string;

  @ApiProperty({ required: false, enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;
}
