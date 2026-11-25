# NASA POWER fixtures

Raw responses from the NASA POWER Monthly and Annual API (`v2.10.1`), saved exactly as received. Do not edit or
reformat them (the folder is in `.prettierignore`). Tests and the W3D2 normaliser read them so that no CI run
ever calls the live API.

All requests used `community=RE&format=JSON` against
`https://power.larc.nasa.gov/api/temporal/monthly/point`. Retrieved on 2026-11-25.

| File                                      | Request                                                                         | Shows                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `monthly-ahmedabad-1981-2025.json`        | `latitude=23.03&longitude=72.58&start=1981&end=2025`, five parameters           | Full history. `YYYY13` annual keys. Solar `-999` for 1981-1983. Units and header metadata.    |
| `monthly-ahmedabad-2025-2026-partial.json`| `start=2025&end=2026`, `T2M` and `ALLSKY_SFC_SW_DWN`                            | A partial current year: `-999` for months not yet available and no `202613` annual key.        |
| `monthly-ahmedabad-t2m-2020-2024.json`    | `start=2020&end=2024`, `T2M` only                                               | The small file saved by hand in W1D5 (pretty-printed), useful for fast tests.                  |
| `monthly-sydney-2020-2024.json`           | `latitude=-33.87&longitude=151.21&start=2020&end=2024`, five parameters         | A negative latitude (southern hemisphere).                                                    |
| `error-422-end-date-out-of-range.json`    | `start=2027&end=2027`, `T2M`                                                    | The error shape: HTTP 422 with `header` (text) and `messages` (list of strings).               |

Parameters: `T2M`, `PRECTOTCORR`, `RH2M`, `WS10M`, `ALLSKY_SFC_SW_DWN`. Findings and decisions:
[NASA_POWER_SPIKE.md](../../../../../../docs/climatelens/NASA_POWER_SPIKE.md).

Attribution: NASA Prediction Of Worldwide Energy Resources (POWER) Project, accessed 2026-11-25.
