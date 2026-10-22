import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

import { MedicineBoxService } from './medicine-box.service';

@ApiTags('Medicine Box')
@Controller('medicine-box')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MedicineBoxController {
  constructor(private readonly medicineBoxService: MedicineBoxService) {}

  @Get()
  @ApiOperation({ summary: '내 약상자 조회' })
  async getUserBox(@CurrentUser() user: JwtPayload) {
    return this.medicineBoxService.getUserBox(user.sub);
  }

  @Post('items')
  @ApiOperation({ summary: '약상자에 약물 추가' })
  async addItem(
    @CurrentUser() user: JwtPayload,
    @Body('drugId') drugId: string,
  ) {
    return this.medicineBoxService.addItem(user.sub, drugId);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '약상자에서 약물 제거' })
  async removeItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') itemId: string,
  ) {
    await this.medicineBoxService.removeItem(user.sub, itemId);
  }
}
