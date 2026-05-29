import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthTokensDto,
  CreateUserDto,
  LoginDto,
  RefreshTokenDto,
} from 'src/dto';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { Anonymous } from 'src/decorators';
import { Throttle } from '@nestjs/throttler';

const ONE_MINUTE_MS = 60_000;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Anonymous()
  @Throttle({ default: { limit: 5, ttl: ONE_MINUTE_MS } })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthTokensDto })
  @Post('login')
  login(@Body() signInDto: LoginDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Anonymous()
  @Throttle({ default: { limit: 3, ttl: ONE_MINUTE_MS } })
  @ApiOkResponse({ type: AuthTokensDto })
  @Post('register')
  register(@Body() createDto: CreateUserDto) {
    return this.authService.register(createDto);
  }

  @Anonymous()
  @Throttle({ default: { limit: 5, ttl: ONE_MINUTE_MS } })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthTokensDto })
  @Post('refresh')
  refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  async logout(@Request() req) {
    // Explicitly awaiting this prevents the controller from returning early
    // which avoids database query collisions in your E2E tests!
    return await this.authService.logout(req.user?.sub);
  }

  @ApiBearerAuth()
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}