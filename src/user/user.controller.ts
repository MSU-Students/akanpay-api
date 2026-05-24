import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserService } from './user.service';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { CreateUserDto, UserResponseDto } from 'src/dto';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { AssignRoleDto } from 'src/dto';

@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.Student, Role.Admin, Role.Faculty) 
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  async findAll() {
    const users = await this.userService.findAll();
    return users.map((user) => plainToInstance(UserResponseDto, user));
  }

  @Post()
  @Roles(Role.Admin, Role.Faculty) //only admin and faculty can create users (for faculty, they can create for students since it is default for students)
  @ApiOkResponse({ type: UserResponseDto })
  async create(@Body() createDto: CreateUserDto) {
    const user = await this.userService.create(createDto);
    return plainToInstance(UserResponseDto, user);
  }

  // endpoint for admin to assign roles to users
  @ApiBearerAuth()
  @Patch(':IDNumber/roles')
  @Roles(Role.Admin) //only admin has the privilege                   
  assignRole(
    @Param('IDNumber') IDNumber: string, //this is what user you want to assign role to (using IDNumber)
    @Body() body: AssignRoleDto
  ) {
    return this.userService.assignRoleByIDNumber(IDNumber, body.roles);
  }
}
