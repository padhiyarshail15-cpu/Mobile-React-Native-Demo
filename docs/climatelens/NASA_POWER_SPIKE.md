# NASA POWER spike (W3D1): what the provider really does

Status: done 2026-11-25. Source of truth for W3D2 (ingestion) and W3D3 (analysis). Every statement is tagged
**[docs]** (read in NASA's pages), **[measured]** (observed from live API calls on 2026-11-25) or **[assumed]**
(inferred, to be re-checked). Raw responses are in
[fixtures/](../../apps/api/src/providers/nasa-power/fixtures/README.md) and are pinned by
[fixtures.test.ts](../../apps/api/src/providers/nasa-power/fixtures.test.ts).

## 1. Verdict

NASA POWER works for the MVP. One request returns the whole history from 1981 up to the latest published month, for all
five variables, in about 1.5 s (about 44 KB). The range is **dynamic, not fixed**: the document's "1981-2025" is only the
range of the saved fixture (section 5.1 explains how the app should ask for it). The 1991-2020 baseline is complete for
every variable at all nine locations I tested, the licence is open, and no key is needed. **But three assumptions in the
current plan are wrong and need decisions** (section 8).

## 2. The request

```
GET https://power.larc.nasa.gov/api/temporal/monthly/point
    ?parameters=T2M,PRECTOTCORR,RH2M,WS10M,ALLSKY_SFC_SW_DWN
    &community=RE&longitude=72.58&latitude=23.03&start=1981&end=2025&format=JSON
```

- No API key or account. [measured]
- Up to 20 parameters per point request. [docs]
- `community=RE` (renewable energy) chosen because it returns solar in kWh/m2/day. Units depend on the community, so the
  community is part of the contract. [docs: "units tailored to the selected community"; measured for RE]
- `start` and `end` are years. An `end` beyond the data returns **HTTP 422** (see the error shape in section 6).
  [measured] `end=1981..2025` in this document's examples is just the range I saved; the code must use the **current
  year** as `end` (section 5.1).

## 3. The five variables

| Our variable  | Parameter           | Unit (RE)     | Official definition [docs: parameter manager API]                                                         | Source of the data                                                                                                 | Grid cell (resolution)      | Starts |
| ------------- | ------------------- | ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------- | ------ |
| temperature   | `T2M`               | C             | "The average air (dry bulb) temperature at 2 meters above the surface of the earth."                      | MERRA-2 assimilation model (reanalysis)                                                                            | 0.5 deg lat x 0.625 deg lon | 1981   |
| precipitation | `PRECTOTCORR`       | mm/day        | "The average MERRA-2 bias corrected total precipitation at the surface of the earth."                     | MERRA-2, bias corrected (reanalysis)                                                                               | 0.5 x 0.625 deg             | 1981   |
| humidity      | `RH2M`              | %             | "The ratio of vapor pressure to the saturation vapor pressure ... expressed in percent."                  | MERRA-2 (reanalysis)                                                                                               | 0.5 x 0.625 deg             | 1981   |
| wind          | `WS10M`             | m/s           | "The average of wind speed at 10 meters above the surface of the earth."                                  | MERRA-2 (reanalysis)                                                                                               | 0.5 x 0.625 deg             | 1981   |
| solar         | `ALLSKY_SFC_SW_DWN` | kW-hr/m^2/day | "The total solar irradiance incident (direct plus diffuse) on a horizontal plane ... all sky conditions." | **Satellite observations** turned into surface values by radiative transfer models (GEWEX SRB, then CERES SYN1deg) | **1 x 1 deg**               | 1984   |

- Resolutions: stated by NASA as "0.5 x 0.625 degree resolution for meteorology and 1 x 1 for solar" [docs], and
  confirmed by stepping a point across cell edges: temperature changed between lat 23.2 and 23.3 and on both sides of
  lon 72.58 (at 72.15 and 72.85), consistent with cells 0.5 deg tall and 0.625 deg wide; solar stayed constant over lat
  23.03-23.6 and lon 72.15-72.9 and changed at lat 22.7, consistent with a 1 deg cell. [measured] The exact cell edges
  (centres at multiples of 0.5 deg lat and at -180 + 0.625k deg lon) are **assumed** from these steps.
- In kilometres: meteorology is about 55 km north-south and 64 km east-west at 23 deg N (43 km at London); solar is
  about 111 km. The plan's "about 50 km grid" is right only for meteorology. [computed]
- Also exist and are not used yet: `T2M_MAX`, `T2M_MIN`, `WS2M`, `PS`, `CLRSKY_SFC_SW_DWN`. [measured] The meaning of
  `T2M_MAX/MIN` (average of daily extremes, or the extreme) is not verified. `PRECTOTCORR_SUM` returned 0.0 labelled
  `mm/day` for a January, so it is not a monthly total; **do not use it**. [measured]

## 4. The response shape

```jsonc
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [72.58, 23.03, 46.53] }, // LONGITUDE first, then latitude, then grid-cell elevation (m)
  "properties": {
    "parameter": {
      "T2M": { "198101": 19.64, "198102": 23.46, "...": "...", "198113": 27.13 }
    }
  },
  "header": {
    "api": { "version": "v2.10.1" },
    "sources": ["MERRA2", "SRB", "SYN1DEG", "POWER"],
    "fill_value": -999.0,
    "start": "19810101",
    "end": "20251231"
  },
  "parameters": {
    "T2M": { "units": "C", "longname": "Temperature at 2 Meters" }
  }
}
```

All measured and pinned by tests:

1. **Keys are `YYYYMM`, with a 13th "month" per year**: `198113` is the **annual value** for 1981.
2. **The annual value of temperature equals the mean of the 12 months** (within 0.06 C, every year 1981-2025).
3. **The annual value of precipitation is a daily average (mm/day).** A yearly total needs
   `annual x days_in_year`, or `sum(month x days_in_month)`; the two agree within 1% every year (about 0.02-0.04%).
   The plan's "annual rainfall 812 mm" must be computed, never read directly.
4. **Missing data is `-999`**, as a number inside the normal series. It must become `NULL` (never 0, never averaged).
   A real `0` exists too (Ahmedabad's January precipitation is 0).
5. Values have up to 4 decimals (solar) or 2 (others).
6. The point is **not snapped**: the response echoes the coordinates you sent. The grid cell is chosen on NASA's side.
7. HTTP 422 returns `{ "header": "<text>", "messages": ["<text>", ...] }`, which is a different shape from success.

## 5. Coverage and gaps

| Question                           | Answer                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First year                         | Meteorology 1981, solar 1984. Solar for 1981-1983 is `-999` in every month. [measured, docs]                                                                                                                                                                                                                                                                              |
| 1991-2020 baseline                 | **Complete: 360 of 360 months for all five variables** at Ahmedabad, London, Singapore, Sydney, Sao Paulo, Dubai, Lagos, Kochi, Tokyo. [measured]                                                                                                                                                                                                                         |
| Last complete year                 | 2025 (its annual key exists). [measured]                                                                                                                                                                                                                                                                                                                                  |
| **Current year (2026)**            | **Partial.** Meteorology available through September 2026, solar through July. Later months are `-999`. **No `202613` annual key.** [measured]                                                                                                                                                                                                                            |
| Latest month available             | **Not "last month".** On 2026-11-25 a request `start=1981&end=2026` returned data to **September 2026** for temperature, rain, humidity and wind (about 2 months behind) and to **July 2026** for solar (about 4 months behind). The response header says `end: 20261130` (the end of the current month), but the months after the last real value are `-999`. [measured] |
| Docs vs reality on the latest data | Docs say meteorology runs to "the previous year" [docs]; in practice it ran to within about two months of today. [measured]                                                                                                                                                                                                                                               |
| Latency                            | 2-3 days for meteorology and 5-7 days for solar in near-real time [docs]; the monthly series lags more (above).                                                                                                                                                                                                                                                           |
| Is the archive stable?             | **No.** NASA says it "actively changes/updates with bias corrections, model updates, and error fixes", and recent meteorology is replaced by improved data 2-3 months after real time. [docs] So recent months can change.                                                                                                                                                |

### 5.1 How the range must be requested (dynamic)

Never hard-code `2025`, or any year. The data grows every month, so:

1. **`start` is fixed at 1981** (the first year of meteorology). The baseline 1991-2020 is also fixed. Both are constants.
2. **`end` is the current calendar year**, taken from the clock at run time (`new Date().getFullYear()`). Asking for
   the current year is accepted; asking for next year returns HTTP 422. Treat a 422 on `end` as "step back one year and
   retry", not as a crash (it can happen around New Year if the server clock differs).
3. **The latest real month is found from the data, not from the clock.** For each variable, the latest month is the last
   `YYYYMM` key (ignoring the `13` annual keys) whose value is not `-999`. Store only real values; leave the missing
   months out or as `NULL` rows, but never as `0`.
4. **The latest month differs per variable** (September for meteorology, July for solar on 2026-11-25), so provenance
   must say "data to <month>" per variable, not one date for everything.
5. **Refresh monthly, and re-fetch the recent past.** NASA replaces recent meteorology 2-3 months after real time and
   corrects the archive over time (section 5, last row). So each refresh re-requests the whole range (or at least the last
   3 years) and **updates existing rows**, not just appends new ones. The upsert key
   `(location_id, dataset_id, period_start, granularity)` already allows this.
6. **A year is "complete" only when it has all 12 real months for that variable.** Annual values are computed from the
   months we hold, and only for complete years; the current year is reported as year-to-date (section 8A).
7. **The app must not hard-code the year either.** The Home sample says `2026`; the real value comes from the API
   (`latestMonth`, `latestCompleteYear`). The fixtures contain `1981-2025` and `45 * 13`; those numbers belong to the
   fixtures only, which is why the tests that mention them read the saved files and never call the live API.

Why not simply ask for "last month"? Because last month usually is not published yet (section 5). Asking for the
current year and reading the last real value is the one method that stays correct as the lag changes.

## 6. Limits, errors and etiquette

- **Rate limits are not published** in the pages I found. The API documents an HTTP 429 "Too Many Requests". [docs]
  About 30 calls spaced at least 1.2 s apart produced no 429. [measured] **Rule for our code: sequential requests, at
  least 1 s apart, retry only 429 and 5xx with backoff, never in parallel.**
- Cost of ingestion: 42 locations x 1 request each is about 1-2 minutes. The seed locations fall into **33 unique grid
  cells** (the 9 shared cells are the state or country rows that reuse a capital, such as Ahmedabad and Gujarat), so
  33 requests would be enough. [computed from the verified cell edges; the cell-centre formula is **assumed**]
- NASA asks that you not request finer than the native resolution, because that returns the same data repeatedly. [docs]
- A bulk alternative exists: the AWS Open Data registry copy of POWER (monthly). Not needed for 33 requests.

## 7. Licence and attribution

- "There are no restrictions on the use, access, and/or download of data from the NASA POWER Project." NASA asks you to
  cite the project. Listed as Creative Commons BY 4.0. [docs: AWS Open Data registry listing for NASA POWER]
- Citation wording [docs: POWER referencing guide]: the data was obtained from NASA Langley Research Center's Prediction
  Of Worldwide Energy Resources (POWER) project, funded through the NASA Earth Science Division; include the service
  name, version and date accessed. So the `datasets` rows should carry:
  `attribution = "NASA Prediction Of Worldwide Energy Resources (POWER) Project, Monthly and Annual API v2.10.1"` and the
  access date as `retrieved_at`.
- NASA also kindly requests notice of publications that use the data (contact larc-power-project@mail.nasa.gov). Not a
  condition.
- `source_url` for the `datasets` rows: `https://power.larc.nasa.gov/docs/services/api/temporal/monthly/` [docs].

## 8. Corrections to the plan and decisions needed

**A. "Current year 2026 vs the 1991-2020 baseline" cannot be a full-year number.** 2026 has data for Jan-Sep (solar
Jan-Jul) and no annual value. Comparing a 9-month mean with a 12-month baseline mean is biased by season. Options:

1. **Same-months comparison (recommended):** compare Jan-Sep 2026 with Jan-Sep of the baseline, and label it
   "Year to date (Jan-Sep 2026) vs 1991-2020, same months". The label carries the months actually covered.
2. **Last complete year:** use 2025 and call it that. Simple and honest, but not "current".
3. Both, with the year-to-date as the headline.

   Decision needed before W3D3. My default if you do not choose: option 1.

**B. "Data type: Reanalysis only" is wrong for solar.** Meteorology is MERRA-2 reanalysis. Solar is satellite-derived
(radiative-transfer inversion of satellite observations). Migration `002` limits `datasets.data_type` to
`observed | reanalysis | projection`; calling solar "observed" would overstate it. **Plan: migration 004 adds
`satellite_derived`.** Also: precipitation is MERRA-2 "bias corrected"; label it "reanalysis (bias corrected)".

**C. Resolution text.** Replace the single "about 50 km grid" with per-variable text: meteorology about 55 x 64 km
(0.5 x 0.625 deg), solar about 111 km (1 deg). The mobile sample data and its source line still say 50 km; fix in W3D4
when real provenance arrives.

**D. Same cell means same numbers.** Ahmedabad and Gujarat (and 8 other pairs) return **identical** data, because their
points fall in one cell. The Compare screen (W5) must detect "same grid cell" and say so, instead of showing two identical
columns. The representative-point note already explains why states reuse a capital.

**E. Annual precipitation** is `sum(month mm/day x days)` (section 4, item 3); annual temperature, humidity, wind and
solar are the annual key or the mean of the months. For W3D2 store the 12 monthly values and compute annual values
ourselves, so a partial year never gets an invented annual value.

## 9. What W3D2 should do with this

1. `providers/nasa-power/client.ts`: one GET per location with `start=1981&end=<current year>` (never a hard-coded
   year; section 5.1), 1 s throttle, retry 429 and 5xx, map 422 to a clear error, send `community=RE`.
2. `normalise.ts`: split `YYYYMM`; **drop the `13` keys** (compute annual ourselves); `-999` becomes `NULL`; keep real
   `0`; keep lon/lat/elevation order straight; check each unit against the expected unit and fail loudly if it differs.
3. Migrations: `climate_observations` (as planned) and **004** for `satellite_derived`.
4. Insert the five `datasets` rows from sections 3 and 7, with the real source URL, attribution and limitations.
5. Ingestion script: sequential, resumable, idempotent upsert on `(location_id, dataset_id, period_start, granularity)`;
   store `retrieved_at` and the API version. It is **re-runnable**: run it monthly, and each run refreshes recent
   months as well as adding new ones (section 5.1, item 5). Record per variable the latest real month it found.
6. Tests use these fixtures. CI never calls NASA.

## 10. Reproduce

```bash
curl -s "https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M,PRECTOTCORR,RH2M,WS10M,ALLSKY_SFC_SW_DWN&community=RE&longitude=72.58&latitude=23.03&start=1981&end=2025&format=JSON" | head -c 600
curl -s "https://power.larc.nasa.gov/api/system/manager/parameters/PRECTOTCORR?community=re"   # official definition
```

Not verified in this spike: the exact meaning of `T2M_MAX/MIN`, any published rate limit, and behaviour for points over
open ocean (none of our seed locations is one).
