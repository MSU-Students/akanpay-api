import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { Vendor } from './vendor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor])], // Tells TypeORM to manage the Vendor table
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService], // Allows other modules (like Auth or Wallet) to query vendors
})
export class VendorModule {}