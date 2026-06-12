import { Controller, Get, Request } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';

@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('my-logs')
  @Roles(Role.User, Role.Admin, Role.Vendor)
  async getMyLogs(@Request() req) {
    return this.auditService.getUserLogs(String(req.user?.sub));
  }

  @Get('admin/logs')
  @Roles(Role.Admin)
  async getAdminLogs() {
    return this.auditService.getAllLogs();
  }
}
