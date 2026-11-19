# ClimateLens API

Express 5 + TypeScript backend for the ClimateLens app.

## Setup

```bash
cp apps/api/.env.example apps/api/.env   # optional; defaults work without it
```

## Commands

Run from the repository root, or prefix with `yarn workspace api`:

| Command                        | Purpose                                              |
| ------------------------------ | ---------------------------------------------------- |
| `yarn workspace api dev`       | Start with watch mode on `PORT` (default 4000)       |
| `yarn workspace api build`     | Compile to `dist/` (tests excluded)                  |
| `yarn workspace api start`     | Run the compiled server                              |
| `yarn workspace api migrate`   | Apply new SQL files from `migrations/`               |
| `yarn workspace api seed`      | Insert or update the seed locations (safe to re-run) |
| `yarn workspace api test`      | Run Jest tests (no database needed)                  |
| `yarn workspace api typecheck` | Type-check without emitting                          |
| `yarn workspace api lint`      | Lint with the shared ESLint config                   |

## Endpoints

Success: `{ "data": ..., "meta": ... }`. Failure: `{ "error": { "code", "message", "details"? } }`.

| Endpoint                                               | Purpose                                                                                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/health`                                   | Liveness check                                                                                                                                                                        |
| `GET /api/v1/locations/search?q=&type=&region=&limit=` | `q` 2-100 chars (optional); `type` city\|district\|state\|country; `region` exact, any case; `limit` 1-50 (default 20). Ranked: exact name, prefix, contains, then state-name prefix. |
| `GET /api/v1/locations/popular`                        | Popular locations (max 20)                                                                                                                                                            |
| `GET /api/v1/locations/nearest?lat=&lon=`              | Nearest city or district within 150 km (haversine), with `distanceKm`                                                                                                                 |
| `GET /api/v1/locations/:locationId`                    | One location                                                                                                                                                                          |

Error codes: `VALIDATION_ERROR` (400, with per-field `details`), `NOT_FOUND` (404 unknown route), `LOCATION_NOT_FOUND` (404), `NO_SUPPORTED_LOCATION` (404, nothing within 150 km), `BAD_REQUEST` (400, e.g. malformed JSON), `INTERNAL_ERROR` (500, details are logged, never returned).

State, district and country rows use one representative point (stated in `representativeNote`), not an area average. Every location carries `coordinateSource`: the seed data is approximate (0.01°) and cross-checked against a public geocoder.

## Configuration

`DATABASE_URL` is required: the server and the migration runner refuse to start without it (Supabase: Connect > Session pooler). Keep it in `apps/api/.env`, which is git-ignored.

## Database

Plain SQL migrations live in [migrations/](./migrations), named `001_snake_case.sql`. `yarn workspace api migrate` applies the ones not yet recorded in `schema_migrations`, each inside a transaction. Never edit a migration that has run; add a new file. Row Level Security is on for every table, and only this backend connects.

`yarn workspace api seed` upserts the ~40 locations in [seeds/locations.ts](./src/database/seeds/locations.ts); run it after `migrate`.

### Real-database tests

`yarn workspace api test` uses fakes and needs no database. The SQL itself is tested against a seeded database with read-only queries; these tests are skipped unless you opt in:

```bash
cd apps/api && TEST_DATABASE_URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2-)" npx jest locations.repository.integration
```

## Code layout

`src/modules/locations/`: `routes` (HTTP + validation) → `service` (rules) → `repository` (SQL). `src/server.ts` is the only place real dependencies are created.

Environment variables are validated at startup in [env.ts](./src/config/env.ts). Invalid values stop the server with a clear message. See [.env.example](./.env.example) for the full list.
