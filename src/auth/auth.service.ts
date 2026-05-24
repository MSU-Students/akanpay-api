import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import type { StringValue } from 'ms';

type JwtPayload = {
  sub: number;
  username: string;
  roles: string[];
  tokenVersion: number;
  jti?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signIn(IDNumber: string, pass: string): Promise<any> {
    const user = await this.userService.findByIDNumber(IDNumber);  // find the user by their IDNumber 
    if (!user) {
      throw new UnauthorizedException();
    }
    const passwordMatches = await bcrypt.compare(pass, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException();
    }
    return this.issueTokens(
      user.id,
      user.IDNumber,
      user.username,
      user.email,
      user.roles || [],
      user.tokenVersion,
    ); //then if the password is correct, issue tokens with the user's IDNumber and other info in the payload
  }

  async register(createDto: CreateUserDto) {
    const user = await this.userService.create(createDto);
    return this.issueTokens(
      user.id,
      user.IDNumber,
      user.username,
      user.email,
      user.roles || [],
      user.tokenVersion,
    );
  }

  async refresh(refreshToken: string) {
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.userService.findById(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException();
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException();
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!tokenMatches) {
      throw new UnauthorizedException();
    }

    return this.issueTokens(
      user.id,
      user.IDNumber,
      user.username,
      user.email,
      user.roles || [],
      user.tokenVersion,
    );
  }

  async logout(userId?: number) {
    if (!userId) {
      throw new UnauthorizedException();
    }
    await this.userService.incrementTokenVersion(userId);
    await this.userService.clearRefreshToken(userId);
    return { success: true };
  }

  // a method of issueTokens which is used to check the payload then issue a new access and refresh tokens, used in both login and register
  private async issueTokens(
    userId: number,
    IDNumber: string,
    username: string,
    email: string,
    roles: string[],
    tokenVersion: number,
  ) {
    const accessPayload = {
      sub: userId,
      IDNumber,
      username,
      email,
      roles,
      tokenVersion,
      jti: randomUUID(),
    };
    const access_token = await this.jwtService.signAsync(accessPayload);

    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.config.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) as StringValue;
    const refreshPayload = { ...accessPayload, jti: randomUUID() };
    const refresh_token = await this.jwtService.signAsync(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    await this.userService.setRefreshToken(userId, refresh_token);

    return {
      access_token,
      refresh_token,
    };
  }
}
