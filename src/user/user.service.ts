import { Injectable } from '@nestjs/common';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { User } from 'src/entities';
import { Role } from 'src/enums';

@Injectable()
export class UserService {
    
    private userList: User[] = [
        {id: 1, name: 'Luffy', username: 'captain', password: '1234', roles: [Role.Admin]}, 
        {id: 2, name: 'Zoro', username: 'sword', password: '1234'}, 
        {id: 3, name: 'Usop', username: 'sniper', password: '1234'}, 
        {id: 4, name: 'Nami', username: 'navigator', password: '1234'}
    ];
    findAll() {
        return this.userList.map(user => {
            const {password: _noUse, ...data} = user;
            
            return data;
        });
    }
    async findOne(username: string): Promise<User | undefined> {
        return this.userList.find(user => user.username === username);
    }
    async create(createDto: CreateUserDto): Promise<User> {
        const record = {
            ...createDto,
            id: this.userList.length
        };
        this.userList.push(record);
        return record;
    }
}