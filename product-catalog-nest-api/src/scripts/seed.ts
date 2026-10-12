/**
 * Loads src/data/api-data.json into the MongoDB from MONGODB_URI.
 *
 *   npm run seed              -> adds missing categories/products, updates existing ones (matched by name)
 *   npm run seed -- --fresh   -> deletes ALL categories and products first, then inserts the data
 *
 * (Not needed for the in-memory database - it is seeded automatically on every start.)
 */
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SeedService } from '../seed/seed.service.js';
import { databaseState } from '../database/database.module.js';

const logger = new Logger('Seed');
const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ['error', 'warn', 'log'],
});
try {
  if (databaseState.mode === 'memory') {
    logger.warn(
      'Using the in-memory database: it was already seeded on start and is discarded on exit. ' +
        'Set MONGODB_URI to a real MongoDB to seed it.',
    );
  } else {
    const fresh = process.argv.includes('--fresh');
    if (fresh) logger.log('Clearing categories and products...');
    const counts = await app.get(SeedService).seed({ fresh });
    logger.log(
      `Seed complete: ${counts.categories} categories, ${counts.products} products.`,
    );
  }
} catch (err: any) {
  logger.error(`Seeding failed: ${err?.message ?? err}`);
  process.exitCode = 1;
} finally {
  await app.close();
}
