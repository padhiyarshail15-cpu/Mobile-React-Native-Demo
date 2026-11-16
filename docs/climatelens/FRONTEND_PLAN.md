# ClimateLens AI — Frontend Plan (`apps/mobile`)

Companion: [OVERVIEW_PLAN.md](./OVERVIEW_PLAN.md) · [BACKEND_PLAN.md](./BACKEND_PLAN.md)
Budget: 2.5 h per working day. Dates: Tue 17 Nov 2026 → Mon 11 Jan 2027.

## 1. Baseline (existing repo)

- React Native 0.88.1, React 19.3, TypeScript 6, `react-native-config`, Jest, Fastlane + Jenkins + Firebase distribution.
- Only `App.tsx`, `AppContainer.tsx`, `HomeScreen.tsx`, `config/env.ts` exist. **No** navigation, state, HTTP client, icons, charts, or maps yet.
- Shared UI package `packages/ui` has only `Button`.

## 2. Frontend stack

| Concern       | Choice                                                                                                              | Note                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Navigation    | `@react-navigation/native`, `bottom-tabs`, `native-stack`, `react-native-screens`, `react-native-safe-area-context` |                                                                                            |
| HTTP          | `axios`                                                                                                             | 60 s timeout (Render cold start), retry on network/5xx once                                |
| State         | `zustand`                                                                                                           | stores: location, comparison, assistant                                                    |
| Validation    | Zod schemas from `packages/shared`                                                                                  | parse API responses at the boundary                                                        |
| Local storage | `@react-native-async-storage/async-storage` + Zustand `persist`                                                     | settings, saved/recent locations, chat history, completed actions                          |
| Geolocation   | `@react-native-community/geolocation` (permissions via Info.plist / AndroidManifest)                                | W2D4; deny = graceful                                                                      |
| Icons         | `lucide-react-native` + `react-native-svg`                                                                          | outline/filled per design                                                                  |
| Charts        | spike W4D2: `react-native-gifted-charts` (+`react-native-svg`)                                                      | fallback: custom SVG line chart                                                            |
| Map           | `react-native-maps`                                                                                                 | Google key (Android); fallback `UrlTile`/list                                              |
| Config        | existing `react-native-config` → `API_BASE_URL`                                                                     | Android emulator = `http://10.0.2.2:4000/api/v1`; iOS sim = `http://localhost:4000/api/v1` |
| Tests         | Jest + React Native Testing Library                                                                                 | each feature ships with tests                                                              |

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

## 4. Screen inventory (from the 9 mockups in `docs/climatelens/design/`)

Tabs (final, 4): **Home · Explore · AI · Profile**. Learn (Academy), Compare, Map, History are reached from Home quick actions, Explore and Location Details.
Best reference mockups: `1000524102` (location details/history/metric/unavailable + design system), `1000524101` (explore/filter/no results), `1000524103` (temperature/rainfall/AI/loading/empty/error), `1000524100` (all main screens), `1000524109/111` (full flow).

