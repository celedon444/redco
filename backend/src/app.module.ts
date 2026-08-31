import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // Configuración global — lee variables de entorno del archivo .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Acceso global a la base de datos via Prisma
    PrismaModule,

    AuthModule,

    // ----------------------------------------------------
    // Módulos de dominio — se registran en bloques posteriores
    // ----------------------------------------------------
    // IdentityModule,
    // ReportsModule,
    // IncidentsModule,
    // PeopleModule,
    // OrganizationsModule,
    // UnitsModule,
    // AssignmentsModule,
    // GeographyModule,
    // EvidenceModule,
    // AuditModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
