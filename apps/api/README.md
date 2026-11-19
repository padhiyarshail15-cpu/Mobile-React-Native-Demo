# ClimateLens API

Express 5 + TypeScript backend for the ClimateLens app.

## Setup

```bash
cp apps/api/.env.example apps/api/.env   # optional; defaults work without it
```

## Commands

Run from the repository root, or prefix with `yarn workspace api`:

| Command                        | Purpose                                        |
| ------------------------------ | ---------------------------------------------- |
| `yarn workspace api dev`       | Start with watch mode on `PORT` (default 4000) |
| `yarn workspace api build`     | Compile to `dist/` (tests excluded)            |
| `yarn workspace api start`     | Run the compiled server                        |
| `yarn workspace api migrate`   | Apply new SQL files from `migrations/`         |
| `yarn workspace api test`      | Run Jest tests                                 |
| `yarn workspace api typecheck` | Type-check without emitting                    |
| `yarn workspace api lint`      | Lint with the shared ESLint config             |

## Endpoints

- `GET /api/v1/health` returns `{ "data": { "status": "ok" }, "meta": { "timestamp": "..." } }`.

Errors use one shape: `{ "error": { "code": "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_ERROR", "message": "..." } }`.

## Configuration

`DATABASE_URL` is required: the server and the migration runner refuse to start without it (Supabase: Connect > Session pooler). Keep it in `apps/api/.env`, which is git-ignored.

## Database

Plain SQL migrations live in [migrations/](./migrations), named `001_snake_case.sql`. `yarn workspace api migrate` applies the ones not yet recorded in `schema_migrations`, each inside a transaction. Never edit a migration that has run; add a new file. Row Level Security is on for every table, and only this backend connects.

Environment variables are validated at startup in [env.ts](./src/config/env.ts). Invalid values stop the server with a clear message. See [.env.example](./.env.example) for the full list.
