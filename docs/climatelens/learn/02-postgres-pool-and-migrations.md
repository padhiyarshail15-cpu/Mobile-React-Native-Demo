# Postgres, connection pools and migrations (W2D1)

## What we built

| File                                  | Purpose                                               |
| ------------------------------------- | ----------------------------------------------------- |
| `src/config/env.ts`                   | `DATABASE_URL` is now required; the server fails fast |
| `src/database/pool.ts`                | One shared `pg` connection pool                       |
| `src/database/migrations.ts`          | Reads `migrations/*.sql` and applies the new ones     |
| `src/database/migrate.ts`             | The command behind `yarn workspace api migrate`       |
| `migrations/001_create_locations.sql` | The `locations` table                                 |
| `migrations/002_create_datasets.sql`  | The `datasets` table (rows are added in Week 3)       |

## Concepts

**Connection pool.** Opening a database connection is slow. A pool opens up to 10 once and lends them out per
query (`pool.query(...)`). `idleTimeoutMillis` closes unused ones, and `connectionTimeoutMillis` stops a request
from waiting forever. The `pool.on('error')` listener matters: an error on an idle connection would otherwise
crash the whole server.

**Session pooler vs direct.** Supabase sits a pooler (Supavisor) in front of Postgres. Session mode keeps one
connection per client, so features like advisory locks work. Transaction mode does not.

**Migration runner, step by step**

1. Take an advisory lock so two runners cannot apply the same files at once.
2. Create `schema_migrations` if missing. It records each applied file name and a checksum.
3. For each file in order: skip it if recorded; fail if its checksum changed (someone edited an applied file);
   otherwise run `BEGIN`, the SQL, an insert into `schema_migrations`, then `COMMIT`.
4. If anything fails, `ROLLBACK`. The database stays at the last good state.

**Table design choices**

- `bigint GENERATED ALWAYS AS IDENTITY`: an auto-incrementing primary key.
- `CHECK (level IN (...))`: the database itself rejects invalid values, not just our code.
- `numeric(8,5)` for lat/lon: exact decimals, no floating-point surprises.
- The unique index on `lower(name), level, country_code, admin1` means a seed can be re-run safely.
- `text_pattern_ops` index: makes `LIKE 'ahm%'` prefix searches use an index.
- A partial index (`WHERE is_popular AND supported`) only indexes the rows `/locations/popular` reads.
- `ENABLE ROW LEVEL SECURITY` with no policies: Supabase exposes public tables through its own API. With RLS on and
  no policy, that API sees nothing. Our backend connects as the `postgres` role, which bypasses RLS.

## Try it

- Run `yarn workspace api migrate` twice. The second run says "Database is up to date".
- In the Supabase dashboard open **Table Editor** and look at `locations`, `datasets`, `schema_migrations`.
- Open `schema_migrations` to see the recorded checksums.
- Exercise: add `003_add_population_to_locations.sql` with `ALTER TABLE locations ADD COLUMN population integer;`
  and run migrate. Do not edit `001`.
