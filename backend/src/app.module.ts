import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './auth.module';
import { MapModule } from './map.module';
import { VolunteerModule } from './modules/volunteer/volunteer.module';
import { PersonCaseModule } from './modules/person-case/person-case.module';
import { LostRelativeModule } from './modules/lost-relative/lost-relative.module';
import { IncidentModule } from './modules/incident/incident.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    MapModule,
    VolunteerModule,
    PersonCaseModule,
    LostRelativeModule,
    IncidentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}