| #   | Screen                                                      | Reached from       | Feature    | Phase     | Notes / deviations from mockup                                                                                                                                                             |
| --- | ----------------------------------------------------------- | ------------------ | ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Home                                                        | Tab                | dashboard  | W1D4/W3D4 | **No live weather/AQI.** Climate card (annual mean, anomaly vs 1991–2020), humidity/rain/solar tiles, Climate Insight, quick actions (Location Details, History, Compare, Ask AI), recents |
| 2   | Explore                                                     | Tab                | locations  | W2D3      | Search, filter sheet (All/City/District/State/Country + region), Popular (not Trending), Recents, no-results; no "At Risk"; no mic                                                         |
| 3   | Select Location                                             | Home header        | locations  | W2D4      | Nearby (GPS), Popular, search; "Selected" badge                                                                                                                                            |
| 4   | Location Details                                            | Explore            | climate    | W3D4      | Tabs **Overview · History · Metrics** (no Projection), save (heart), share (RN Share)                                                                                                      |
| 5   | Climate History                                             | Details tab / Home | history    | W4D2–D3   | Temp / Rainfall / Humidity / Solar; Monthly-Yearly; 1Y 5Y 10Y All Custom; baseline line; key takeaway                                                                                      |
| 6   | Metric Details                                              | History            | history    | W4D4      | Expandable cards, min/max/range, Data Source (NASA POWER), last updated                                                                                                                    |
| 7   | Data Not Available                                          | any data screen    | states     | W1D3      | "Try a different date range / Choose another location"                                                                                                                                     |
| 8   | Compare Locations                                           | Home / Explore     | comparison | W5D2      | Two pickers, Temp/Rainfall/Humidity (**no AQI**), overlay chart, summary from API (deterministic text), incompatibility reasons                                                            |
| 9   | Climate Map                                                 | Home / Explore     | map        | W5D3–D4   | Colour-coded temperature markers + legend; marker → map detail card → Location Details                                                                                                     |
| 10  | Ask Climate AI                                              | Tab                | assistant  | W6D3–D4   | Suggested questions, chat, source chip, limitations, thumbs up/down (local only), history local; no mic                                                                                    |
| 11  | Learn (Academy)                                             | Home quick action  | academy    | W7D2      | Search, categories Basics/Impacts/Solutions/Policy, featured, list                                                                                                                         |
| 12  | Article Detail                                              | Learn              | academy    | W7D2      | Read time, key takeaways, sources                                                                                                                                                          |
| 13  | Take Action list + detail                                   | Learn / Profile    | actions    | W7D3      | At Home / Travel / Food / Work-School; local "Mark as done"; no quantified savings unless sourced; no "See Your Impact"                                                                    |
| 14  | Profile                                                     | Tab                | profile    | W7D4      | Saved locations, chat history, my actions, preferences, about; **device-only, no email/sign-in**                                                                                           |
| 15  | Settings / Preferences                                      | Profile            | settings   | W7D4      | Temp °C/°F, distance km/mi, data sources, privacy/terms; no language/notifications                                                                                                         |
| 16  | Splash                                                      | launch             | onboarding | **W8D2**  | Created in Week 8                                                                                                                                                                          |
| 17  | Onboarding ×3 + Location permission + Preferences + All set | first run          | onboarding | **W8D2**  | No notification screen; first-run gate. Until W8 app opens straight to Home with default location                                                                                          |
| 18  | Loading / No data / Error                                   | all                | states     | W1D3      | Shared components with SVG illustrations                                                                                                                                                   |

### Design tokens (from `1000524102`)

Primary `#0B6B4F` · Secondary `#14B8A6` · Accent `#3B82F6` · Surface `#E8F7F1` · Background `#F8FAFC` · Text `#111827` · Card `#FFFFFF`. Inter (fallback SF Pro/Roboto): Title 24/28 semibold, Heading 18/24 semibold, Body 14/20 regular, Caption 12/16 regular. Rounded cards (~16), soft shadow, outline icons (filled when active). Icons: `lucide-react-native` (needs `react-native-svg`, already required by charts).
Metric colours: temperature red/orange, precipitation blue, solar amber, humidity teal.

### Local persisted state (Zustand + AsyncStorage)

`settings` (units, onboardingDone), `locations` (selected, saved, recent), `assistant` (chat history), `actions` (completed ids).

### Assets (I create, SVG)

App icon, splash, 3 onboarding illustrations, empty/error/loading illustrations, gradient+skyline header placeholders for cities/articles (swap for real photos later). Located in `apps/mobile/src/assets/`.

## 5. Climate-integrity UI rules (every data screen)

Shared `SourceBadge`/`DataTypeTag`/`ResolutionNote` components must show: source name (+URL), variable, unit, data type (**Reanalysis** only in MVP), period + baseline, spatial resolution (~50 km), retrieval date, limitations. Unavailable data → explicit "Unavailable" state, never a zero or placeholder. Mock data is only ever shown with a visible **"SAMPLE DATA"** banner and removed by W3D4.

## 6. Day-by-day (FE days only, 2.5 h each)

### Week 1 — Foundation

- **W1D1 Tue 17 Nov** — Verify `yarn ios` / `yarn android` build, Pods, JDK; install navigation deps; dynamic (component-based) React Navigation: root native-stack → 4-tab bottom navigator (Home, Explore, AI, Profile); first tab = Home placeholder; remove debug `console.log` in HomeScreen. _Done when:_ app launches on both platforms, tabs switch, Home placeholder shows. Commit as soon as it runs.
- **W1D3 Thu 19 Nov** — Theme tokens + Inter font from mockup `1000524102`; `Text`, `Button` (primary/secondary), `Card`, `Chip`, `Header`, tab bar with lucide icons, `LoadingState/ErrorState/EmptyState/DataUnavailable` in `packages/ui`; tests.
- **W1D4 Fri 20 Nov** — Home dashboard shell: climate card, metric tiles, Climate Insight, quick actions, SAMPLE DATA banner, three states; Jest tests; README commands. (App opens directly on Home with a default location; onboarding comes in W8.)
- **W1D5 Mon 23 Nov** — (buffer) fix platform issues, commit; update README.

