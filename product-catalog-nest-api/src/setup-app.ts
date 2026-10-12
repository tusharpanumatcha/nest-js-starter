import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { packageInfo } from './common/package-info.js';

/**
 * Global app configuration, shared by main.ts and the e2e tests so both behave the same:
 * CORS, request validation, error format and Swagger docs.
 */
export function setupApp(app: INestApplication): void {
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties that are not in the DTO...
      forbidNonWhitelisted: true, // ...and reject the request if any were sent
      transform: true, // turn payloads into DTO class instances
      stopAtFirstError: true, // one clear message per field
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY, // 422 for validation errors
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Product Catalog API')
    .setDescription(packageInfo.description)
    .setVersion(packageInfo.version)
    .build();
  SwaggerModule.setup('api/docs', app, () =>
    SwaggerModule.createDocument(app, swaggerConfig),
  );
}
