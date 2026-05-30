import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VendorService } from './vendor.service';
import { Vendor, VendorTransaction, VendorUser } from 'src/entities';
import { Role, TransactionStatus, VendorUserRole } from 'src/enums';
import { UserService } from 'src/user/user.service';

describe('VendorService', () => {
  let service: VendorService;

  // Chainable query-builder mock used by the settlement aggregation.
  let qb: {
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    getRawOne: jest.Mock;
  };
  let vendorsRepo: { findOne: jest.Mock; create: jest.Mock; save: jest.Mock };
  let vendorUsersRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let txnRepo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let userService: { findById: jest.Mock; ensureRole: jest.Mock };

  beforeEach(async () => {
    qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    // create() echoes the entity; save() returns it with an id.
    const echo = jest.fn((entity) => entity);
    const persist = jest.fn((entity) => Promise.resolve({ id: 1, ...entity }));

    vendorsRepo = { findOne: jest.fn(), create: echo, save: persist };
    vendorUsersRepo = {
      findOne: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
    };
    txnRepo = {
      createQueryBuilder: jest.fn(() => qb),
      findOne: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      find: jest.fn(),
    };
    userService = { findById: jest.fn(), ensureRole: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorService,
        { provide: getRepositoryToken(Vendor), useValue: vendorsRepo },
        { provide: getRepositoryToken(VendorUser), useValue: vendorUsersRepo },
        { provide: getRepositoryToken(VendorTransaction), useValue: txnRepo },
        { provide: UserService, useValue: userService },
      ],
    }).compile();

    service = module.get<VendorService>(VendorService);
  });

  // Returns the { start, end } object passed to the "paidAt BETWEEN" filter.
  function capturedRange(): { start: Date; end: Date } {
    const call = qb.andWhere.mock.calls.find(
      (c) => typeof c[0] === 'string' && c[0].includes('BETWEEN'),
    );
    return call?.[1] as { start: Date; end: Date };
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createVendor', () => {
    it('rejects a duplicate vendor name', async () => {
      vendorsRepo.findOne.mockResolvedValue({ id: 1, name: 'Cafe' });
      await expect(service.createVendor({ name: 'Cafe' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('creates and saves a new vendor (campus defaults to null)', async () => {
      vendorsRepo.findOne.mockResolvedValue(null);
      await service.createVendor({ name: 'Cafe' });
      expect(vendorsRepo.create).toHaveBeenCalledWith({
        name: 'Cafe',
        campus: null,
      });
      expect(vendorsRepo.save).toHaveBeenCalled();
    });
  });

  describe('addUserToVendor', () => {
    it('throws when the vendor does not exist', async () => {
      vendorsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.addUserToVendor(1, { userId: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the user does not exist', async () => {
      vendorsRepo.findOne.mockResolvedValue({ id: 1 });
      userService.findById.mockResolvedValue(null);
      await expect(
        service.addUserToVendor(1, { userId: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the user is already assigned', async () => {
      vendorsRepo.findOne.mockResolvedValue({ id: 1 });
      userService.findById.mockResolvedValue({ id: 5 });
      vendorUsersRepo.findOne.mockResolvedValue({ id: 9 });
      await expect(
        service.addUserToVendor(1, { userId: 5 }),
      ).rejects.toThrow(ConflictException);
    });

    it('links the user and grants the vendor role', async () => {
      vendorsRepo.findOne.mockResolvedValue({ id: 1 });
      userService.findById.mockResolvedValue({ id: 5 });
      vendorUsersRepo.findOne.mockResolvedValue(null);

      await service.addUserToVendor(1, { userId: 5 });

      expect(vendorUsersRepo.create).toHaveBeenCalledWith({
        vendorId: 1,
        userId: 5,
        role: VendorUserRole.Staff,
      });
      expect(userService.ensureRole).toHaveBeenCalledWith(5, Role.Vendor);
      expect(vendorUsersRepo.save).toHaveBeenCalled();
    });
  });

  describe('assertVendorAccess', () => {
    it('forbids when there is no user id', async () => {
      await expect(service.assertVendorAccess(0, 1, [])).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows an admin without a membership lookup', async () => {
      await expect(
        service.assertVendorAccess(7, 1, [Role.Admin]),
      ).resolves.toBeUndefined();
      expect(vendorUsersRepo.findOne).not.toHaveBeenCalled();
    });

    it('allows a vendor member', async () => {
      vendorUsersRepo.findOne.mockResolvedValue({ id: 9 });
      await expect(
        service.assertVendorAccess(7, 1, [Role.Vendor]),
      ).resolves.toBeUndefined();
    });

    it('forbids a non-member', async () => {
      vendorUsersRepo.findOne.mockResolvedValue(null);
      await expect(
        service.assertVendorAccess(7, 1, [Role.Vendor]),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('recordTransaction', () => {
    it('throws when the vendor does not exist', async () => {
      vendorsRepo.findOne.mockResolvedValue(null);
      await expect(
        service.recordTransaction(1, { reference: 'R1', amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an invalid paidAt timestamp', async () => {
      vendorsRepo.findOne.mockResolvedValue({ id: 1 });
      await expect(
        service.recordTransaction(1, {
          reference: 'R1',
          amount: 100,
          paidAt: 'not-a-date',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('applies defaults (fee 0, NGN, pending) and leaves paidAt null', async () => {
      vendorsRepo.findOne.mockResolvedValue({ id: 1 });
      await service.recordTransaction(1, { reference: 'R1', amount: 100 });
      const created = txnRepo.create.mock.calls[0][0];
      expect(created.fee).toBe(0);
      expect(created.currency).toBe('NGN');
      expect(created.status).toBe(TransactionStatus.Pending);
      expect(created.paidAt).toBeNull();
    });

    it('stamps paidAt when a successful transaction has no explicit paidAt', async () => {
      vendorsRepo.findOne.mockResolvedValue({ id: 1 });
      await service.recordTransaction(1, {
        reference: 'R1',
        amount: 100,
        status: TransactionStatus.Success,
      });
      const created = txnRepo.create.mock.calls[0][0];
      expect(created.paidAt).toBeInstanceOf(Date);
    });
  });

  describe('verifyTransaction', () => {
    it('requires a reference', async () => {
      await expect(service.verifyTransaction(1, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when the transaction is not found', async () => {
      txnRepo.findOne.mockResolvedValue(null);
      await expect(service.verifyTransaction(1, 'R1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the public transaction summary', async () => {
      txnRepo.findOne.mockResolvedValue({
        reference: 'R1',
        status: TransactionStatus.Success,
        amount: 100,
        currency: 'NGN',
        paidAt: null,
        updatedAt: new Date('2026-05-27T10:00:00.000Z'),
        secretColumn: 'should-not-leak',
      });

      const result = await service.verifyTransaction(1, 'R1');

      expect(result).toEqual({
        reference: 'R1',
        status: TransactionStatus.Success,
        amount: 100,
        currency: 'NGN',
        paidAt: null,
        updatedAt: new Date('2026-05-27T10:00:00.000Z'),
      });
      expect(result).not.toHaveProperty('secretColumn');
    });
  });

  describe('pollTransactions', () => {
    it('rejects an invalid "since" timestamp', async () => {
      await expect(
        service.pollTransactions(1, { since: 'nope' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('scopes to the vendor and caps at 100 newest rows', async () => {
      txnRepo.find.mockResolvedValue([]);
      await service.pollTransactions(1, {});
      expect(txnRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vendorId: 1 },
          order: { updatedAt: 'DESC' },
          take: 100,
        }),
      );
    });

    it('applies status and since filters', async () => {
      txnRepo.find.mockResolvedValue([]);
      await service.pollTransactions(1, {
        status: TransactionStatus.Success,
        since: '2026-05-01T00:00:00.000Z',
      });
      const arg = txnRepo.find.mock.calls[0][0];
      expect(arg.where.status).toBe(TransactionStatus.Success);
      expect(arg.where.updatedAt).toBeDefined();
    });
  });

  describe('settlement aggregation (totals)', () => {
    it('coerces string sums to numbers and computes net', async () => {
      qb.getRawOne.mockResolvedValue({
        totalGross: '300.00',
        totalFees: '15.00',
        transactionCount: '2',
      });

      const result = await service.getDailySettlementReport(1, '2026-05-27');

      expect(result.totalGross).toBe(300);
      expect(result.totalFees).toBe(15);
      expect(result.totalNet).toBe(285);
      expect(result.transactionCount).toBe(2);
    });

    it('defaults to zeros when no rows match', async () => {
      qb.getRawOne.mockResolvedValue(undefined);

      const result = await service.getMonthlySettlementReport(1, '2026-05');

      expect(result.totalGross).toBe(0);
      expect(result.totalFees).toBe(0);
      expect(result.totalNet).toBe(0);
      expect(result.transactionCount).toBe(0);
    });
  });

  describe('getDailySettlementReport', () => {
    beforeEach(() => qb.getRawOne.mockResolvedValue({}));

    it('rejects a missing date', async () => {
      await expect(service.getDailySettlementReport(1, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an invalid date', async () => {
      await expect(
        service.getDailySettlementReport(1, 'not-a-date'),
      ).rejects.toThrow(BadRequestException);
    });

    it('queries the full UTC day and echoes the date', async () => {
      const result = await service.getDailySettlementReport(1, '2026-05-27');

      expect(result.date).toBe('2026-05-27');
      const { start, end } = capturedRange();
      expect(start.toISOString()).toBe('2026-05-27T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-05-27T23:59:59.999Z');
    });
  });

  describe('getWeeklySettlementReport', () => {
    beforeEach(() => qb.getRawOne.mockResolvedValue({}));

    it('rejects a missing date', async () => {
      await expect(service.getWeeklySettlementReport(1, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an invalid date', async () => {
      await expect(
        service.getWeeklySettlementReport(1, 'nope'),
      ).rejects.toThrow(BadRequestException);
    });

    it('uses the Monday-Sunday week containing a mid-week date', async () => {
      // 2026-05-27 is a Wednesday -> week is Mon 2026-05-25 .. Sun 2026-05-31
      const result = await service.getWeeklySettlementReport(1, '2026-05-27');

      expect(result.period).toBe('weekly');
      expect(result.weekStart).toBe('2026-05-25');
      expect(result.weekEnd).toBe('2026-05-31');
      const { start, end } = capturedRange();
      expect(start.toISOString()).toBe('2026-05-25T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-05-31T23:59:59.999Z');
    });

    it('treats Monday as the first day of its own week', async () => {
      const result = await service.getWeeklySettlementReport(1, '2026-05-25');
      expect(result.weekStart).toBe('2026-05-25');
      expect(result.weekEnd).toBe('2026-05-31');
    });

    it('treats Sunday as the last day of the same week', async () => {
      const result = await service.getWeeklySettlementReport(1, '2026-05-31');
      expect(result.weekStart).toBe('2026-05-25');
      expect(result.weekEnd).toBe('2026-05-31');
    });
  });

  describe('getMonthlySettlementReport', () => {
    beforeEach(() => qb.getRawOne.mockResolvedValue({}));

    it('rejects a missing month', async () => {
      await expect(service.getMonthlySettlementReport(1, '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an invalid month', async () => {
      await expect(
        service.getMonthlySettlementReport(1, '2026-13'),
      ).rejects.toThrow(BadRequestException);
    });

    it('queries the whole calendar month and echoes the month', async () => {
      const result = await service.getMonthlySettlementReport(1, '2026-05');

      expect(result.period).toBe('monthly');
      expect(result.month).toBe('2026-05');
      const { start, end } = capturedRange();
      expect(start.toISOString()).toBe('2026-05-01T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-05-31T23:59:59.999Z');
    });

    it('handles February (non-leap year) correctly', async () => {
      await service.getMonthlySettlementReport(1, '2026-02');
      const { start, end } = capturedRange();
      expect(start.toISOString()).toBe('2026-02-01T00:00:00.000Z');
      expect(end.toISOString()).toBe('2026-02-28T23:59:59.999Z');
    });
  });
});