### Week 2 — Locations

- **W2D3 Thu 26 Nov** — `httpClient` (baseURL from Config, timeout, retry, error mapper incl. "server waking up"), persisted Zustand stores (settings, locations/recents), Explore screen: debounced search, type-filter sheet, Popular, Recents, no-results/error states.
- **W2D4 Fri 27 Nov** — Select Location flow + selected-location header (name, level, resolution note), "Use my location" (permission → `/locations/nearest`, "not supported" message), persist selection, tests (valid, empty, ambiguous, network failure, permission denied).
- **W2D5 Mon 30 Nov** — (buffer) test against deployed Render API on both platforms.

### Week 3 — First real dataset

- **W3D4 Fri 4 Dec** — Replace mock with `/climate/indicators` + `/summary` on Home and Location Details (Overview · History · Metrics tabs): metric cards (annual mean temp, anomaly vs 1991–2020, annual rainfall, humidity, wind, solar), server-provided insight text, SourceBadge panel, loading/error/unavailable states; remove SAMPLE DATA.
- **W3D5 Mon 7 Dec** — (buffer) compare on-screen numbers with provider values; fix units/rounding.

### Week 4 — History

- **W4D2 Wed 9 Dec** — Chart library spike on RN 0.88 (both platforms); History screen skeleton + hook.
- **W4D3 Thu 10 Dec** — Charts for temperature, rainfall, humidity, solar; Monthly/Yearly toggle; period chips (1Y, 5Y, 10Y, All, Custom); axis units; baseline line; key takeaway card.
- **W4D4 Fri 11 Dec** — Metric Details screen (expandable cards, min/max/range, Data Source section with NASA POWER link, last updated), "Data not available" state, gaps for missing years, tests (ranges, units, mapping).
- **W4D5 Mon 14 Dec** — (buffer) polish; M3 check.

### Week 5 — Comparison & map

- **W5D2 Wed 16 Dec** — Compare screen: pick 2 locations, cards + overlay chart, show incompatibility reasons from API (never force a comparison).
- **W5D3 Thu 17 Dec** — Map: install, iOS pods, Android API key, colour-coded annual-mean-temperature markers + legend (no heatmap).
- **W5D4 Fri 18 Dec** — Marker → location detail, resolution disclosure, tests; fallback list if map blocked.
- **W5D5 Mon 21 Dec** — (buffer) M4 check.

### Week 6 — Ask Climate AI

- **W6D3 Thu 24 Dec** — Chat UI (message list, input, typing/loading, error + retry), `assistantStore`.
- **W6D4 Fri 25 Dec** — Citation chips (tap → source sheet), limitations block, "insufficient evidence" rendering, suggested questions, tests.
- **W6D5 Mon 28 Dec** — (buffer) run the eval questions in-app; fix rendering issues.

### Week 7 — Academy & actions

- **W7D2 Wed 30 Dec** — Learn: search, categories (Basics/Impacts/Solutions/Policy), featured article, list, Article Detail (read time, key takeaways, sources).
- **W7D3 Thu 31 Dec** — Take Action: categories (At Home/Travel/Food/Work-School), action detail, local "Mark as done", evidence label; avoid overstated claims.
- **W7D4 Fri 1 Jan** — Profile + Settings: saved locations, chat history, my actions, units (°C/°F, km/mi) applied app-wide via a formatter, data sources, privacy/terms; navigation + visual consistency pass. (1 Jan may be a holiday → shift into Mon buffer.)
- **W7D5 Mon 4 Jan** — (buffer) M6 check.

### Week 8 — QA & release

- **W8D2 Wed 6 Jan** — Branding & first run: SVG app icon + splash (iOS/Android assets), 3 onboarding slides, location permission screen, unit preferences, "You're all set", first-run gate (`onboardingDone`), SVG illustrations replacing placeholders.
- **W8D3 Thu 7 Jan** — UI bugs, accessibility labels/roles/contrast/font scaling, offline and poor-network handling, list/chart performance, versioning (`app.json`, Android `versionCode`, iOS build number).
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
