import { Body, Controller, Get, Patch, Post, Query, Request } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserService } from './user.service';
import { Roles } from 'src/decorators';
import { Role } from 'src/enums';
import { CreateUserDto, ListUsersDto, UserResponseDto, VerifyStudentDto } from 'src/dto';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  @Roles(Role.Admin)
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  async findAll(@Query() query: ListUsersDto) {
    const result = await this.service.list(query.page ?? 1, query.limit ?? 50);
    return {
      data: result.data.map((user) => plainToInstance(UserResponseDto, user)),
      meta: result.meta,
    };
  }

  @Post()
  @Roles(Role.Admin)
  @ApiOkResponse({ type: UserResponseDto })
  async create(@Body() createDto: CreateUserDto) {
    const user = await this.service.create(createDto);
    return plainToInstance(UserResponseDto, user);
  }

  @Patch('me/verify-student')
  @Roles(Role.User)
  @ApiOkResponse({ type: UserResponseDto })
  async verifyStudent(
    @Request() req,
    @Body() dto: VerifyStudentDto,
  ) {
    const userId = req.user.sub;
    const user = await this.service.verifyStudent(userId, dto);
    return plainToInstance(UserResponseDto, user);
  }
}

