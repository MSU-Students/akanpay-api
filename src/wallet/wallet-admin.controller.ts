import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { SettleTransactionDto, VerifyStudentDto } from 'src/dto';
import { WalletService } from './wallet.service';
import { UserService } from 'src/user/user.service';

@ApiBearerAuth()
@Controller('admin')
export class WalletAdminController {
  constructor(
    private readonly walletService: WalletService,
    private readonly userService: UserService,
  ) {}

  @Post('students/:id/verify')
  @Roles(Role.Admin)
  async verifyStudent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyStudentDto,
  ) {
    return this.userService.verifyStudent(id, dto);
  }

  @Post('transactions/:id/settle')
  @Roles(Role.Admin)
  async settleTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SettleTransactionDto,
  ) {
    return this.walletService.settleTransaction(id, dto);
  }

  @Get('summary/daily')
  @Roles(Role.Admin)
  async dailySummary(@Query('date') date: string) {
    return this.walletService.getAdminSummary(date);
  }
}
