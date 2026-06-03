import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { Vendor } from '../entities/vendor.entity';
import { Transaction } from '../entities/transaction.entity';
import { SettlementReport } from '../entities/settlement-report.entity';
import { CryptoService } from '../common/crypto.service';
import { VendorTransactionController } from './vendor-transaction.controller';
import { VendorTransactionService } from './vendor-transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor, Transaction, SettlementReport]), // 👈 added
  ],
  controllers: [
    VendorController,
    VendorTransactionController, // 👈 added
  ],
  providers: [
    VendorService,
    CryptoService,
    VendorTransactionService, // 👈 added
  ],
  exports: [VendorService],
})
export class VendorModule {}