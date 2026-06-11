import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  SettleTransactionDto,
  WalletLedgerQueryDto,
  WalletPaymentDto,
  WalletTopUpDto,
  WalletTransactionQueryDto,
} from 'src/dto';
import {
  Vendor,
  VendorTransaction,
  Wallet,
  WalletLedgerEntry,
} from 'src/entities';
import { TransactionStatus, WalletLedgerType } from 'src/enums';
import { UserService } from 'src/user/user.service';
import { AuditService } from './audit.service';

type LedgerInput = {
  userId: number;
  transactionId?: number | null;
  reference: string;
  type: WalletLedgerType;
  amount: number;
  availableBefore: number;
  availableAfter: number;
  pendingBefore: number;
  pendingAfter: number;
  currency: string;
  reason?: string | null;
};

type AuditInput = {
  userId: number;
  vendorId?: number | null;
  transactionId?: number | string | null;
  reference: string;
  amount: number;
  oldBalance: number;
  newBalance: number;
};

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorTransaction)
    private readonly transactionRepository: Repository<VendorTransaction>,
    @InjectRepository(WalletLedgerEntry)
    private readonly ledgerRepository: Repository<WalletLedgerEntry>,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async getWallet(userId: number) {
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    if (wallet) return wallet;

    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const created = this.walletRepository.create({
      userId,
      availableBalance: 0,
      pendingBalance: 0,
      currency: 'NGN',
    });
    return this.walletRepository.save(created);
  }

  async listTransactions(userId: number, query: WalletTransactionQueryDto) {
    const qb = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.studentId = :studentId', { studentId: userId });

    if (query.status) {
      qb.andWhere('transaction.status = :status', { status: query.status });
    }
    const { from, to } = this.parseDateRange(query.from, query.to);
    if (from) {
      qb.andWhere('transaction.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('transaction.createdAt <= :to', { to });
    }

    return qb.orderBy('transaction.createdAt', 'DESC').getMany();
  }

  async listLedgerEntries(userId: number, query: WalletLedgerQueryDto) {
    const qb = this.ledgerRepository
      .createQueryBuilder('entry')
      .where('entry.userId = :userId', { userId });

    if (query.type) {
      qb.andWhere('entry.type = :type', { type: query.type });
    }
    const { from, to } = this.parseDateRange(query.from, query.to);
    if (from) {
      qb.andWhere('entry.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('entry.createdAt <= :to', { to });
    }

    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
    return qb.orderBy('entry.createdAt', 'DESC').take(limit).getMany();
  }

  async topUpWallet(userId: number, dto: WalletTopUpDto) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const amount = this.normalizeMoney(dto.amount);
    const reference = dto.reference?.trim() || `TOPUP-${randomUUID()}`;
    const reason = dto.reason?.trim() || 'Admin wallet top-up';

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const ledgerRepo = manager.getRepository(WalletLedgerEntry);

      const duplicate = await ledgerRepo.findOne({ where: { reference } });
      if (duplicate) {
        throw new ConflictException('Wallet ledger reference already exists');
      }

      let wallet = await walletRepo.findOne({
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        wallet = walletRepo.create({
          userId,
          availableBalance: 0,
          pendingBalance: 0,
          currency: 'NGN',
        });
      }

      const availableBefore = Number(wallet.availableBalance);
      const pendingBefore = Number(wallet.pendingBalance);
      wallet.availableBalance = this.normalizeMoney(availableBefore + amount);
      const savedWallet = await walletRepo.save(wallet);
      const availableAfter = Number(savedWallet.availableBalance);
      const pendingAfter = Number(savedWallet.pendingBalance);

      const ledger = await this.appendLedgerEntry(manager, {
        userId,
        reference,
        type: WalletLedgerType.Credit,
        amount,
        availableBefore,
        availableAfter,
        pendingBefore,
        pendingAfter,
        currency: savedWallet.currency,
        reason,
      });

      await this.recordAuditLog({
        userId,
        transactionId: reference,
        reference,
        amount,
        oldBalance: this.totalBalance(availableBefore, pendingBefore),
        newBalance: this.totalBalance(availableAfter, pendingAfter),
      });

      return {
        wallet: savedWallet,
        ledger,
      };
    });
  }

  async createPayment(userId: number, dto: WalletPaymentDto) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.isStudentVerified) {
      throw new ForbiddenException('Student verification required');
    }

    const vendor = await this.vendorRepository.findOne({
      where: { id: dto.vendorId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return this.dataSource.transaction(async (manager) => {
      const walletRepo = manager.getRepository(Wallet);
      const txRepo = manager.getRepository(VendorTransaction);

      const wallet = await walletRepo.findOne({ where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const available = Number(wallet.availableBalance);
      if (available < dto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const pendingBefore = Number(wallet.pendingBalance);
      const reference = `PAY-${randomUUID()}`;
      wallet.availableBalance = this.normalizeMoney(available - dto.amount);
      wallet.pendingBalance = this.normalizeMoney(pendingBefore + dto.amount);
      await walletRepo.save(wallet);

      const transaction = txRepo.create({
        vendorId: vendor.id,
        studentId: userId,
        reference,
        amount: dto.amount,
        fee: 0,
        currency: wallet.currency,
        status: TransactionStatus.Pending,
      });

      const savedTransaction = await txRepo.save(transaction);
      const availableAfter = Number(wallet.availableBalance);
      const pendingAfter = Number(wallet.pendingBalance);

      await this.appendLedgerEntry(manager, {
        userId,
        transactionId: savedTransaction.id,
        reference: `${reference}:HOLD`,
        type: WalletLedgerType.PaymentHold,
        amount: dto.amount,
        availableBefore: available,
        availableAfter,
        pendingBefore,
        pendingAfter,
        currency: wallet.currency,
        reason: `Payment hold for vendor ${vendor.id}`,
      });

      await this.recordAuditLog({
        userId,
        vendorId: vendor.id,
        transactionId: savedTransaction.id,
        reference,
        amount: dto.amount,
        oldBalance: this.totalBalance(available, pendingBefore),
        newBalance: this.totalBalance(availableAfter, pendingAfter),
      });

      return savedTransaction;
    });
  }

  async settleTransaction(transactionId: number, dto: SettleTransactionDto) {
    if (
      dto.status !== TransactionStatus.Success &&
      dto.status !== TransactionStatus.Failed
    ) {
      throw new BadRequestException('Invalid status');
    }

    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(VendorTransaction);
      const walletRepo = manager.getRepository(Wallet);

      const transaction = await txRepo.findOne({
        where: { id: transactionId },
      });
      if (!transaction) throw new NotFoundException('Transaction not found');
      if (transaction.status !== TransactionStatus.Pending) {
        throw new BadRequestException('Transaction already settled');
      }
      if (!transaction.studentId) {
        throw new BadRequestException('Transaction missing student');
      }

      const wallet = await walletRepo.findOne({
        where: { userId: transaction.studentId },
      });
      if (!wallet) throw new NotFoundException('Wallet not found');

      const amount = Number(transaction.amount);
      const availableBefore = Number(wallet.availableBalance);
      const pendingBefore = Number(wallet.pendingBalance);
      wallet.pendingBalance = this.normalizeMoney(pendingBefore - amount);

      if (dto.status === TransactionStatus.Failed) {
        wallet.availableBalance = this.normalizeMoney(availableBefore + amount);
      }

      transaction.status = dto.status;
      transaction.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

      await walletRepo.save(wallet);
      const savedTransaction = await txRepo.save(transaction);
      const availableAfter = Number(wallet.availableBalance);
      const pendingAfter = Number(wallet.pendingBalance);

      const type =
        dto.status === TransactionStatus.Success
          ? WalletLedgerType.PaymentRelease
          : WalletLedgerType.Refund;
      await this.appendLedgerEntry(manager, {
        userId: transaction.studentId,
        transactionId: transaction.id,
        reference: `${transaction.reference}:${type}`,
        type,
        amount,
        availableBefore,
        availableAfter,
        pendingBefore,
        pendingAfter,
        currency: wallet.currency,
        reason:
          dto.status === TransactionStatus.Success
            ? 'Payment settled successfully'
            : 'Payment failed and funds returned',
      });

      await this.recordAuditLog({
        userId: transaction.studentId,
        vendorId: transaction.vendorId,
        transactionId: transaction.id,
        reference: transaction.reference,
        amount,
        oldBalance: this.totalBalance(availableBefore, pendingBefore),
        newBalance: this.totalBalance(availableAfter, pendingAfter),
      });

      return savedTransaction;
    });
  }

  async getAdminSummary(date: string) {
    if (!date) throw new BadRequestException('Date is required');
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    const totals = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'totalGross')
      .addSelect('COUNT(transaction.id)', 'transactionCount')
      .where('transaction.status = :status', {
        status: TransactionStatus.Success,
      })
      .andWhere('transaction.paidAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    return {
      date,
      totalGross: Number(totals?.totalGross ?? 0),
      transactionCount: Number(totals?.transactionCount ?? 0),
    };
  }

  private async appendLedgerEntry(manager: EntityManager, input: LedgerInput) {
    const ledgerRepo = manager.getRepository(WalletLedgerEntry);
    const ledger = ledgerRepo.create({
      ...input,
      amount: this.normalizeMoney(input.amount),
      availableBefore: this.normalizeMoney(input.availableBefore),
      availableAfter: this.normalizeMoney(input.availableAfter),
      pendingBefore: this.normalizeMoney(input.pendingBefore),
      pendingAfter: this.normalizeMoney(input.pendingAfter),
      reason: input.reason ?? null,
    });
    return ledgerRepo.save(ledger);
  }

  private async recordAuditLog(input: AuditInput) {
    const oldBalance = this.normalizeMoney(input.oldBalance);
    const newBalance = this.normalizeMoney(input.newBalance);
    const transactionHash = createHash('sha256')
      .update(
        [
          input.userId,
          input.vendorId ?? '',
          input.transactionId ?? '',
          input.reference,
          input.amount,
          oldBalance,
          newBalance,
        ].join(':'),
      )
      .digest('hex');

    await this.auditService.createLog({
      userId: String(input.userId),
      vendorId: input.vendorId == null ? null : String(input.vendorId),
      transactionId:
        input.transactionId == null ? null : String(input.transactionId),
      amount: input.amount,
      oldBalance,
      newBalance,
      transactionHash,
    });
  }

  private normalizeMoney(value: number): number {
    return Number(Number(value).toFixed(2));
  }

  private totalBalance(
    availableBalance: number,
    pendingBalance: number,
  ): number {
    return this.normalizeMoney(availableBalance + pendingBalance);
  }

  private parseDateRange(fromValue?: string, toValue?: string) {
    const from = fromValue ? new Date(fromValue) : null;
    const to = toValue ? new Date(toValue) : null;
    if (
      (from && Number.isNaN(from.getTime())) ||
      (to && Number.isNaN(to.getTime()))
    ) {
      throw new BadRequestException('Invalid date range');
    }
    if (from && to && from > to) {
      throw new BadRequestException('Invalid date range');
    }
    return { from, to };
  }
}
