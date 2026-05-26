import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../entities/vendor.entity';
import { CreateVendorDto } from './create-vendor.dto';
import { UpdateVendorDto } from './update-vendor.dto';
import * as bcrypt from 'bcrypt';
import { CryptoService } from '../common/crypto.service'; // Adjust based on your global crypto service path

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
    private readonly cryptoService: CryptoService,
  ) {}

  // 1. REGISTRATION LOGIC
  async register(dto: CreateVendorDto): Promise<Omit<Vendor, 'passwordHash' | 'encryptedGcashNumber'>> {
    const existingVendor = await this.vendorRepository.findOne({
      where: [{ email: dto.email }, { vendorCode: dto.vendorCode }],
    });

    if (existingVendor) {
      throw new ConflictException('A vendor with this email or Vendor Code already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const encryptedGcashNumber = this.cryptoService.encrypt(dto.gcashNumber);

    const newVendor = this.vendorRepository.create({
      businessName: dto.businessName,
      vendorCode: dto.vendorCode,
      ownerName: dto.ownerName,
      email: dto.email,
      passwordHash,
      encryptedGcashNumber,
      status: 'PENDING',
      role: 'VENDOR',
    });

    const savedVendor = await this.vendorRepository.save(newVendor);
    const { passwordHash: _, encryptedGcashNumber: __, ...sanitized } = savedVendor;
    return sanitized;
  }

  // 2. PROFILE UPDATE / EDITING LOGIC
  async update(id: string, dto: UpdateVendorDto): Promise<Omit<Vendor, 'passwordHash' | 'encryptedGcashNumber'>> {
    const vendor = await this.vendorRepository.findOne({ where: { id } });
    if (!vendor) {
      throw new NotFoundException('Vendor profile not found.');
    }

    // Verify system conflicts if uniquely constraint metrics are changing
    if (dto.email || dto.vendorCode) {
      const conflictCheck = await this.vendorRepository.findOne({
        where: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.vendorCode ? [{ vendorCode: dto.vendorCode }] : []),
        ],
      });
      
      if (conflictCheck && conflictCheck.id !== id) {
        throw new ConflictException('Email or Vendor Code is already assigned to another account.');
      }
    }

    // Re-hash if password is being edited
    if (dto.password) {
      vendor.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    // Re-encrypt if GCash information is being edited
    if (dto.gcashNumber) {
      vendor.encryptedGcashNumber = this.cryptoService.encrypt(dto.gcashNumber);
    }

    // Update the remaining fields if provided
    if (dto.businessName) vendor.businessName = dto.businessName;
    if (dto.ownerName) vendor.ownerName = dto.ownerName;
    if (dto.email) vendor.email = dto.email;
    if (dto.vendorCode) vendor.vendorCode = dto.vendorCode;

    // TypeORM pre-compiles this into a safe parameterized SQL query
    const updatedVendor = await this.vendorRepository.save(vendor);

    const { passwordHash: _, encryptedGcashNumber: __, ...sanitized } = updatedVendor;
    return sanitized;
  }

  // 3. READ PROFILE (Helper to view currently stored profile details safely)
  async findOne(id: string) {
    const vendor = await this.vendorRepository.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor profile not found.');

    const decryptedGcash = this.cryptoService.decrypt(vendor.encryptedGcashNumber);
    
    const { passwordHash: _, encryptedGcashNumber: __, ...sanitized } = vendor;
    return {
      ...sanitized,
      gcashNumber: decryptedGcash,
    };
  }
}