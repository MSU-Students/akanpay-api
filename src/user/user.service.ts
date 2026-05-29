import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { User } from 'src/entities';
import { Role } from 'src/enums';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.usersRepository.find();
  }

  async list(page: number, limit: number) {
    const take = Math.min(Math.max(limit, 1), 200);
    const skip = (Math.max(page, 1) - 1) * take;
    const [data, total] = await this.usersRepository.findAndCount({
      order: { id: 'ASC' },
      skip,
      take,
    });
    return {
      data,
      meta: {
        page: Math.max(page, 1),
        limit: take,
        total,
      },
    };
  }

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        username: username,
      },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  async create(createDto: CreateUserDto): Promise<User> {
    const existing = await this.findOne(createDto.username);
    if (existing) {
      throw new ConflictException('Username already exists');
    }
    const passwordHash = await bcrypt.hash(createDto.password, 10);
    const user = this.usersRepository.create({
      ...createDto,
      password: passwordHash,
      roles: [Role.User],
    });
    return this.usersRepository.save(user);
  }

  async setRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, { refreshTokenHash });
  }

  async clearRefreshToken(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { refreshTokenHash: null });
  }

  async incrementTokenVersion(userId: number): Promise<void> {
    // Optimized: Using query builder guarantees a single, atomic SQL execution.
    // This safely avoids TypeORM `.increment()` quirks that occasionally
    // trigger the "client.query() is already executing" pg warning.
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ tokenVersion: () => '"tokenVersion" + 1' })
      .where('id = :id', { id: userId })
      .execute();
  }

  async ensureRole(userId: number, role: Role): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const roles = user.roles ?? [];
    if (!roles.includes(role)) {
      await this.usersRepository.update(userId, { roles: [...roles, role] });
    }
  }
}