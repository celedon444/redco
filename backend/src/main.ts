// REDCO — NestJS Entry Point
// TODO: Configurar Swagger, pipes de validación y prefijo global de rutas

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // TODO: Configurar ValidationPipe global
  // TODO: Configurar Swagger/OpenAPI
  // TODO: Configurar CORS
  // TODO: Configurar prefijo global /api/v1

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`REDCO Backend corriendo en: http://localhost:${port}`);
}

bootstrap();
