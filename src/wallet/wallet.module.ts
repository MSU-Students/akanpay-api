import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletAdminController } from './wallet-admin.controller';
import { WalletService } from './wallet.service';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog } from './audit-log.entity';
import { Vendor, VendorTransaction, Wallet } from 'src/entities';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Vendor, VendorTransaction, AuditLog]),
    UserModule,
  ],
  controllers: [WalletController, WalletAdminController, AuditController],
  providers: [WalletService, AuditService],
  exports: [WalletService],
})
export class WalletModule {}
