import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { Roles } from 'src/decorators';
import { CreateVendorDto, UpdateVendorDto, VendorResponseDto } from 'src/dto';
import { Role } from 'src/enums';
import { VendorService } from './vendor.service';

@ApiBearerAuth()
@Controller('vendor')
export class VendorController {
  constructor(private readonly service: VendorService) {}

  @Get()
  @Roles(Role.User, Role.Admin)
  @ApiOkResponse({ type: VendorResponseDto, isArray: true })
  async findAll() {
    const vendors = await this.service.findAll();
    return vendors.map((v) => plainToInstance(VendorResponseDto, v));
  }

  @Get(':id')
  @Roles(Role.User, Role.Admin)
  @ApiOkResponse({ type: VendorResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const vendor = await this.service.findOne(id);
    return plainToInstance(VendorResponseDto, vendor);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiOkResponse({ type: VendorResponseDto })
  async create(@Body() createDto: CreateVendorDto) {
    const vendor = await this.service.create(createDto);
    return plainToInstance(VendorResponseDto, vendor);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOkResponse({ type: VendorResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVendorDto,
  ) {
    const vendor = await this.service.update(id, updateDto);
    return plainToInstance(VendorResponseDto, vendor);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.service.remove(id);
  }
}
