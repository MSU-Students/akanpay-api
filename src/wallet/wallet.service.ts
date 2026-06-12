import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Wallet, Vendor, VendorTransaction } from 'src/entities';
import { TransactionStatus } from 'src/enums';
import { AuditService } from './audit.service';
import { WalletPaymentDto, WalletTransactionQueryDto, SettleTransactionDto } from 'src/dto';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorTransaction)
    private readonly transactionRepository: Repository<VendorTransaction>,
    private readonly auditService: AuditService,
  ) {}

  async getWallet(userId: number): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async listTransactions(userId: number, query: WalletTransactionQueryDto) {
    const where: Record<string, unknown> = { studentId: userId };
    if (query.status) where.status = query.status;
    if (query.from && query.to) {
      where.createdAt = Between(new Date(query.from), new Date(query.to));
    }
    return this.transactionRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async createPayment(userId: number, dto: WalletPaymentDto) {
    const wallet = await this.getWallet(userId);
    const vendor = await this.vendorRepository.findOne({
      where: { id: dto.vendorId },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    if (Number(wallet.availableBalance) < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const reference = crypto.randomUUID();
    const oldBalance = Number(wallet.availableBalance);
    const newBalance = oldBalance - dto.amount;

    wallet.availableBalance = newBalance;
    await this.walletRepository.save(wallet);

    const transaction = this.transactionRepository.create({
      vendorId: dto.vendorId,
      studentId: userId,
      reference,
      amount: dto.amount,
      status: TransactionStatus.Pending,
    });
    const saved = await this.transactionRepository.save(transaction);

    const hashData = `${userId}:${saved.id}:${dto.amount}:${oldBalance}:${newBalance}`;
    const transactionHash = crypto.createHash('sha256').update(hashData).digest('hex');

    await this.auditService.createLog({
      userId: String(userId),
      vendorId: String(dto.vendorId),
      transactionId: String(saved.id),
      amount: dto.amount,
      oldBalance,
      newBalance,
      transactionHash,
    });

    return { reference, status: saved.status, amount: dto.amount };
  }

  async settleTransaction(id: number, dto: SettleTransactionDto) {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) throw new NotFoundException('Transaction not found');

    transaction.status = dto.status;
    transaction.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    return this.transactionRepository.save(transaction);
  }

  async getAdminSummary(date: string) {
    if (!date) throw new BadRequestException('date is required');
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    if (isNaN(start.getTime())) throw new BadRequestException('Invalid date');

    const totals = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'totalAmount')
      .addSelect('COUNT(t.id)', 'txnCount')
      .where('t.status = :status', { status: TransactionStatus.Success })
      .andWhere('t.paidAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    return {
      date,
      totalAmount: Number(totals?.totalAmount ?? 0),
      txnCount: Number(totals?.txnCount ?? 0),
    };
  }
}
