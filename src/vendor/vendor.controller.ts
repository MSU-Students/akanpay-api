import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import {
  AddVendorUserDto,
  CreateVendorDto,
  PollVendorTransactionsDto,
  RecordVendorTransactionDto,
} from 'src/dto';
import { VendorService } from './vendor.service';

@ApiBearerAuth()
@Controller('vendors')
export class VendorController {
  constructor(private readonly service: VendorService) {}

  @Get()
  @Roles(Role.User, Role.Vendor, Role.Admin)
  @ApiOkResponse({ description: 'List of all registered vendors' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':vendorId')
  @Roles(Role.User, Role.Vendor, Role.Admin)
  @ApiOkResponse({ description: 'Vendor details' })
  findOne(@Param('vendorId', ParseIntPipe) vendorId: number) {
    return this.service.findOne(vendorId);
  }

  @Post()
  @Roles(Role.Admin)
  @ApiOkResponse({ description: 'Vendor created' })
  createVendor(@Body() dto: CreateVendorDto) {
    return this.service.createVendor(dto);
  }

  @Post(':vendorId/users')
  @Roles(Role.Admin)
  @ApiOkResponse({ description: 'Vendor user linked' })
  addVendorUser(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Body() dto: AddVendorUserDto,
  ) {
    return this.service.addUserToVendor(vendorId, dto);
  }

  @Post(':vendorId/transactions')
  @Roles(Role.Vendor, Role.Admin)
  async recordTransaction(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Body() dto: RecordVendorTransactionDto,
    @Request() req,
  ) {
    await this.service.assertVendorAccess(
      req.user?.sub,
      vendorId,
      req.user?.roles ?? [],
    );
    return this.service.recordTransaction(vendorId, dto);
  }

  @Get(':vendorId/transactions/verify')
  @Roles(Role.Vendor, Role.Admin)
  async verifyTransaction(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Query('reference') reference: string,
    @Request() req,
  ) {
    await this.service.assertVendorAccess(
      req.user?.sub,
      vendorId,
      req.user?.roles ?? [],
    );
    return this.service.verifyTransaction(vendorId, reference);
  }

  @Get(':vendorId/transactions/poll')
  @Roles(Role.Vendor, Role.Admin)
  async pollTransactions(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Query() query: PollVendorTransactionsDto,
    @Request() req,
  ) {
    await this.service.assertVendorAccess(
      req.user?.sub,
      vendorId,
      req.user?.roles ?? [],
    );
    return this.service.pollTransactions(vendorId, query);
  }

  @Get(':vendorId/settlements/daily')
  @Roles(Role.Vendor, Role.Admin)
  async getDailySettlement(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Query('date') date: string,
    @Request() req,
  ) {
    await this.service.assertVendorAccess(
      req.user?.sub,
      vendorId,
      req.user?.roles ?? [],
    );
    return this.service.getDailySettlementReport(vendorId, date);
  }

  @Get(':vendorId/settlements/weekly')
  @Roles(Role.Vendor, Role.Admin)
  async getWeeklySettlement(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Query('date') date: string,
    @Request() req,
  ) {
    await this.service.assertVendorAccess(
      req.user?.sub,
      vendorId,
      req.user?.roles ?? [],
    );
    return this.service.getWeeklySettlementReport(vendorId, date);
  }

  @Get(':vendorId/settlements/monthly')
  @Roles(Role.Vendor, Role.Admin)
  async getMonthlySettlement(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Query('month') month: string,
    @Request() req,
  ) {
    await this.service.assertVendorAccess(
      req.user?.sub,
      vendorId,
      req.user?.roles ?? [],
    );
    return this.service.getMonthlySettlementReport(vendorId, month);
  }
}
