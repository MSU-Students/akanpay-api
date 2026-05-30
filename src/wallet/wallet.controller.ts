import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import {
  WalletPaymentDto,
  WalletResponseDto,
  WalletTransactionQueryDto,
} from 'src/dto';
import { WalletService } from './wallet.service';

@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @Roles(Role.User)
  @ApiOkResponse({ type: WalletResponseDto })
  async getWallet(@Request() req) {
    const wallet = await this.walletService.getWallet(req.user?.sub);
    return {
      availableBalance: Number(wallet.availableBalance),
      pendingBalance: Number(wallet.pendingBalance),
      currency: wallet.currency,
    };
  }

  @Get('transactions')
  @Roles(Role.User)
  async listTransactions(
    @Request() req,
    @Query() query: WalletTransactionQueryDto,
  ) {
    return this.walletService.listTransactions(req.user?.sub, query);
  }

  @Post('pay')
  @Roles(Role.User)
  async pay(@Request() req, @Body() dto: WalletPaymentDto) {
    return this.walletService.createPayment(req.user?.sub, dto);
  }
}
