# ClimateLens AI — Frontend Plan (`apps/mobile`)

Companion: [OVERVIEW_PLAN.md](./OVERVIEW_PLAN.md) · [BACKEND_PLAN.md](./BACKEND_PLAN.md)
Budget: 2.5 h per working day. Dates: Tue 17 Nov 2026 → Mon 11 Jan 2027.

## 1. Baseline (existing repo)

- React Native 0.88.1, React 19.3, TypeScript 6, `react-native-config`, Jest, Fastlane + Jenkins + Firebase distribution.
- Only `App.tsx`, `AppContainer.tsx`, `HomeScreen.tsx`, `config/env.ts` exist. **No** navigation, state, HTTP client, icons, charts, or maps yet.
- Shared UI package `packages/ui` has only `Button`.

## 2. Frontend stack

| Concern    | Choice                                                                                                              | Note                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Navigation | `@react-navigation/native`, `bottom-tabs`, `native-stack`, `react-native-screens`, `react-native-safe-area-context` |                                                                                            |
| HTTP       | `axios`                                                                                                             | 60 s timeout (Render cold start), retry on network/5xx once                                |
| State      | `zustand`                                                                                                           | stores: location, comparison, assistant                                                    |
| Validation | Zod schemas from `packages/shared`                                                                                  | parse API responses at the boundary                                                        |
| Charts     | spike W4D2: `react-native-gifted-charts` (+`react-native-svg`)                                                      | fallback: custom SVG line chart                                                            |
| Map        | `react-native-maps`                                                                                                 | Google key (Android); fallback `UrlTile`/list                                              |
| Config     | existing `react-native-config` → `API_BASE_URL`                                                                     | Android emulator = `http://10.0.2.2:4000/api/v1`; iOS sim = `http://localhost:4000/api/v1` |
| Tests      | Jest + React Native Testing Library                                                                                 | each feature ships with tests                                                              |

## 3. Folder structure

```
apps/mobile/src/
  app/            App.tsx, AppContainer.tsx (providers)
  navigation/     RootNavigator, TabNavigator, types
  features/
    dashboard/ locations/ climate-history/ comparison/ climate-map/ climate-ai/ academy/ actions/
      (screens/, components/, hooks/, store/, api/)
  components/     app-specific shared pieces (SourceBadge, DataTypeTag, ResolutionNote, StateViews)
  services/       httpClient.ts, errorMapper.ts
  theme/          colors, typography, spacing (tokens from design images)
  types/
packages/ui       Button, Card, Header, Text, Chip, EmptyState/ErrorState/LoadingState
packages/shared   Zod schemas + types for API payloads
```

(Smart Waste is **out of scope**; leave no code for it.)

## 4. Screen inventory (to be completed from your design images)

| Screen                   | Tab       | Feature                    | Design image | Status |
| ------------------------ | --------- | -------------------------- | ------------ | ------ |
| Dashboard                | Home      | indicators + trend summary | _pending_    |        |
| Location search / picker | Home      | locations                  | _pending_    |        |
| Climate History          | History   | charts                     | _pending_    |        |
| Compare                  | Compare   | comparison                 | _pending_    |        |
| Map                      | Map       | markers                    | _pending_    |        |
| Ask Climate AI           | Ask       | chat                       | _pending_    |        |
| Academy list / detail    | Learn     | academy                    | _pending_    |        |
| Take Action              | Learn/Act | actions                    | _pending_    |        |

Tab count and tab names to be finalised when images arrive (5 tabs max: Home, History, Compare/Map, Ask, Learn).

## 5. Climate-integrity UI rules (every data screen)

Shared `SourceBadge`/`DataTypeTag`/`ResolutionNote` components must show: source name (+URL), variable, unit, data type (**Reanalysis** only in MVP), period + baseline, spatial resolution (~50 km), retrieval date, limitations. Unavailable data → explicit "Unavailable" state, never a zero or placeholder. Mock data is only ever shown with a visible **"SAMPLE DATA"** banner and removed by W3D4.

## 6. Day-by-day (FE days only, 2.5 h each)

### Week 1 — Foundation

