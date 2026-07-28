import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { DrugModule } from './drug/drug.module';
import { HealthController } from './health/health.controller';
import { InteractionModule } from './interaction/interaction.module';
import { MedicineBoxModule } from './medicine-box/medicine-box.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    DrugModule,
    MedicineBoxModule,
    InteractionModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
