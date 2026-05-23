import { Injectable, NotFoundException } from '@nestjs/common';
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
  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        username: username,
      },
    });
  }

  async findByIDNumber(IDNumber: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.IDNumber = :IDNumber', { IDNumber })
      .getOne();
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: {
        id: id,
      },
    });
  }
  
  
  async create(createDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createDto.password, 10);
    const user = this.usersRepository.create({
      IDNumber: createDto.IDNumber,   
      username: createDto.username,
      email: createDto.email,         
      password: hashedPassword,
      roles: [Role.Student],          
    });
    return this.usersRepository.save(user);
  }

  // created function for admin to assign roles to other users based on their IDNumber
  async assignRoleByIDNumber(IDNumber: string, roles: Role[]): Promise<User> {
    const user = await this.findByIDNumber(IDNumber);
    if (!user) throw new NotFoundException(`Student with ID ${IDNumber} not found`);
    await this.usersRepository.update(user.id, { roles });
    const updated = await this.findById(user.id);
    if (!updated) throw new NotFoundException(`User not found after update`);
    return updated;
  }

  async setRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, { refreshTokenHash });
  }

  async clearRefreshToken(userId: number): Promise<void> {
    await this.usersRepository.update(userId, { refreshTokenHash: null });
  }

  async incrementTokenVersion(userId: number): Promise<void> {
    await this.usersRepository.increment({ id: userId }, 'tokenVersion', 1);
  }
}
