import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  db: {
    // Turso in production; falls back to a local SQLite file for development.
    url: process.env.TURSO_DATABASE_URL ?? pathToFileURL(resolve(root, 'data', 'art.db')).href,
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
};
