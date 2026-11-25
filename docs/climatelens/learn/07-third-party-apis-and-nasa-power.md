# Calling a third-party API: what NASA POWER taught us (W3D1)

A **spike** is a short, time-boxed investigation: you find out how something really behaves before you build on it.
We did one for NASA POWER, because every number in the app comes from it. The full write-up is
[NASA_POWER_SPIKE.md](../NASA_POWER_SPIKE.md). This note explains the ideas.

## Why not just trust the docs?

We read the docs, then **measured** the live API, and the two disagreed in places:

- The docs say meteorology runs "to the previous year"; the live API ran to within about two months of today.
- The docs give the grid size; we stepped a point across the grid until the numbers changed, to confirm it.
- The docs do not publish a rate limit; so we assume the strictest reasonable behaviour (one request at a time, a pause
  between them) instead of finding the limit by overloading someone else's server.

Rule: **write down which statements you read and which you measured.** The spike document tags each one.

## Four things that would have caused silent wrong numbers

1. **A "13th month".** The monthly data uses keys like `202013`. That is not a month: it is the yearly value. If code
   loops over every key and averages them, it averages 13 numbers: the yearly value gets mixed in on top of the twelve
   months it already summarises.
2. **`-999` means "no data".** It sits among normal numbers. Averaging `-999` into a year gives a very wrong, very
   plausible-looking result. We store missing as `NULL`, never `0`, because 0 is a real answer (no rain).
3. **Units hide a multiplication.** Rain is **mm per day**. A yearly total is the sum over months of
   `mm/day x days in that month`, not the annual key.
4. **The current year is unfinished.** 2026 has data for January to September only. Comparing a 9-month average with a
   12-month baseline is unfair, because it leaves out the cooler months. Fixing this is a product decision, not a code
   trick.

## Fixtures: real responses, saved once

`apps/api/src/providers/nasa-power/fixtures/` holds the raw responses, unmodified. Two benefits:

- **Tests never call NASA.** They are fast, they work offline, and they do not load someone else's server.
- **They are a record.** `fixtures.test.ts` states each provider behaviour as a test. If NASA changes the format, a test
  fails here instead of the app showing wrong numbers.

The folder is listed in `.prettierignore` because a formatter would change the bytes, and the point of a fixture is
that it is exactly what the provider sent.

## Why the data goes into our database first

The plan is to **ingest** the data into Postgres once, then serve it from there. Reasons:

- Speed: our database answers in milliseconds, NASA in seconds.
- Reliability: if NASA is down, the app still works.
- Politeness: 33 requests once, not one per app user.
- Honesty: each row remembers when it was fetched and from which API version, because NASA says its archive is not
  static and recent months can be revised.

## Provenance and licence

An open licence (CC BY 4.0) still asks for **attribution**. So the `datasets` table carries the source URL, the citation
text and the API version, and every API response will repeat them. A number without its source is not allowed in this
app.

## Try it

- Run the two `curl` commands in section 10 of the spike document and compare them with the fixtures.
- In `fixtures.test.ts`, change `0.06` in the temperature test to `0.001` and see which years fail. Why do they?
- Exercise: write a small function that turns `{ "202001": 17.49, "202013": 26.81, "202002": -999 }` into rows
  `{ year, month, value }`, skipping the annual key and returning `null` for the fill value. W3D2 will need exactly this.
