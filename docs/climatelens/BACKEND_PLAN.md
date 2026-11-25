# ClimateLens AI — Backend Plan (`apps/api`)

Companion: [OVERVIEW_PLAN.md](./OVERVIEW_PLAN.md) · [FRONTEND_PLAN.md](./FRONTEND_PLAN.md)
Budget: 2.5 h per working day. Dates: Tue 17 Nov 2026 → Mon 11 Jan 2027.

## 1. Architecture

```
RN app ──React Query + Axios──▶ Render Free (Express + TS) ──▶ Supabase Postgres (pooler)
                          │                         ▲
                          ├──▶ NASA POWER (ingestion/refresh only, not per request)
                          └──▶ OpenAI (assistant only, after DB retrieval)
```

- Provider data is **ingested into Postgres** for seed locations; API reads from DB (fast, no provider outage on user path, cache = the table + `retrieved_at`).
- No user auth in MVP. Only the backend talks to the DB; **RLS enabled, no public policies**.

## 2. Stack & conventions

Node 22 LTS target (dev machine has v26 — pin `engines`/`.nvmrc`), Express, TypeScript, Zod (backend validation only; response types live in `packages/shared`, types only), `pg` + plain SQL migrations (default; Drizzle optional), `pino` logging, `helmet`, `cors`, `express-rate-limit`, Jest + Supertest, `openai` SDK.
Structure:

```
apps/api/src/
  server.ts  app.ts  config/env.ts (Zod-validated)
  modules/ locations/ climate-data/ climate-analysis/ assistant/ academy/ actions/
  providers/ nasa-power/ (client, normalise, fixtures)   openai/
  middleware/ validate, errorHandler, rateLimit, requestId
  database/ pool.ts  migrations/  seeds/
```

Response envelope: `{ data, meta }` on success; `{ error: { code, message, details? } }` on failure. Every climate payload carries a `provenance` object.

## 3. Data model (initial)

- `locations(id, name, level[city|district|state|country], country_code, admin1, lat, lon, representative_note, is_popular boolean, region, supported boolean)`
- `datasets(id, provider, name, variable[temperature|precipitation|humidity|wind|solar], unit, data_type[observed|reanalysis|projection], spatial_resolution, temporal_resolution, coverage_start, coverage_end, source_url, licence, attribution, limitations)`
- `climate_observations(id, location_id, dataset_id, period_start, period_end, granularity[month|year], value numeric null, quality_flag, retrieved_at)`
- `learning_topics(id, category[basics|impacts|solutions|policy], title, summary, body, read_minutes, featured, key_takeaways[])`, `learning_sources`, `actions(id, category[home|travel|food|work_school|community], title, description, evidence_level)` (W7)
- State/country locations use one representative point (disclosed); no polygon averaging in MVP.
- unique `(location_id, dataset_id, period_start, granularity)`; missing values stored as NULL (never 0/filled).

`provenance` = `{ sourceName, sourceUrl, variable, unit, dataType, periodStart, periodEnd, baseline?, spatialResolution, retrievedAt, limitations[] }`.

## 4. API contract

```
GET  /api/v1/health
GET  /api/v1/locations/search?q=&type=&region=&limit=
GET  /api/v1/locations/popular
GET  /api/v1/locations/nearest?lat=&lon=          (haversine; 404 NO_SUPPORTED_LOCATION if > 150 km)
GET  /api/v1/locations/:locationId
GET  /api/v1/climate/indicators?locationId=
GET  /api/v1/climate/summary?locationId=          (includes baseline anomaly + deterministic `insight` text)
GET  /api/v1/climate/timeseries?locationId=&variable=&from=&to=&granularity=month|year
POST /api/v1/climate/compare      { locationIds:[a,b], variable, from, to }   (returns `takeaway` text)
POST /api/v1/assistant/ask        { question, locationId? }
GET  /api/v1/learning/topics?category=&q=
GET  /api/v1/learning/topics/:id
GET  /api/v1/actions?category=
```

