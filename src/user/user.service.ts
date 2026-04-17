import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
    private userList = [{id: 1, name: 'Luffy'}, {id: 2, name: 'Zoro'}, {id: 3, name: 'Usop'}, {id: 4, name: 'Nami'}];
    findAll() {
        return this.userList;
    }
}