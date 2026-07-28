import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { DrugService } from './drug.service';

@ApiTags('Drugs')
@Controller('drugs')
export class DrugController {
  constructor(private readonly drugService: DrugService) {}

  @Get('search')
  @ApiOperation({ summary: '약물 검색 (제품명/성분명)' })
  @ApiQuery({ name: 'q', required: true, description: '검색어' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ko', 'en'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('q') query: string,
    @Query('lang') lang: 'ko' | 'en' = 'ko',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.drugService.search(query, lang, +page, +limit);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: '약물 자동완성' })
  @ApiQuery({ name: 'q', required: true, description: '검색어 (2자 이상)' })
  @ApiQuery({ name: 'lang', required: false, enum: ['ko', 'en'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async autocomplete(
    @Query('q') query: string,
    @Query('lang') lang: 'ko' | 'en' = 'ko',
    @Query('limit') limit = 10,
  ) {
    return this.drugService.autocomplete(query, lang, +limit);
  }

  @Get('all')
  @ApiOperation({ summary: '전체 약물 목록 조회 (카테고리별)' })
  async getAll() {
    return this.drugService.getAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '약물 상세 조회' })
  async getById(
    @Param('id') id: string,
    @Query('lang') lang: 'ko' | 'en' = 'ko',
  ) {
    return this.drugService.getById(id, lang);
  }
}
