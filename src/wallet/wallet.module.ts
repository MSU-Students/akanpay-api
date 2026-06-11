import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from './audit.controller';
import { AuditLog } from './audit-log.entity';
import { AuditService } from './audit.service';
import { WalletController } from './wallet.controller';
import { WalletAdminController } from './wallet-admin.controller';
import { WalletService } from './wallet.service';
import {
  Vendor,
  VendorTransaction,
  Wallet,
  WalletLedgerEntry,
} from 'src/entities';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      Vendor,
      VendorTransaction,
      WalletLedgerEntry,
      AuditLog,
    ]),
    UserModule,
  ],
  controllers: [WalletController, WalletAdminController, AuditController],
  providers: [WalletService, AuditService],
  exports: [WalletService, AuditService],
})
export class WalletModule {}
