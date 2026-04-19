import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/dto';
import { AuthGuard } from './auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Anonymous } from 'src/decorators';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Anonymous()
    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() signInDto: LoginDto) {
        return this.authService.signIn(signInDto.username, signInDto.password);
    }
    @ApiBearerAuth()
    @Get('profile')
    getProfile(@Request() req) {
        return req.user;
    }
}
