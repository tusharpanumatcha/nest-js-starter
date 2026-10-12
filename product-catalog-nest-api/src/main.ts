import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './setup-app.js';
import { config } from './config/env.js';
import { RoutesService } from './info/routes.service.js';
import { isLocalUri } from './database/database.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  setupApp(app);
  app.enableShutdownHooks(); // closes MongoDB and stops the in-memory database on Ctrl+C / restart

  await app.listen(config.port);

  const baseUrl = `http://localhost:${config.port}`;
  const routes = app.get(RoutesService).list();
  const lines = routes.map(
    (r) => `  ${r.method.padEnd(7)} ${baseUrl}${r.path}`,
  );
  console.log(
    `\nAvailable APIs (${routes.length}):\n${lines.join('\n')}\n` +
      `\n  Swagger docs: ${baseUrl}/api/docs\n`,
  );
  Logger.log(`Server is running in ${baseUrl}`, 'Bootstrap');
}

try {
  await bootstrap();
} catch (err: any) {
  const logger = new Logger('Bootstrap');
  logger.error(`Failed to start the server: ${err?.message ?? err}`);
  if (config.useMemoryDb) {
    logger.error(
      'The in-memory database could not start. Check your internet connection for the first-run download.',
    );
  } else if (!isLocalUri(config.mongoUri)) {
    logger.error(
      'Check MONGODB_URI in your .env. No MongoDB? Run: npm run dev:memory',
    );
  } else {
    logger.error(
      'Check that MongoDB is running and MONGODB_URI in your .env is correct.',
    );
  }
  process.exit(1);
}
