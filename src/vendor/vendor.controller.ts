import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateVendorDto } from './create-vendor.dto';

@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async registerVendor(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorService.create(createVendorDto);
  }
}