- **W1D1 Tue 17 Nov** — Verify `yarn ios` / `yarn android` build, Pods, JDK; install navigation deps; bottom tabs + stack with placeholder screens. _Done when:_ app launches on both platforms with tabs.
- **W1D3 Thu 19 Nov** — Theme tokens + typography from design images; build `Card`, `Header`, `Text`, `LoadingState/ErrorState/EmptyState` in `packages/ui`; tests. **Needs design images.**
- **W1D4 Fri 20 Nov** — Dashboard shell with SAMPLE DATA banner, metric cards layout, three states; Jest tests; README commands.
- **W1D5 Mon 23 Nov** — (buffer) fix platform issues, commit; update README.

### Week 2 — Locations

- **W2D3 Thu 26 Nov** — `httpClient` (baseURL from Config, timeout, retry, error mapper incl. "server waking up"), Zustand `locationStore`, search screen with debounce, no-result/error states.
- **W2D4 Fri 27 Nov** — Selected-location header (name, level, resolution note), persist selection (AsyncStorage), tests (valid, empty, ambiguous, network failure).
- **W2D5 Mon 30 Nov** — (buffer) test against deployed Render API on both platforms.

### Week 3 — First real dataset

- **W3D4 Fri 4 Dec** — Replace mock with `/climate/indicators` + `/summary`: metric cards (annual mean temp, trend °C/decade, annual rainfall, anomaly), SourceBadge panel, loading/error/unavailable states; remove SAMPLE DATA.
- **W3D5 Mon 7 Dec** — (buffer) compare on-screen numbers with provider values; fix units/rounding.

### Week 4 — History

- **W4D2 Wed 9 Dec** — Chart library spike on RN 0.88 (both platforms); History screen skeleton + hook.
- **W4D3 Thu 10 Dec** — Temperature and rainfall charts, period selector (e.g. 10/20/30/all years), axis units, baseline line.
- **W4D4 Fri 11 Dec** — Source/method bottom sheet, gaps for missing years, tests (ranges, units, mapping).
- **W4D5 Mon 14 Dec** — (buffer) polish; M3 check.

### Week 5 — Comparison & map

- **W5D2 Wed 16 Dec** — Compare screen: pick 2 locations, cards + overlay chart, show incompatibility reasons from API (never force a comparison).
- **W5D3 Thu 17 Dec** — Map: install, iOS pods, Android API key, markers for supported locations.
- **W5D4 Fri 18 Dec** — Marker → location detail, resolution disclosure, tests; fallback list if map blocked.
- **W5D5 Mon 21 Dec** — (buffer) M4 check.

### Week 6 — Ask Climate AI

- **W6D3 Thu 24 Dec** — Chat UI (message list, input, typing/loading, error + retry), `assistantStore`.
- **W6D4 Fri 25 Dec** — Citation chips (tap → source sheet), limitations block, "insufficient evidence" rendering, suggested questions, tests.
- **W6D5 Mon 28 Dec** — (buffer) run the eval questions in-app; fix rendering issues.

### Week 7 — Academy & actions

- **W7D2 Wed 30 Dec** — Topic list + detail (sources listed).
- **W7D3 Thu 31 Dec** — Actions grouped by individual/household/community; evidence/impact label; avoid overstated claims.
- **W7D4 Fri 1 Jan (flex)** — Navigation + visual consistency pass.
- **W7D5 Mon 4 Jan** — (buffer) M6 check.

### Week 8 — QA & release

- **W8D2 Wed 6 Jan** — UI bugs, accessibility labels/roles/contrast/font scaling, app icon + splash.
- **W8D3 Thu 7 Jan** — Offline and poor-network handling, list/chart performance, versioning (`app.json`, Android `versionCode`, iOS build number).
- **W8D4 Fri 8 Jan** — Full E2E on Android + iOS.
- **W8D5 Mon 11 Jan** — Fastlane beta builds, release notes, known limitations.

## 7. Definition of done (per feature)

Works on Android and iOS · loading/error/empty/unavailable handled · source info visible · tests added and **actually run** (`yarn workspace mobile test`, lint, `tsc`) · README updated · committed.

## 8. Risks

| Risk                                          | Mitigation                                                       |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Design images arrive late                     | Placeholder tokens; re-skin isolated to `theme/` + `packages/ui` |
| RN 0.88 library incompatibility (charts/maps) | Spike first; fallback options listed above                       |
| Render cold start looks like a bug            | Explicit "waking server" state; keep-warm ping                   |
| iOS signing / Pods issues                     | Done W1D1; simulator-only for MVP                                |
