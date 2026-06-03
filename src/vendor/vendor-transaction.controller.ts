import { Controller, Get, Patch, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { VendorTransactionService } from './vendor-transaction.service';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Controller('vendors/:vendorId/transactions')
export class VendorTransactionController {

  constructor(private readonly txnService: VendorTransactionService) {}

  // GET /vendors/:vendorId/transactions?status=PENDING&from=2025-01-01&to=2025-12-31
  @Get()
  getAll(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query() query: QueryTransactionsDto,
  ) {
    return this.txnService.getTransactions(vendorId, query);
  }

  // GET /vendors/:vendorId/transactions/:id
  @Get(':id')
  getOne(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.txnService.getOne(vendorId, id);
  }

  // PATCH /vendors/:vendorId/transactions/:id/confirm
  @Patch(':id/confirm')
  confirm(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.txnService.confirmTransaction(vendorId, id);
  }

  // GET /vendors/:vendorId/settlements?from=2025-01-01&to=2025-01-31
  @Get('/settlements')
  settlements(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.txnService.getSettlements(vendorId, from, to);
  }
}