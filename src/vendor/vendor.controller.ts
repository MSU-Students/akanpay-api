import { Controller, Post, Patch, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateVendorDto } from './create-vendor.dto';
import { UpdateVendorDto } from './update-vendor.dto';

@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorService.register(createVendorDto);
  }

  @Get(':id')
  async getProfile(@Param('id') id: string) {
    return this.vendorService.findOne(id);
  }

  @Patch(':id')
  async updateProfile(
    @Param('id') id: string, 
    @Body() updateVendorDto: UpdateVendorDto
  ) {
    return this.vendorService.update(id, updateVendorDto);
  }
}