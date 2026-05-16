import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('user')
export class UserController {
    constructor(private readonly service: UserService) { }
    @Get()
    @Roles(Role.User, Role.Admin)
    findAll() {
        return this.service.findAll();
    }

    @Post()
    @Roles(Role.Admin)
    create(@Body() createDto: CreateUserDto) {
        return this.service.create(createDto);
    }

}