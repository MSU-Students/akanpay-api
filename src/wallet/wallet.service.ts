import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Wallet } from 'src/entities/wallet.entity';
import { Vendor, VendorTransaction } from 'src/entities';
import { TransactionStatus } from 'src/enums';
import {
  SettleTransactionDto,
  WalletPaymentDto,
  WalletTransactionQueryDto,
} from 'src/dto';
import { UserService } from 'src/user/user.service';
import { randomUUID } from 'crypto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorTransaction)
    private readonly transactionRepository: Repository<VendorTransaction>,
    private readonly userService: UserService,
    private readonly dataSource: DataSource,
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
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
      throw new BadRequestException('Invalid date range');
    }
    if (from && to && from > to) {
      throw new BadRequestException('Invalid date range');
    }
    if (from) {
      qb.andWhere('transaction.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('transaction.createdAt <= :to', { to });
    }

    return qb.orderBy('transaction.createdAt', 'DESC').getMany();
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

      wallet.availableBalance = Number((available - dto.amount).toFixed(2));
      wallet.pendingBalance = Number(
        (Number(wallet.pendingBalance) + dto.amount).toFixed(2),
      );
      await walletRepo.save(wallet);

      const transaction = txRepo.create({
        vendorId: vendor.id,
        studentId: userId,
        reference: `PAY-${randomUUID()}`,
        amount: dto.amount,
        fee: 0,
        currency: wallet.currency,
        status: TransactionStatus.Pending,
      });

      return txRepo.save(transaction);
    });
  }

  async settleTransaction(transactionId: number, dto: SettleTransactionDto) {
    if (dto.status !== TransactionStatus.Success && dto.status !== TransactionStatus.Failed) {
      throw new BadRequestException('Invalid status');
    }

    return this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(VendorTransaction);
      const walletRepo = manager.getRepository(Wallet);

      const transaction = await txRepo.findOne({ where: { id: transactionId } });
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
      wallet.pendingBalance = Number(
        (Number(wallet.pendingBalance) - amount).toFixed(2),
      );

      if (dto.status === TransactionStatus.Failed) {
        wallet.availableBalance = Number(
          (Number(wallet.availableBalance) + amount).toFixed(2),
        );
      }

      transaction.status = dto.status;
      transaction.paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();

      await walletRepo.save(wallet);
      return txRepo.save(transaction);
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
}
