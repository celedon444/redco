import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { PersonCaseController } from './person-case.controller';
import { PersonCaseService } from './person-case.service';

@Module({
  imports: [PrismaModule],
  controllers: [PersonCaseController],
  providers: [PersonCaseService],
  exports: [PersonCaseService],
})
export class PersonCaseModule {}
