import {
  Global,
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { startMemoryDB, stopMemoryDB } from './memory-db.js';

const logger = new Logger('Database');

/** Which database the app ended up using - read by the seeder and the health endpoint. */
export const databaseState: { mode: 'mongodb' | 'memory'; uri: string } = {
  mode: 'mongodb',
  uri: config.mongoUri,
};

/** true for mongodb://localhost / 127.0.0.1 / ::1 connection strings. */
export function isLocalUri(uri: string): boolean {
  return /^mongodb:\/\/([^@/]*@)?(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$|\?)/i.test(
    uri.trim(),
  );
}

/** Hides the password part of a connection string before logging it. */
function redact(uri: string): string {
  return uri.replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:****@');
}

async function useMemoryDatabase(): Promise<string> {
  logger.log(
    'Starting in-memory MongoDB (first run downloads MongoDB, this can take a minute)...',
  );
  const uri = await startMemoryDB('product-catalog');
  databaseState.mode = 'memory';
  databaseState.uri = uri;
  return uri;
}

/**
 * Decides which MongoDB to use:
 *  - --memory flag or MONGODB_URI=memory      -> fake in-memory database
 *  - MONGODB_URI reachable                    -> that database
 *  - local MongoDB not running (development)  -> falls back to the fake in-memory database
 *  - remote database (Atlas) or production    -> fails with a clear error
 */
async function resolveMongoUri(): Promise<string> {
  if (config.useMemoryDb) return useMemoryDatabase();

  const uri = config.mongoUri;
  const local = isLocalUri(uri);
  const probe = mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: local ? 3000 : 10000,
  });
  try {
    await probe.asPromise();
    logger.log(`MongoDB reachable: ${redact(uri)}`);
    return uri;
  } catch (err: any) {
    if (!local || config.isProduction) throw err;
    logger.warn(
      `No MongoDB is running at ${redact(uri)} (${err.message ?? err}). Falling back to the fake in-memory database...`,
    );
    return useMemoryDatabase();
  } finally {
    await probe.close().catch(() => undefined);
  }
}

@Injectable()
class MemoryDbLifecycle implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await stopMemoryDB();
  }
}

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: await resolveMongoUri(),
        retryAttempts: 3,
        retryDelay: 1000,
        connectionFactory: (connection) => {
          logger.log(
            `MongoDB connected (${databaseState.mode === 'memory' ? 'IN-MEMORY' : 'MongoDB'}): ${redact(databaseState.mode === 'memory' ? databaseState.uri : config.mongoUri)}`,
          );
          return connection;
        },
      }),
    }),
  ],
  providers: [MemoryDbLifecycle],
})
export class DatabaseModule {}
