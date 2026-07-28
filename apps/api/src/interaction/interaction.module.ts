import { Module } from '@nestjs/common';

import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';
import { MedicineBoxModule } from '../medicine-box/medicine-box.module';

@Module({
  imports: [MedicineBoxModule],
  controllers: [InteractionController],
  providers: [InteractionService],
  exports: [InteractionService],
})
export class InteractionModule {}
