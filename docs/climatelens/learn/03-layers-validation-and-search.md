# Layers, validation and SQL search (W2D2)

## The request path

```
GET /api/v1/locations/search?q=ahm
  └─ routes      parse + validate the URL (Zod), call the service, build { data, meta }
      └─ service     business rules ("nothing within 150 km is a 404")
          └─ repository  the SQL, parameterized
              └─ Postgres
```

Each layer has one job. The routes know HTTP but no SQL. The repository knows SQL but no HTTP. That is why the
route tests use a fake repository (fast, no database) and the SQL is tested separately against a real one.

`server.ts` is the **composition root**: the only file that creates the real pool, repository and service and
plugs them together. Tests plug in fakes instead. This is called dependency injection.

## Validation (Zod) at the boundary

Everything in a URL is a string, and anyone on the internet can send anything. `locations.schemas.ts` turns
`?limit=5` into the number `5`, and rejects `limit=abc`, `limit=999`, `q=a` or `q=x&q=y` with a **400** and a
per-field list. The error reports the field and the rule, never the value the client sent.

Rule of thumb: validate at the edge, then trust the typed value everywhere inside.

## Errors on purpose vs by accident

`AppError(status, code, message)` is an error we expect (bad input, not found). The error handler returns it
as is. Anything else is a bug: it is logged with details and the client only sees "Something went wrong".

## Search, step by step

1. **Matching.** `lower(name) LIKE '%ahm%'`, or the state name starts with the text (so "guj" lists Gujarat's places).
2. **Ranking.** `CASE` gives each row a score: exact name 0, prefix 1, contains 2, state match 3. Then popular
   places first, then alphabetical.
3. **LIKE wildcards.** `%` and `_` mean "anything" inside LIKE, so user text is escaped first. Otherwise
   searching for `%` would match every row.
4. **Placeholders.** Filters are added only when present, and each value gets the next number (`$1`, `$2`, ...).
   The SQL text never contains user input.

## Haversine (nearest)

The Earth is a sphere, so distance between two lat/lon points is a great-circle arc, not a straight line on a
flat map. The formula runs inside Postgres, filters to 150 km, and sorts by distance. Only cities and districts
count, because a state's point is just its capital.

## Gotchas this day taught

- `pg` returns `bigint` and `numeric` as **strings** (`'23.02000'`). The repository converts them.
- `ORDER BY 0` is not "no ordering"; a number there means "column position". A mocked database would never
  have caught this. The real-database test did.
- Express 5 makes `req.query` read-only, so we parse into a new typed value instead of changing it.

## Try it

```bash
yarn workspace api dev
curl "localhost:4000/api/v1/locations/search?q=guj"
curl "localhost:4000/api/v1/locations/search?type=state&region=west%20india"
curl "localhost:4000/api/v1/locations/nearest?lat=23.22&lon=72.65"
curl "localhost:4000/api/v1/locations/search?q=a&limit=999"     # 400 with details
```

Exercise: add `GET /api/v1/locations/regions` that returns the distinct regions. Start in the repository
(`SELECT DISTINCT region ...`), then the service, then the route, then one test.
