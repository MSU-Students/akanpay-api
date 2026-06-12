import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Creates and persists a new audit log entry.
   * Since fields are marked as update: false in the entity, 
   * these records remain immutable once saved.
   */
  async createLog(data: Partial<AuditLog>): Promise<AuditLog> {
    const log = this.auditLogRepository.create(data);
    return await this.auditLogRepository.save(log);
  }

  /**
   * Retrieves all logs associated with a specific user.
   */
  async getUserLogs(userId: string): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieves all audit logs in the system.
   */
  async getAllLogs(): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}