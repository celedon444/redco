import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  // ----------------------------------------------------------
  // Prefijo global de rutas
  // ----------------------------------------------------------
  app.setGlobalPrefix("api");

  // ----------------------------------------------------------
  // CORS — permite peticiones desde el frontend en desarrollo
  // ----------------------------------------------------------
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  });

  // ----------------------------------------------------------
  // Validación global de DTOs
  // ----------------------------------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no declarados en el DTO
      forbidNonWhitelisted: true, // error si llegan campos no declarados
      transform: true, // transforma payloads a instancias de DTO
    }),
  );

  // ----------------------------------------------------------
  // Swagger / OpenAPI — solo en entornos que no sean producción
  // ----------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("REDCO API")
      .setDescription(
        "Red de Emergencias y Desastres de Colombia — API REST\n\n" +
          "Documentación de endpoints disponibles para el MVP de REDCO.",
      )
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Ingresa el token JWT (se configurará en el bloque de autenticación)",
        },
        "JWT-auth",
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(
      `Swagger disponible en: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
    );
  }

  // ----------------------------------------------------------
  // Inicio del servidor
  // ----------------------------------------------------------
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`REDCO Backend corriendo en: http://localhost:${port}/api`);
}

bootstrap();
