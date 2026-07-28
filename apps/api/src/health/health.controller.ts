import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Shallow health check' })
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  @Get('deep')
  @ApiOperation({ summary: 'Deep health check (includes DB)' })
  async deepCheck() {
    const dbStart = Date.now();
    let dbStatus: 'ok' | 'down' = 'ok';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'down';
    }

    const dbResponseTime = Date.now() - dbStart;

    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
        },
      },
    };
  }
}