`variable` enum: `temperature | precipitation | humidity | wind | solar` (exact NASA POWER parameter names verified W3D1; all long-term means, never live weather). **No AQI, no live weather, no projections** in MVP.
Compare variables: temperature, precipitation, humidity. Baseline default **1991–2020**; every anomaly/insight includes the baseline period. Current year (2026) is compared against this baseline.
`insight`/`takeaway` strings are template-generated from numbers (not LLM), e.g. "Annual mean temperature in 2024 was X°C, Y°C above the 1991–2020 baseline (reanalysis, ~50 km grid)".
Compare returns `422 INCOMPATIBLE_DATASETS` with reasons when variable/unit/period/dataset/method differ.

## 4b. Device-only data

No server-side user data in MVP (saved locations, chat history, completed actions, units live on device). Assistant requests are stateless: the app may send the last few turns; server does not store them.

## 5. Climate-science rules enforced in code

Weather ≠ climate (no current-weather endpoint) · `dataType` always present · period + baseline in every aggregate · trend values are labelled "computed by ClimateLens (linear fit)" · no risk scores · no attribution of local events · missing data → `available:false` + reason · no fabricated URLs (source URLs come only from `datasets` rows).

## 6. Environment variables (`apps/api/.env.example`, never commit `.env`)

```
NODE_ENV=development
PORT=4000
DATABASE_URL=            # Supabase *pooler* (session mode) connection string
OPENAI_API_KEY=          # backend only
OPENAI_MODEL=gpt-4.1-mini
CORS_ORIGINS=
RATE_LIMIT_ASK_PER_DAY=
```

## 7. Day-by-day (BE days only, 2.5 h each)

### Week 1

- **W1D2 Wed 18 Nov** — Scaffold `apps/api` workspace: tsconfig, ESLint/Prettier alignment with root, Zod env, pino, `/health`, error handler, jest+supertest, turbo `dev/build/test` tasks; `.env.example`. _Done:_ `yarn workspace api dev` + health test passes.
- **W1D5 Mon 23 Nov** — (buffer) create Supabase + Render accounts; run one NASA POWER request manually and save raw JSON.

### Week 2 — DB + locations

