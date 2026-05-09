import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { User } from 'src/entities';
import { Role } from 'src/enums';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) {
    }
    
    
    async findAll() {
        return this.usersRepository.find()
    }
    async findOne(username: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: {
                username: username
            }
        });
    }
    async create(createDto: CreateUserDto): Promise<User> {
        const user = this.usersRepository.create(createDto);
        return this.usersRepository.save(user);
    }
}