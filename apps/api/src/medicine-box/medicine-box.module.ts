import { Module } from '@nestjs/common';

import { MedicineBoxController } from './medicine-box.controller';
import { MedicineBoxService } from './medicine-box.service';

@Module({
  controllers: [MedicineBoxController],
  providers: [MedicineBoxService],
  exports: [MedicineBoxService],
})
export class MedicineBoxModule {}
