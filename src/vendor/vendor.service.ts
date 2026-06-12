import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import {
  AddVendorUserDto,
  CreateVendorDto,
  PollVendorTransactionsDto,
  RecordVendorTransactionDto,
} from 'src/dto';
import { Vendor, VendorTransaction, VendorUser } from 'src/entities';
import { Role, TransactionStatus, VendorUserRole } from 'src/enums';
import { UserService } from 'src/user/user.service';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorsRepository: Repository<Vendor>,
    @InjectRepository(VendorUser)
    private readonly vendorUsersRepository: Repository<VendorUser>,
    @InjectRepository(VendorTransaction)
    private readonly transactionsRepository: Repository<VendorTransaction>,
    private readonly userService: UserService,
  ) {}

  async findAll(): Promise<Vendor[]> {
    return this.vendorsRepository.find();
  }

  async findOne(id: number): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findOne({
      where: { id },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async createVendor(dto: CreateVendorDto) {
    const existing = await this.vendorsRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Vendor already exists');
    }

    const vendor = this.vendorsRepository.create({
      name: dto.name,
      campus: dto.campus ?? null,
    });
    return this.vendorsRepository.save(vendor);
  }

  async addUserToVendor(vendorId: number, dto: AddVendorUserDto) {
    const vendor = await this.vendorsRepository.findOne({
      where: { id: vendorId },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const user = await this.userService.findById(dto.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.vendorUsersRepository.findOne({
      where: { vendorId: vendor.id, userId: user.id },
    });
    if (existing) {
      throw new ConflictException('User already assigned to vendor');
    }

    const vendorUser = this.vendorUsersRepository.create({
      vendorId: vendor.id,
      userId: user.id,
      role: dto.role ?? VendorUserRole.Staff,
    });

    await this.userService.ensureRole(user.id, Role.Vendor);

    return this.vendorUsersRepository.save(vendorUser);
  }

  async assertVendorAccess(userId: number, vendorId: number, roles: Role[]) {
    if (!userId) {
      throw new ForbiddenException();
    }

    if (roles?.includes(Role.Admin)) {
      return;
    }

    const membership = await this.vendorUsersRepository.findOne({
      where: { vendorId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('Vendor access required');
    }
  }

  async recordTransaction(vendorId: number, dto: RecordVendorTransactionDto) {
    const vendor = await this.vendorsRepository.findOne({
      where: { id: vendorId },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : null;
    if (dto.paidAt && Number.isNaN(paidAt?.getTime())) {
      throw new BadRequestException('Invalid paidAt timestamp');
    }

    const transaction = this.transactionsRepository.create({
      vendorId: vendor.id,
      reference: dto.reference,
      amount: dto.amount,
      fee: dto.fee ?? 0,
      currency: dto.currency ?? 'NGN',
      provider: dto.provider ?? null,
      status: dto.status ?? TransactionStatus.Pending,
      paidAt:
        paidAt ??
        (dto.status === TransactionStatus.Success ? new Date() : null),
    });

    return this.transactionsRepository.save(transaction);
  }

  async verifyTransaction(vendorId: number, reference: string) {
    if (!reference) {
      throw new BadRequestException('Reference is required');
    }

    const transaction = await this.transactionsRepository.findOne({
      where: { vendorId, reference },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      paidAt: transaction.paidAt,
      updatedAt: transaction.updatedAt,
    };
  }

  async pollTransactions(vendorId: number, query: PollVendorTransactionsDto) {
    const where: Record<string, unknown> = { vendorId };
    if (query.status) {
      where.status = query.status;
    }

    if (query.since) {
      const sinceDate = new Date(query.since);
      if (Number.isNaN(sinceDate.getTime())) {
        throw new BadRequestException('Invalid since timestamp');
      }
      where.updatedAt = MoreThan(sinceDate);
    }

    return this.transactionsRepository.find({
      where,
      order: { updatedAt: 'DESC' },
      take: 100,
    });
  }

  private async aggregateSettlement(vendorId: number, start: Date, end: Date) {
    const totals = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'totalGross')
      .addSelect('COALESCE(SUM(transaction.fee), 0)', 'totalFees')
      .addSelect('COUNT(transaction.id)', 'transactionCount')
      .where('transaction.vendorId = :vendorId', { vendorId })
      .andWhere('transaction.status = :status', {
        status: TransactionStatus.Success,
      })
      .andWhere('transaction.paidAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    const totalGross = Number(totals?.totalGross ?? 0);
    const totalFees = Number(totals?.totalFees ?? 0);

    return {
      totalGross,
      totalFees,
      totalNet: totalGross - totalFees,
      transactionCount: Number(totals?.transactionCount ?? 0),
    };
  }

  async getDailySettlementReport(vendorId: number, date: string) {
    if (!date) {
      throw new BadRequestException('Date is required');
    }

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    return { date, ...(await this.aggregateSettlement(vendorId, start, end)) };
  }

  async getWeeklySettlementReport(vendorId: number, date: string) {
    if (!date) {
      throw new BadRequestException('Date is required');
    }

    const ref = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(ref.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    // Monday-of-week (ISO): getUTCDay() is 0=Sun..6=Sat
    const diffToMonday = (ref.getUTCDay() + 6) % 7;
    const start = new Date(ref);
    start.setUTCDate(ref.getUTCDate() - diffToMonday);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    return {
      period: 'weekly',
      weekStart: start.toISOString().slice(0, 10),
      weekEnd: end.toISOString().slice(0, 10),
      ...(await this.aggregateSettlement(vendorId, start, end)),
    };
  }

  async getMonthlySettlementReport(vendorId: number, month: string) {
    if (!month) {
      throw new BadRequestException('Month is required');
    }

    const start = new Date(`${month}-01T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid month (expected YYYY-MM)');
    }

    const end = new Date(
      Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    );

    return {
      period: 'monthly',
      month,
      ...(await this.aggregateSettlement(vendorId, start, end)),
    };
  }
}
