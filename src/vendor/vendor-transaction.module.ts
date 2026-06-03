// vendor-transaction.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from '../entities/vendor.entity';
import { Transaction } from '../entities/transaction.entity';
import { SettlementReport } from '../entities/settlement-report.entity';
import { VendorTransactionService } from './vendor-transaction.service';
import { VendorTransactionController } from './vendor-transaction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor, Transaction, SettlementReport])],
  controllers: [VendorTransactionController],
  providers: [VendorTransactionService],
  exports: [VendorTransactionService],
})
export class VendorTransactionModule {}