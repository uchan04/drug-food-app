import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { InteractionService } from './interaction.service';

@ApiTags('Interactions')
@Controller('interactions')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Get('analyze')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '약상자 기반 상성 분석' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ko', 'en'] })
  async analyzeUserBox(
    @CurrentUser() user: JwtPayload,
    @Query('lang') lang: 'ko' | 'en' = 'ko',
  ) {
    return this.interactionService.analyzeUserBox(user.sub, lang);
  }

  @Get('drug/:drugId')
  @ApiOperation({ summary: '개별 약물 상성 분석' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ko', 'en'] })
  async analyzeDrug(
    @Param('drugId') drugId: string,
    @Query('lang') lang: 'ko' | 'en' = 'ko',
  ) {
    return this.interactionService.analyzeDrug(drugId, lang);
  }
}