- **W2D1 Tue 24 Nov** — Supabase project; pooler URL; `pool.ts`; migrations for `locations`, `datasets`; migration runner script; RLS on.
- **W2D2 Wed 25 Nov** — Seed 30–50 locations (clearly labelled seed, lat/lon from a verified source; `is_popular`, `region`); `search` (name/ILIKE, ranking, `type`/`region` filters, limit), `popular`, `nearest` (haversine, 150 km cut-off) and `detail`; Zod validation; tests: valid, no results, ambiguous, invalid input, filter combos, nearest out-of-range, DB error.
- **W2D5 Mon 30 Nov** — (buffer) Render deploy (root `apps/api`, build/start commands, env vars), verify `/health`; CORS; document. _Deployed: `https://climatelens-api-3u72.onrender.com` (the `-3u72` suffix is Render's, added because the name was taken). Verified on the public URL: `/health`, `/locations/search`, `/popular`, `/nearest` and a 400 for bad input; the iOS dev app also loaded Popular from it. Build and start flow was first verified in a clean clone (build 21 s, clean SIGTERM exit)._ Deviations: the Render root directory is left blank (the repo root), not `apps/api`, because Yarn needs the root `yarn.lock` and workspace files; the build uses `yarn workspaces focus api` so React Native's dependencies are not installed; region is Singapore (Render has no Mumbai); CORS stays empty because the native app is not a browser. Setup: [render.yaml](../../render.yaml) and apps/api/README.md ("Deploying to Render").

### Week 3 — NASA POWER (riskiest; protect this week)

- **W3D1 Tue 1 Dec** — Provider spike per Prompt 4: read docs, confirm coverage/start year, parameters (e.g. air temperature, precipitation — exact names verified), units, grid resolution, licence/attribution, rate limits, fill-value handling (e.g. -999). Save fixtures in `providers/nasa-power/fixtures`. If blocked → isolated, clearly labelled mock adapter + documented blocker.
- **W3D2 Wed 2 Dec** — `nasa-power` client + normaliser (dates, units, fill values → NULL) for 5 variables (temperature, precipitation, humidity, wind, solar), `climate_observations` migration, ingestion script for seed locations (throttled, resumable, idempotent upsert).
- **W3D3 Thu 3 Dec** — `climate-analysis`: annual means/totals, baseline (1991–2020, stated), anomaly, linear trend per decade; min/max/range per year; template `insight` text; `/indicators` + `/summary` with provenance; tests against fixtures.
- **W3D5 Mon 7 Dec** — (buffer) spot-check 3 locations vs NASA POWER; fix drift.

### Week 4

- **W4D1 Tue 8 Dec** — `/timeseries`: validate variable/from/to/granularity (month|year), gap flags, completeness %, indexes, min/max/range; tests for ranges, units, missing years.

### Week 5

- **W5D1 Tue 15 Dec** — `/compare` (temperature, precipitation, humidity) with compatibility checker (variable, unit, dataset, period overlap, granularity); returns overlap period, disclosed differences and deterministic `takeaway`; `422` otherwise; location payload exposes lat/lon + resolution; map-marker data (annual mean temp per supported location) via a lightweight `GET /climate/map-markers` (cached).

### Week 6 — Ask Climate AI

- **W6D1 Tue 22 Dec** — Pipeline design: (1) validate/sanitise question (length, injection patterns), (2) structured-output call to extract `{locationId, variable, period, intent}` against allow-list, (3) DB retrieval, (4) context builder with numbered source IDs + limitations, (5) system prompt: distinguish weather/climate, reanalysis vs projection, cite only provided IDs, admit insufficiency, no attribution, **refuse projection/forecast/AQI/live-weather questions** (explain they are not in the loaded datasets).
- **W6D2 Wed 23 Dec** — OpenAI call (`gpt-4.1-mini`, low temperature, JSON schema `{answer, citations[], limitations[], sufficientEvidence}`), **citation validator** (drop/reject IDs not retrieved), numeric-claim check (numbers in answer must appear in context, else flag), rate limit per IP/day, request size + timeout, safe errors, no key/log leakage; tests with mocked OpenAI.
- **W6D5 Mon 28 Dec** — (buffer) evaluation set (15 Q: supported, unsupported location, no data, projection request, "was this flood caused by climate change?", prompt-injection); record results in `docs/`.

### Week 7

- **W7D1 Tue 29 Dec** — Migrations + seed for 6 topics (spread over Basics/Impacts/Solutions/Policy) and 12 actions (Home/Travel/Food/Work-School) with verified source URLs and evidence level; no unsourced quantified claims; endpoints `learning/topics` (category + `q` search), `learning/topics/:id`, `actions` (category); tests for empty/unknown id.

### Week 8

- **W8D1 Tue 5 Jan** — Security/readiness: helmet, strict CORS, rate limits, payload limits, dependency audit, secrets scan, RLS verification, structured logs w/o PII, graceful shutdown, Render config, keep-warm note; integration test suite run.
- **W8D4/D5** — Support FE E2E; finalise `docs/` API reference + known limitations.

## 8. Testing

Unit (normaliser, analysis, compatibility, citation validator) · integration with Supertest + test DB/transaction · provider fixtures (no live network in CI) · mocked OpenAI. Run `yarn workspace api test`, `lint`, `tsc` before each commit; add `api` job to Jenkinsfile/lefthook.

## 9. Risks

| Risk                                                    | Mitigation                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| NASA POWER coverage/rate/format differs from assumption | W3D1 spike; mock adapter fallback; ingest offline                                |
| Supabase IPv6 vs Render IPv4                            | Use pooler URL (verified W2D1)                                                   |
| Free-tier sleep/pause                                   | Cold-start UX on FE; keep-warm; Supabase pause awareness                         |
| AI hallucination / cost                                 | Structured retrieval, citation validator, low temp, rate limit, OpenAI spend cap |
| Seed coordinates wrong                                  | Use a verified gazetteer; document source                                        |
