import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit/my-logs
   * Returns audit logs belonging specifically to the authenticated user.
   */
  @Get('my-logs')
  async getMyLogs(@Req() req: Request & { user: { id: string } }) {
    const userId = req.user.id;
    return await this.auditService.getUserLogs(userId);
  }

  /**
   * GET /audit/admin/logs
   * Returns all audit logs in the system. Restricted to users with the 'admin' role.
   */
  @Get('admin/logs')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getAdminLogs() {
    return await this.auditService.getAllLogs();
  }
}