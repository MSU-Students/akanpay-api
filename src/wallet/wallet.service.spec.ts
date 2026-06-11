import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Vendor,
  VendorTransaction,
  Wallet,
  WalletLedgerEntry,
} from 'src/entities';
import { TransactionStatus, WalletLedgerType } from 'src/enums';
import { UserService } from 'src/user/user.service';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  let service: WalletService;
  let walletRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let vendorRepo: {
    findOne: jest.Mock;
  };
  let transactionRepo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let ledgerRepo: {
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let userService: {
    findById: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };
  let auditService: {
    createLog: jest.Mock;
  };

  beforeEach(async () => {
    walletRepo = {
      findOne: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
    };
    vendorRepo = {
      findOne: jest.fn(),
    };
    transactionRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve({ id: 10, ...entity })),
    };
    ledgerRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve({ id: 20, ...entity })),
    };
    userService = {
      findById: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn((callback) =>
        callback({
          getRepository: repositoryFor,
        }),
      ),
    };
    auditService = {
      createLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(Wallet), useValue: walletRepo },
        { provide: getRepositoryToken(Vendor), useValue: vendorRepo },
        {
          provide: getRepositoryToken(VendorTransaction),
          useValue: transactionRepo,
        },
        {
          provide: getRepositoryToken(WalletLedgerEntry),
          useValue: ledgerRepo,
        },
        { provide: UserService, useValue: userService },
        { provide: DataSource, useValue: dataSource },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  function repositoryFor(entity: unknown): Repository<unknown> {
    if (entity === Wallet) return walletRepo as unknown as Repository<unknown>;
    if (entity === VendorTransaction) {
      return transactionRepo as unknown as Repository<unknown>;
    }
    if (entity === WalletLedgerEntry) {
      return ledgerRepo as unknown as Repository<unknown>;
    }
    throw new Error('Unexpected repository');
  }

  it('tops up a wallet and writes a credit ledger entry', async () => {
    userService.findById.mockResolvedValue({ id: 7 });
    walletRepo.findOne.mockResolvedValue({
      userId: 7,
      availableBalance: 50,
      pendingBalance: 5,
      currency: 'NGN',
    });
    ledgerRepo.findOne.mockResolvedValue(null);

    const result = await service.topUpWallet(7, {
      amount: 100,
      reference: 'TOP-001',
      reason: 'Cash deposit',
    });

    expect(result.wallet.availableBalance).toBe(150);
    expect(ledgerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        reference: 'TOP-001',
        type: WalletLedgerType.Credit,
        amount: 100,
        availableBefore: 50,
        availableAfter: 150,
        pendingBefore: 5,
        pendingAfter: 5,
        reason: 'Cash deposit',
      }),
    );
  });

  it('rejects a duplicate wallet top-up reference', async () => {
    userService.findById.mockResolvedValue({ id: 7 });
    ledgerRepo.findOne.mockResolvedValue({ id: 20 });

    await expect(
      service.topUpWallet(7, { amount: 50, reference: 'TOP-001' }),
    ).rejects.toThrow(ConflictException);
  });

  it('requires the user to exist before topping up', async () => {
    userService.findById.mockResolvedValue(null);

    await expect(service.topUpWallet(404, { amount: 50 })).rejects.toThrow(
      NotFoundException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('creates a payment hold ledger entry when paying a vendor', async () => {
    userService.findById.mockResolvedValue({
      id: 7,
      isStudentVerified: true,
    });
    vendorRepo.findOne.mockResolvedValue({ id: 3 });
    walletRepo.findOne.mockResolvedValue({
      userId: 7,
      availableBalance: 200,
      pendingBalance: 20,
      currency: 'NGN',
    });

    await service.createPayment(7, { vendorId: 3, amount: 75 });

    expect(walletRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        availableBalance: 125,
        pendingBalance: 95,
      }),
    );
    expect(ledgerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        transactionId: 10,
        type: WalletLedgerType.PaymentHold,
        amount: 75,
        availableBefore: 200,
        availableAfter: 125,
        pendingBefore: 20,
        pendingAfter: 95,
      }),
    );
  });

  it('rejects payment when available balance is insufficient', async () => {
    userService.findById.mockResolvedValue({
      id: 7,
      isStudentVerified: true,
    });
    vendorRepo.findOne.mockResolvedValue({ id: 3 });
    walletRepo.findOne.mockResolvedValue({
      userId: 7,
      availableBalance: 10,
      pendingBalance: 0,
      currency: 'NGN',
    });

    await expect(
      service.createPayment(7, { vendorId: 3, amount: 75 }),
    ).rejects.toThrow(BadRequestException);
    expect(ledgerRepo.save).not.toHaveBeenCalled();
  });

  it('writes a refund ledger entry when a pending payment fails', async () => {
    transactionRepo.findOne.mockResolvedValue({
      id: 10,
      studentId: 7,
      reference: 'PAY-1',
      amount: 75,
      status: TransactionStatus.Pending,
    });
    walletRepo.findOne.mockResolvedValue({
      userId: 7,
      availableBalance: 125,
      pendingBalance: 95,
      currency: 'NGN',
    });

    await service.settleTransaction(10, { status: TransactionStatus.Failed });

    expect(walletRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        availableBalance: 200,
        pendingBalance: 20,
      }),
    );
    expect(ledgerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        transactionId: 10,
        reference: 'PAY-1:refund',
        type: WalletLedgerType.Refund,
        amount: 75,
        availableBefore: 125,
        availableAfter: 200,
        pendingBefore: 95,
        pendingAfter: 20,
      }),
    );
  });
});
