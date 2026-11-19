import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Pool } from 'pg';

export interface MigrationFile {
  name: string;
  sql: string;
  checksum: string;
}

export interface MigrationLogger {
  info: (obj: Record<string, unknown>, msg: string) => void;
}

// 001_create_locations.sql: a numeric prefix gives the order.
const FILE_PATTERN = /^(\d{3,})_[a-z0-9_]+\.sql$/;

// Any constant works; it makes two runners queue instead of racing.
const MIGRATION_LOCK_ID = 727_001;

export function checksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

export async function readMigrationFiles(
  dir: string
): Promise<MigrationFile[]> {
  const names = (await readdir(dir)).filter(name => name.endsWith('.sql'));

  const seen = new Set<string>();
  for (const name of names) {
    const match = FILE_PATTERN.exec(name);
    if (!match) {
      throw new Error(
        `Invalid migration file name "${name}". Use 001_snake_case_name.sql`
      );
    }
    const prefix = String(Number(match[1]));
    if (seen.has(prefix)) {
      throw new Error(`Two migrations share the number ${match[1]}`);
    }
    seen.add(prefix);
  }

  const sorted = names.sort();
  return Promise.all(
    sorted.map(async name => {
      const sql = await readFile(path.join(dir, name), 'utf8');
      return { name, sql, checksum: checksum(sql) };
    })
  );
}

export async function runMigrations(
  pool: Pool,
  files: MigrationFile[],
  logger: MigrationLogger
): Promise<string[]> {
  const client = await pool.connect();
  const appliedNow: string[] = [];

  try {
    // Session-level lock: needs the session pooler or a direct connection.
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       text PRIMARY KEY,
        checksum   text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await client.query(
      'ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY'
    );

    const { rows } = await client.query<{ name: string; checksum: string }>(
      'SELECT name, checksum FROM schema_migrations'
    );
    const applied = new Map(rows.map(row => [row.name, row.checksum]));

    for (const file of files) {
      const previous = applied.get(file.name);
      if (previous !== undefined) {
        if (previous !== file.checksum) {
          throw new Error(
            `Migration ${file.name} was edited after it was applied. Add a new migration instead.`
          );
        }
        continue;
      }

      try {
        await client.query('BEGIN');
        await client.query(file.sql);
        await client.query(
          'INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)',
          [file.name, file.checksum]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }

      appliedNow.push(file.name);
      logger.info({ migration: file.name }, 'Applied migration');
    }

    return appliedNow;
  } finally {
    await client
      .query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID])
      .catch(() => undefined);
    client.release();
  }
}
