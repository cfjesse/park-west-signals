import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync, copyFileSync } from 'node:fs';

const root = (typeof import.meta !== 'undefined' && import.meta?.url)
  ? resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
  : process.cwd();

function getDatabaseUrl() {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }

  // On Netlify / Lambda serverless functions, the root filesystem is read-only.
  // Copy art.db to /tmp so SQLite operations can read and write without EROFS errors.
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDb = '/tmp/art.db';
    if (!existsSync(tmpDb)) {
      const candidates = [
        resolve(process.cwd(), 'art-api', 'data', 'art.db'),
        resolve(process.cwd(), 'data', 'art.db'),
        '/var/task/art-api/data/art.db',
        '/var/task/data/art.db',
        resolve(root, 'data', 'art.db'),
      ];
      const source = candidates.find((p) => existsSync(p));
      if (source) {
        copyFileSync(source, tmpDb);
      }
    }
    return pathToFileURL(tmpDb).href;
  }

  return pathToFileURL(resolve(root, 'data', 'art.db')).href;
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  db: {
    url: getDatabaseUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
};
