import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { Pool } from 'pg';

import {
  checksum,
  readMigrationFiles,
  runMigrations,
  type MigrationFile,
} from './migrations';

const logger = { info: jest.fn() };

describe('readMigrationFiles', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'migrations-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns .sql files in numeric order with checksums', async () => {
    await writeFile(path.join(dir, '002_b.sql'), 'SELECT 2;');
    await writeFile(path.join(dir, '001_a.sql'), 'SELECT 1;');
    await writeFile(path.join(dir, 'notes.txt'), 'ignored');

    const files = await readMigrationFiles(dir);

    expect(files.map(file => file.name)).toEqual(['001_a.sql', '002_b.sql']);
    expect(files[0].checksum).toBe(checksum('SELECT 1;'));
  });

  it('rejects badly named files', async () => {
    await writeFile(path.join(dir, 'create_users.sql'), 'SELECT 1;');

    await expect(readMigrationFiles(dir)).rejects.toThrow(
      /Invalid migration file name/
    );
  });

  it('rejects two files with the same number', async () => {
    await writeFile(path.join(dir, '001_a.sql'), 'SELECT 1;');
    await writeFile(path.join(dir, '001_b.sql'), 'SELECT 2;');

    await expect(readMigrationFiles(dir)).rejects.toThrow(/share the number/);
  });

  it('accepts the real project migrations', async () => {
    const files = await readMigrationFiles(
      path.resolve(__dirname, '../../migrations')
    );

    expect(files.map(file => file.name)).toEqual([
      '001_create_locations.sql',
      '002_create_datasets.sql',
    ]);
  });
});

describe('runMigrations', () => {
  function fakePool(applied: Array<{ name: string; checksum: string }>) {
    const queries: string[] = [];
    const client = {
      query: jest.fn(async (text: string) => {
        queries.push(text.trim().split('\n')[0]);
        return text.startsWith('SELECT name, checksum')
          ? { rows: applied }
          : { rows: [] };
      }),
      release: jest.fn(),
    };
    const pool = { connect: jest.fn().mockResolvedValue(client) } as unknown;
    return { pool: pool as Pool, client, queries };
  }

  const file = (name: string, sql: string): MigrationFile => ({
    name,
    sql,
    checksum: checksum(sql),
  });

  it('applies only migrations that have not run, each in a transaction', async () => {
    const first = file('001_a.sql', 'CREATE TABLE a ();');
    const second = file('002_b.sql', 'CREATE TABLE b ();');
    const { pool, queries, client } = fakePool([
      { name: first.name, checksum: first.checksum },
    ]);

    const applied = await runMigrations(pool, [first, second], logger);

    expect(applied).toEqual(['002_b.sql']);
    expect(queries).toContain('BEGIN');
    expect(queries).toContain('CREATE TABLE b ();');
    expect(queries).not.toContain('CREATE TABLE a ();');
    expect(queries).toContain('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('refuses a migration that was edited after it ran', async () => {
    const edited = file('001_a.sql', 'CREATE TABLE a (id int);');
    const { pool, client } = fakePool([
      { name: edited.name, checksum: checksum('CREATE TABLE a ();') },
    ]);

    await expect(runMigrations(pool, [edited], logger)).rejects.toThrow(
      /edited after it was applied/
    );
    expect(client.release).toHaveBeenCalled();
  });

  it('rolls back and rethrows when a migration fails', async () => {
    const bad = file('001_bad.sql', 'BROKEN SQL');
    const { pool, client, queries } = fakePool([]);
    client.query.mockImplementation(async (text: string) => {
      queries.push(text.trim().split('\n')[0]);
      if (text === 'BROKEN SQL') {
        throw new Error('syntax error');
      }
      return { rows: [] };
    });

    await expect(runMigrations(pool, [bad], logger)).rejects.toThrow(
      'syntax error'
    );
    expect(queries).toContain('ROLLBACK');
    expect(queries).not.toContain('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });
});
