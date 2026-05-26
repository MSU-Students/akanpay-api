import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';
import { Vendor } from '..//entities/vendor.entity';
// ⬇️ Import the CryptoService directly from common instead ⬇️
import { CryptoService } from '../common/crypto.service'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Vendor]),
    // ❌ Remove SecurityModule from here if you didn't create a separate module file
  ],
  controllers: [VendorController],
  providers: [
    VendorService, 
    CryptoService // 👈 Add this here so VendorService can access it locally
  ],
  exports: [VendorService],
})
export class VendorModule {}