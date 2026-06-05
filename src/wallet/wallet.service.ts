import { Injectable } from '@nestjs/common';
import { AuditService } from './audit.service';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Settles a transaction and records it in the audit log.
   */
  async settleTransaction(
    userId: string,
    amount: number,
    transactionId: string,
    vendorId?: string,
  ) {
    // 1. Logic to fetch user wallet and current balance would go here.
    // For this example, we assume we have the old balance.
    const oldBalance = 1000.00; // Placeholder for actual DB fetch
    const newBalance = oldBalance - amount;

    // Perform the actual balance update in the database here...

    // 2. Generate SHA256 hash of the transaction details for the audit log
    const hashData = `${userId}:${transactionId}:${amount}:${oldBalance}:${newBalance}`;
    const transactionHash = crypto
      .createHash('sha256')
      .update(hashData)
      .digest('hex');

    // 3. Create the immutable audit log entry
    try {
      await this.auditService.createLog({
        userId,
        vendorId,
        transactionId,
        amount,
        oldBalance,
        newBalance,
        transactionHash,
      });

      return { success: true, newBalance };
    } catch (error) {
      // In a production environment, you might want to handle logging 
      // failures specifically (e.g., retry or alert) since these are critical.
      console.error('Failed to create audit log:', error);
      throw error;
    }
  }
}