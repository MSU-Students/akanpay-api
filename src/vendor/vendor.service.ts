import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './vendor.entity';
import { CreateVendorDto } from './create-vendor.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  async create(createVendorDto: CreateVendorDto): Promise<Omit<Vendor, 'passwordHash'>> {
    // 1. Check if the vendor code or email already exists
    const existingVendor = await this.vendorRepository.findOne({
      where: [
        { vendorCode: createVendorDto.vendorCode },
        { email: createVendorDto.email }
      ]
    });

    if (existingVendor) {
      throw new ConflictException('Vendor with this code or email already exists.');
    }

    // 2. Security Requirement: Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(createVendorDto.password, salt);

    // 3. Database Security Requirement: Encryption at rest for Bank Account
    // For now, we will dummy encrypt it. (In production, you use an AES-256 CryptoService)
    const encryptedBankAccount = `ENC_${Buffer.from(createVendorDto.bankAccountNumber).toString('base64')}`;

    // 4. Create the record securely using TypeORM Parameterized Save
    const newVendor = this.vendorRepository.create({
      businessName: createVendorDto.businessName,
      vendorCode: createVendorDto.vendorCode,
      ownerName: createVendorDto.ownerName,
      email: createVendorDto.email,
      passwordHash: passwordHash,
      encryptedBankAccount: encryptedBankAccount,
    });

    const savedVendor = await this.vendorRepository.save(newVendor);
    
    // Remove the password hash from the return object for security
    const { passwordHash: _, ...result } = savedVendor;
    return result;
  }

  async findByCode(vendorCode: string): Promise<Vendor | null> {
    return this.vendorRepository.findOne({ where: { vendorCode } });
  }
}