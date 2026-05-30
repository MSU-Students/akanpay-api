import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletController } from './wallet.controller';
import { WalletAdminController } from './wallet-admin.controller';
import { WalletService } from './wallet.service';
import { Vendor, VendorTransaction, Wallet } from 'src/entities';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Vendor, VendorTransaction]), UserModule],
  controllers: [WalletController, WalletAdminController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
