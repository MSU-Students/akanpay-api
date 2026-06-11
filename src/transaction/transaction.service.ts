import { Injectable, BadRequestException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Wallet } from '../entities/wallet.entity';
import { Transaction } from './transaction.entity';
import { AuditService } from '../wallet/audit.service';

import * as crypto from 'crypto';

@Injectable()
export class TransactionService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,

    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,

    private readonly auditService: AuditService,
  ) {}

  async payVendor(studentId: number, vendorId: number, amount: number) {
    return this.dataSource.transaction(async (manager) => {
      const wallet = await manager.findOne(Wallet, {
        where: { userId: studentId },
      });

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      if (wallet.availableBalance < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const oldBalance = Number(wallet.availableBalance);

      wallet.availableBalance = oldBalance - amount;

      await manager.save(wallet);

      const reference = 'TXN-' + Date.now();

      const transaction = await manager.save(
        Transaction,
        this.transactionRepo.create({
          studentId,
          vendorId,
          amount,
          referenceNo: reference,
          status: 'SUCCESS',
        }),
      );

      const hash = crypto
        .createHash('sha256')
        .update(`${studentId}${vendorId}${amount}${reference}`)
        .digest('hex');

      await this.auditService.createLog({
        userId: String(studentId),
        vendorId: String(vendorId),
        transactionId: String(transaction.id),
        amount,
        oldBalance,
        newBalance: wallet.availableBalance,
        transactionHash: hash,
      });

      return {
        message: 'Payment successful',
        reference,
        balance: wallet.availableBalance,
      };
    });
  }
}
