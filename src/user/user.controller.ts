import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { Anonymous, Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { RolesGuard } from 'src/guards';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('user')
export class UserController {
    constructor(private readonly service: UserService) { }
    @Get()
    // @Roles(Role.User, Role.Admin)
    @Anonymous()
    findAll() {
        return this.service.findAll();
    }
    
    @Post()
    // @Roles(Role.Admin)
    @Anonymous()
    create(@Body() createDto: CreateUserDto) {
        return this.service.create(createDto);
    }

}