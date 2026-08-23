import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule — Módulo global de acceso a la base de datos.
 *
 * Al ser @Global(), PrismaService está disponible en cualquier módulo
 * de la aplicación sin necesidad de importar PrismaModule explícitamente.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
