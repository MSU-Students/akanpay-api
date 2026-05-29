import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_ANONYMOUS } from 'src/decorators';

import { UserService } from 'src/user/user.service';

type JwtPayload = {
  sub: number;
  username: string;
  roles: string[];
  tokenVersion: number;
  jti?: string;
};

type TokenVersionCacheEntry = {
  tokenVersion: number;
  expiresAt: number;
};

const TOKEN_VERSION_TTL_MS = 60_000;
const TOKEN_VERSION_CACHE_MAX = 10_000;

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly tokenVersionCache = new Map<number, TokenVersionCacheEntry>();

  constructor(
    private readonly jwtService: JwtService,
    private reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAnonymous = this.reflector.getAllAndOverride<boolean>(
      IS_ANONYMOUS,
      [context.getHandler(), context.getClass()],
    );
    if (isAnonymous) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    let payload: JwtPayload;
    try {
      // 💡 Here the JWT secret key that's used for verifying the payload
      // is the key that was passed in the JwtModule
      payload = await this.jwtService.verifyAsync(token);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
    } catch {
      throw new UnauthorizedException();
    }

    const tokenVersion = await this.getTokenVersion(payload.sub);
    if (tokenVersion === null || tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException();
    }

    request['user'] = payload;
    return true;
  }

  private async getTokenVersion(userId: number): Promise<number | null> {
    const cached = this.tokenVersionCache.get(userId);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.tokenVersion;
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      return null;
    }

    this.setTokenVersionCache(userId, user.tokenVersion);
    return user.tokenVersion;
  }

  private setTokenVersionCache(userId: number, tokenVersion: number): void {
    if (this.tokenVersionCache.size >= TOKEN_VERSION_CACHE_MAX) {
      const oldestKey = this.tokenVersionCache.keys().next().value as
        | number
        | undefined;
      if (oldestKey !== undefined) {
        this.tokenVersionCache.delete(oldestKey);
      }
    }

    this.tokenVersionCache.set(userId, {
      tokenVersion,
      expiresAt: Date.now() + TOKEN_VERSION_TTL_MS,
    });
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
