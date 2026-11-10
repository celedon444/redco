import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { LostRelativeController } from './lost-relative.controller';
import { LostRelativeService } from './lost-relative.service';

@Module({
  imports: [PrismaModule],
  controllers: [LostRelativeController],
  providers: [LostRelativeService],
  exports: [LostRelativeService],
})
export class LostRelativeModule {}
