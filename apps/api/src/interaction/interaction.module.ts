import { Module } from '@nestjs/common';

import { MedicineBoxModule } from '../medicine-box/medicine-box.module';

import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';

@Module({
  imports: [MedicineBoxModule],
  controllers: [InteractionController],
  providers: [InteractionService],
  exports: [InteractionService],
})
export class InteractionModule {}
