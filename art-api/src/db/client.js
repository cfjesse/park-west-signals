import { createClient } from '@libsql/client';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/index.js';

const SCHEMA_FILE = (typeof import.meta !== 'undefined' && import.meta?.url)
  ? resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'schema.sql')
  : resolve(process.cwd(), 'art-api', 'schema.sql');

const isLocalFile = (url) => typeof url === 'string' && (url.startsWith('file:') || url === ':memory:');

/** libSQL rows are array-like; convert them to plain objects so they serialise cleanly to JSON. */
const toObjects = ({ columns, rows }) =>
  rows.map((row) => Object.fromEntries(columns.map((column, i) => [column, row[i]])));

/**
 * Opens a libSQL connection: Turso in production, a local SQLite file in development and tests.
 *
 * Exposes the small interface the repositories depend on:
 *   query(sql, args?)  -> Promise<object[]>
 *   run(sql, args?)    -> Promise<{ changes: number }>
 *   batch(statements)  -> Promise<{ changes: number }[]>   // [{ sql, args }], atomic
 */
export function openDatabase({ url = config.db.url, authToken = config.db.authToken } = {}) {
  if (isLocalFile(url) && url !== ':memory:') {
    mkdirSync(dirname(fileURLToPath(url)), { recursive: true });
  }

  const client = createClient({ url, authToken });

  return {
    async query(sql, args = []) {
      const res = await client.execute({ sql, args });
      return toObjects(res);
    },

    async run(sql, args = []) {
      const { rowsAffected } = await client.execute({ sql, args });
      return { changes: Number(rowsAffected) };
    },

    async batch(statements) {
      const results = await client.batch(
        statements.map(({ sql, args = [] }) => ({ sql, args })),
        'write',
      );
      return results.map(({ rowsAffected }) => ({ changes: Number(rowsAffected) }));
    },

    /** Creates tables and indexes if missing. Used by the seed script and tests. */
    async applySchema() {
      await client.executeMultiple(readFileSync(SCHEMA_FILE, 'utf8'));
    },

    close() {
      client.close();
    },
  };
}
