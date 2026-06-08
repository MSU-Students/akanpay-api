import {
  Controller,
  Post,
  Body,
  Req,
} from '@nestjs/common';

import { TransactionService }
from './transaction.service';

import { WalletPaymentDto }
from '../dto/wallet-payment.dto';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly transactionService:
      TransactionService,
  ) {}

  @Post('pay')
  async pay(
    @Req() req,
    @Body() dto: WalletPaymentDto,
  ) {
    return this.transactionService.payVendor(
      req.user.id,
      dto.vendorId,
      dto.amount,
    );
  }
}
