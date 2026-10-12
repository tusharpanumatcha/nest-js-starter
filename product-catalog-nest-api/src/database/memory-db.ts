/**
 * Fake database for local development: a throwaway MongoDB that runs in memory.
 *
 * The first run downloads a MongoDB binary (~100 MB, cached in ~/.cache/mongodb-binaries);
 * later runs start in a few seconds. All data is lost when the app stops or restarts.
 */
import type { MongoMemoryServer } from 'mongodb-memory-server';

let server: MongoMemoryServer | undefined;

export async function startMemoryDB(dbName: string): Promise<string> {
  let mod: any;
  try {
    mod = await import('mongodb-memory-server');
  } catch {
    throw new Error(
      'mongodb-memory-server is not installed. Run `npm install` (it is a dev dependency), ' +
        'or set MONGODB_URI to a real database.',
    );
  }
  const MemoryServer = (mod.MongoMemoryServer ??
    mod.default?.MongoMemoryServer) as typeof MongoMemoryServer | undefined;
  if (!MemoryServer) throw new Error('Could not load MongoMemoryServer');

  server = await MemoryServer.create();
  return server.getUri(dbName);
}

export async function stopMemoryDB(): Promise<void> {
  if (server) {
    const s = server;
    server = undefined;
    await s.stop();
  }
}
