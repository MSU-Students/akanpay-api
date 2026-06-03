import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import * as crypto from 'crypto';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { SettlementReport } from '../entities/settlement-report.entity';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Injectable()
export class VendorTransactionService {

  constructor(
    @InjectRepository(Transaction)
    private txnRepo: Repository<Transaction>,

    @InjectRepository(SettlementReport)
    private settlementRepo: Repository<SettlementReport>,
  ) {}

  // --- Get all transactions for a vendor, filterable by status + date range ---
  async getTransactions(vendorId: string, query: QueryTransactionsDto) {
    const where: FindOptionsWhere<Transaction> = { vendorId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.from && query.to) {
      where.createdAt = Between(
        new Date(query.from),
        new Date(query.to + 'T23:59:59'),
      );
    }

    return this.txnRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  // --- Get a single transaction (vendor verifies a payment) ---
  async getOne(vendorId: string, transactionId: string) {
    const txn = await this.txnRepo.findOne({
      where: { id: transactionId, vendorId },
    });
    if (!txn) throw new NotFoundException('Transaction not found');
    return txn;
  }

  // --- Confirm a pending transaction ---
  async confirmTransaction(vendorId: string, transactionId: string) {
    const txn = await this.getOne(vendorId, transactionId);

    if (txn.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Only PENDING transactions can be confirmed');
    }

    txn.status      = TransactionStatus.COMPLETED;
    txn.isConfirmed = true;
    txn.confirmedAt = new Date();

    await this.txnRepo.save(txn);
    await this.updateSettlementReport(vendorId, txn.amount);

    return txn;
  }

  // --- Get daily settlement report for a vendor ---
  async getSettlements(vendorId: string, from?: string, to?: string) {
    const where: FindOptionsWhere<SettlementReport> = { vendorId };

    if (from && to) {
      where.reportDate = Between(from, to) as any;
    }

    return this.settlementRepo.find({
      where,
      order: { reportDate: 'DESC' },
    });
  }

  // --- Internal: update or create today's settlement row ---
  private async updateSettlementReport(vendorId: string, amount: number) {
    const today = new Date().toISOString().split('T')[0];

    let report = await this.settlementRepo.findOne({
      where: { vendorId, reportDate: today },
    });

    if (!report) {
      report = this.settlementRepo.create({
        vendorId,
        reportDate: today,
        totalReceived: 0,
        txnCount: 0,
      });
    }

    report.totalReceived = Number(report.totalReceived) + Number(amount);
    report.txnCount += 1;

    await this.settlementRepo.save(report);
  }

  // --- Security: generate txnHash for a new transaction ---
  static generateTxnHash(studentId: string, vendorId: string, amount: number, timestamp: string): string {
    return crypto
      .createHash('sha256')
      .update(`${studentId}${vendorId}${amount}${timestamp}`)
      .digest('hex');
  }
}