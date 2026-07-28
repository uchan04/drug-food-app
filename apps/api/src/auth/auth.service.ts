import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { sign, verify, type SignOptions } from 'jsonwebtoken';

import { PrismaService } from '../prisma/prisma.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        provider: 'email',
      },
    });

    // Generate tokens
    const tokens = this.generateTokens({ sub: user.id, email: user.email });

    // Store refresh token hash
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        provider: user.provider,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens({ sub: user.id, email: user.email });

    // Store refresh token hash
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        language: user.language,
        provider: user.provider,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    // Verify refresh token
    let payload: JwtPayload;
    try {
      payload = verify(refreshToken, JWT_SECRET) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find user and verify stored refresh token
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isRefreshValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new access token
    const accessToken = sign(
      { sub: user.id, email: user.email } as object,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions,
    );

    return { accessToken };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private generateTokens(payload: JwtPayload) {
    const accessToken = sign(payload as object, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions);
    const refreshToken = sign(payload as object, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    } as SignOptions);

    return { accessToken, refreshToken };
  }
}
