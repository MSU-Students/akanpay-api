import { IsUUID } from 'class-validator';

export class ConfirmTransactionDto {
  @IsUUID()
  transactionId: string;
}