import { Controller, Get, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Request } from 'express';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit/my-logs
   * Returns audit logs belonging specifically to the authenticated user.
   */
  @Get('my-logs')
  async getMyLogs(@Req() req: Request & { user: { sub: number } }) {
    const userId = String(req.user.sub);
    return await this.auditService.getUserLogs(userId);
  }

  /**
   * GET /audit/admin/logs
   * Returns all audit logs in the system. Restricted to users with the 'admin' role.
   */
  @Get('admin/logs')
  @Roles(Role.Admin)
  async getAdminLogs() {
    return await this.auditService.getAllLogs();
  }
}
