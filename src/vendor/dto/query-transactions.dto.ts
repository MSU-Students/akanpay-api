import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TransactionStatus } from '../../entities/transaction.entity';

export class QueryTransactionsDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsDateString()
  from?: string;               // e.g. 2025-01-01

  @IsOptional()
  @IsDateString()
  to?: string;                 // e.g. 2025-12-31
}