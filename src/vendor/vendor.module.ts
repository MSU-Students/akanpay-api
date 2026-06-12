import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { Vendor, VendorTransaction, VendorUser } from 'src/entities';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor, VendorUser, VendorTransaction]),
    UserModule,
  ],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}
