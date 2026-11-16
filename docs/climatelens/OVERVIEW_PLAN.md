# ClimateLens AI — Overview Plan

> Source docs: `ClimateLens_AI_8_Week_Plan_and_Copilot_Prompts.pdf`, `ClimateLens_AI_Service_Setup_and_Cost_Breakdown.pdf`
> Companion plans: [FRONTEND_PLAN.md](./FRONTEND_PLAN.md) · [BACKEND_PLAN.md](./BACKEND_PLAN.md)
> Will be saved in the project at `docs/climatelens/`.

## 1. Problem & approach

Build the ClimateLens AI MVP (climate-change only) as a solo developer with **2.5 h/day, 5 days/week ≈ 12.5 h/week ≈ 100 h over 8 weeks** (inside the PDF's 80–120 h budget).
Approach: extend the **existing Yarn/Turbo monorepo** instead of creating a new repo:

```
apps/mobile      existing RN 0.88 app (keeps Fastlane/Jenkins/Firebase CI)   -> frontend
apps/api         NEW Node + Express + TS                                       -> backend
packages/ui      existing shared components (Button) -> extend with Card, Header, state views
packages/shared  NEW Zod schemas + TS types shared by mobile and api (API contract)
docs/climatelens plans, API contract, data-source notes
```

Stack (unchanged from PDFs): RN CLI + TS, React Navigation, Axios + Zustand, Express + Zod, Supabase Postgres, Render Free, NASA POWER, OpenAI `gpt-4.1-mini` (backend only).

## 2. Requirement review — corrections & suggestions

### Corrections (things in the PDFs that would cause bugs or wrong claims)

| #   | Issue in PDFs                                                       | Correction                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Repo layout `ClimateLensAI/mobile + backend`                        | Repo already is a monorepo → use `apps/mobile`, `apps/api`, `packages/shared`. Prompt 2 "Create RN app" becomes "extend existing app".                                                                                                                                     |
| C2  | API path typo `from;=...&to;=...&variable;=` (HTML-entity artefact) | Correct: `GET /climate/timeseries?locationId=&variable=&from=&to=`                                                                                                                                                                                                         |
| C3  | NASA POWER data is labelled "observed" in places                    | NASA POWER temp/rain is **reanalysis/satellite-model derived (MERRA-2, ~0.5°×0.625° ≈ 50 km)**, not station observation. Label **"Reanalysis"** everywhere. Verify exact parameter/resolution/start year (daily from 1981) on Week 3 Day 1 — do not hard-code from memory. |
| C4  | Location levels "locality, city, district, state, country"          | Gridded ~50 km data cannot represent a locality. MVP = **point locations (city / district HQ / state capital / country centroid)** with the resolution disclosed. Drop "locality" from MVP.                                                                                |
| C5  | Supabase connection                                                 | Render Free is IPv4-only; Supabase _direct_ DB host is IPv6. Use the **Supabase pooler (session mode) connection string** in `DATABASE_URL`.                                                                                                                               |
| C6  | "Projection" data type in labels                                    | No projection dataset in MVP. Keep the enum (`observed/reanalysis/projection`) in the schema but only `reanalysis` is produced. Do not build projection UI.                                                                                                                |
| C7  | "user-related app data" in Supabase                                 | No auth/user data in MVP. Enable **RLS on all tables with no public policies**; only the backend connects (never ship Supabase keys in the app).                                                                                                                           |
| C8  | Cost table vs. summary (₹14–₹680 vs "₹100–450")                     | Not a contradiction but note: 500 AI questions ≈ ₹68. Set a **hard monthly cap in OpenAI dashboard + per-IP/day rate limit** rather than trusting the estimate.                                                                                                            |
| C9  | Week 8 "stable iOS beta builds"                                     | TestFlight needs the $99 Apple account (you chose to defer). Define M7 as **Android APK + iOS simulator/own-device builds via existing Fastlane**, not store distribution.                                                                                                 |

### Suggestions (scope & risk)

1. **Cold starts**: Render Free sleeps (~15 min idle, 30–60 s wake) and Supabase Free pauses after ~1 week idle. Mobile needs a 60 s timeout, retry and a "waking server…" state; add a keep-warm ping before demos.
2. **Seed 30–50 locations only** (major Indian cities + all state capitals + ~10 global). Pre-fetch and store their NASA POWER monthly data in Postgres → fast, cacheable, offline-from-provider, and the AI retrieves from the DB (no live provider call per question).
3. **AI = structured retrieval, not vector RAG.** Flow: validate → extract {location, variable, period} with structured output → query DB → build context with provenance IDs → answer must return `citations[]` that are validated to be subset of retrieved source IDs. No vector DB in MVP.
4. **Dashboard = climate, not weather.** No "today's temperature". Show annual mean, trend (°C/decade, computed by us and labelled as such), anomaly vs a stated baseline (e.g. 1991–2020).
5. **Map**: `react-native-maps` needs a Google Maps API key on Android. Fallback if blocked: OSM `UrlTile` or a tappable location list. Keep to markers only.
6. **Chart library**: RN 0.88 (new arch) compatibility must be spiked first (W4D2). Candidate: `react-native-gifted-charts` (SVG). Fallback: small custom `react-native-svg` line chart.
7. **Design images** (arriving later): needed by **W1D3** (theme tokens). If late, build with neutral placeholder tokens; re-skin is isolated in `packages/ui` + `theme/`.
8. **Content authoring (W7)** is the hidden time sink: limit to **6 topics + 12 actions**, each with a real source URL you verify yourself.
9. **Add**: CI job for `apps/api` in Jenkins/lefthook (lint, typecheck, test) — reuses existing tooling.
10. **Defer if behind** (in order): map styling → Academy quizzes → comparison charts (keep cards) → Take Action grouping polish. Never cut data provenance, core charts, or platform stability.

## 3. Calendar (start Tue 2026-11-17)

Each working week runs **Tue–Mon** (Tue, Wed, Thu, Fri, Mon). Mon = buffer/verify day (catch-up first; milestone check after). Every day = 2.5 h. **FE** = mobile, **BE** = api. Backend always leads the matching frontend feature by ≥1 day; FE uses labelled mock until the endpoint exists.

| Wk  | Dates                   | Theme                                 | Milestone                                                |
| --- | ----------------------- | ------------------------------------- | -------------------------------------------------------- |
| 1   | Tue 17 Nov – Mon 23 Nov | Foundation (nav, theme, api skeleton) | M0: both apps run; `/health` OK                          |
| 2   | Tue 24 Nov – Mon 30 Nov | DB + locations + client               | **M1** location search works end-to-end                  |
| 3   | Tue 1 Dec – Mon 7 Dec   | NASA POWER dataset (riskiest)         | **M2** one real, traceable dataset in app                |
| 4   | Tue 8 Dec – Mon 14 Dec  | Climate history charts                | **M3** charts with units/period/provenance               |
| 5   | Tue 15 Dec – Mon 21 Dec | Comparison + basic map                | **M4**                                                   |
| 6   | Tue 22 Dec – Mon 28 Dec | Ask Climate AI                        | **M5** grounded answers                                  |
| 7   | Tue 29 Dec – Mon 4 Jan  | Academy + Take Action                 | **M6** (Fri 1 Jan is a likely holiday → use as flex day) |
| 8   | Tue 5 Jan – Mon 11 Jan  | QA, security, release prep            | **M7** stable beta builds + docs                         |

### Day-by-day (track · 2.5 h each)

| Day  | Date       | Track     | Task                                                                                                 |
| ---- | ---------- | --------- | ---------------------------------------------------------------------------------------------------- |
| W1D1 | Tue 17 Nov | FE        | Verify Xcode/Pods/Android build of `apps/mobile`; add React Navigation + bottom tabs                 |
| W1D2 | Wed 18 Nov | BE        | Scaffold `apps/api` (Express+TS, env via Zod, pino, `/health`, jest+supertest, turbo scripts)        |
| W1D3 | Thu 19 Nov | FE        | Theme tokens/typography; Card/Header/StateView in `packages/ui` (**design images needed**)           |
| W1D4 | Fri 20 Nov | FE        | Dashboard shell with labelled MOCK data + loading/error/empty; tests                                 |
| W1D5 | Mon 23 Nov | Buffer    | Cross-platform check, README, commit; create Supabase + Render accounts; 30-min NASA POWER test call |
| W2D1 | Tue 24 Nov | BE        | Supabase project, pooler URL, SQL migrations: `locations`, `datasets`                                |
| W2D2 | Wed 25 Nov | BE        | Seed locations; `/locations/search`, `/locations/:id`; Zod; tests                                    |
| W2D3 | Thu 26 Nov | FE        | Axios client (timeout/retry/error mapper), Zustand location store, search screen                     |
| W2D4 | Fri 27 Nov | FE        | Selected-location header, resolution disclosure, wire to API, tests                                  |
| W2D5 | Mon 30 Nov | Buffer    | Deploy API to Render; verify `/health`; **M1**                                                       |
| W3D1 | Tue 1 Dec  | BE        | Provider spike: NASA POWER docs, coverage, units, licence/attribution, limits; save fixtures         |
| W3D2 | Wed 2 Dec  | BE        | Adapter + normalisation + `climate_observations` table + ingestion script for seed locations         |
| W3D3 | Thu 3 Dec  | BE        | `/climate/indicators`, `/climate/summary`, baseline + trend calc, provenance, tests vs fixtures      |
| W3D4 | Fri 4 Dec  | FE        | Metric cards, states, source panel, dashboard integration                                            |
| W3D5 | Mon 7 Dec  | Buffer    | Manually verify values vs NASA POWER; **M2**                                                         |
| W4D1 | Tue 8 Dec  | BE        | `/climate/timeseries` (filtering, annual aggregates, gaps) + tests                                   |
| W4D2 | Wed 9 Dec  | FE        | Chart library spike on RN 0.88; History screen skeleton                                              |
| W4D3 | Thu 10 Dec | FE        | Temperature + rainfall charts, period selector, units                                                |
| W4D4 | Fri 11 Dec | FE        | Source/method sheet, missing-year gaps, tests                                                        |
| W4D5 | Mon 14 Dec | Buffer    | **M3**                                                                                               |
| W5D1 | Tue 15 Dec | BE        | `POST /climate/compare` + compatibility rules; geo metadata in location payload                      |
| W5D2 | Wed 16 Dec | FE        | Pick two locations; comparison cards/chart; mismatch messaging                                       |
| W5D3 | Thu 17 Dec | FE        | Map setup (iOS/Android, API key), markers                                                            |
| W5D4 | Fri 18 Dec | FE        | Map → location detail, resolution disclosure, tests                                                  |
| W5D5 | Mon 21 Dec | Buffer    | **M4**                                                                                               |
| W6D1 | Tue 22 Dec | BE        | Assistant design: intent extraction, retrieval, context + provenance IDs, system prompt              |
| W6D2 | Wed 23 Dec | BE        | OpenAI call, response schema, citation validator, rate limit + budget cap, mocked tests              |
| W6D3 | Thu 24 Dec | FE        | Chat UI + input + loading/error                                                                      |
| W6D4 | Fri 25 Dec | FE        | Citation chips, limitations block, suggested questions, tests                                        |
| W6D5 | Mon 28 Dec | Buffer    | 15-question eval set (supported / unsupported / attribution traps); **M5**                           |
| W7D1 | Tue 29 Dec | BE        | Academy/actions schema + seed (6 topics, 12 actions, real sources); endpoints                        |
| W7D2 | Wed 30 Dec | FE        | Topic list + detail                                                                                  |
| W7D3 | Thu 31 Dec | FE        | Actions grouped (individual/household/community), evidence labels                                    |
| W7D4 | Fri 1 Jan  | FE (flex) | Navigation + UI consistency polish                                                                   |
| W7D5 | Mon 4 Jan  | Buffer    | **M6**                                                                                               |
| W8D1 | Tue 5 Jan  | BE        | Security pass: Helmet, CORS, rate limits, secrets, RLS, logging, Render config                       |
| W8D2 | Wed 6 Jan  | FE        | UI bugs, accessibility, app icon, splash                                                             |
| W8D3 | Thu 7 Jan  | FE        | Offline/poor-network, performance, versioning                                                        |
| W8D4 | Fri 8 Jan  | QA        | Full E2E on Android + iOS (lookup → history → compare → AI)                                          |
| W8D5 | Mon 11 Jan | Release   | Fastlane beta builds, README, known limitations; **M7**                                              |

## 4. Decisions made (from your answers)

- Hours: 2.5 h/day, 5 days/week; one buffer day (Mon) per week.
- Backend in `apps/api` (monorepo). Extend existing `apps/mobile`.
- Personal dev/testing only: no Play/Apple fees.

## 5. Open items / dependencies on you

- Share **design images** by W1D3 (Thu 19 Nov) → I will add a screen inventory table to FRONTEND_PLAN.
- Create accounts: Supabase, Render, OpenAI (with spend cap), Google Maps key (W5).
- Confirm tool choices when we reach them: SQL migrations via `node-pg-migrate`/plain SQL (default) vs Drizzle.

## 6. Todos (tracked in SQL)

Plan files saved to project → W1 FE foundation → W1 BE skeleton → … (see SQL `todos`).
