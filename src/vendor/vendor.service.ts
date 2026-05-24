import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateVendorDto, UpdateVendorDto } from 'src/dto';
import { Vendor } from 'src/entities';
import { Repository } from 'typeorm';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
  ) {}

  async findAll(): Promise<Vendor[]> {
    return this.vendorRepository.find();
  }

  async findOne(id: number): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({ where: { id } });
    if (!vendor) {
      throw new NotFoundException(`Vendor with id ${id} not found`);
    }
    return vendor;
  }

  async create(createDto: CreateVendorDto): Promise<Vendor> {
    const existing = await this.vendorRepository.findOne({
      where: { email: createDto.email },
    });
    if (existing) {
      throw new ConflictException('Vendor with this email already exists');
    }
    const vendor = this.vendorRepository.create(createDto);
    return this.vendorRepository.save(vendor);
  }

  async update(id: number, updateDto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(id);
    Object.assign(vendor, updateDto);
    return this.vendorRepository.save(vendor);
  }

  async remove(id: number): Promise<void> {
    const vendor = await this.findOne(id);
    await this.vendorRepository.remove(vendor);
  }
}
