# Server state, React Query and the Explore screen (W2D3)

## Two kinds of state

- **Client state** lives only in the app: the text in the search box, the chosen type filter, the Recent list.
  Local `useState` and Zustand hold it.
- **Server state** is a copy of data that lives on the server: popular places, search results. It can be stale and
  can fail to load. React Query holds it.

Rule for this project: never copy an API response into Zustand. The Recent list is the only persisted data, and it is
"which places the user opened" (client state), not a copy of the server's list.

## Who does what

```
Screen  ──▶  useLocationSearchQuery (React Query)  ──▶  searchLocations (service)  ──▶  apiGet (Axios)  ──▶  API
 (UI)         cache, loading, error, retry               one function per endpoint       transport + errors
```

- **Axios** (`api/httpClient.ts`) only sends the request. It never retries.
- **errorMapper** turns every failure into one `ApiError` with a `kind` and a user-readable message.
- **React Query** owns caching, deduplication, loading and error flags, and the single retry rule.
- Screens call hooks. They never import Axios.

## Error kinds

| Kind               | Cause                                 | Retried once? |
| ------------------ | ------------------------------------- | ------------- |
| `network`          | no response (offline, API down)       | yes           |
| `timeout`          | no answer in 60 s                     | yes           |
| `server_waking`    | 502/503/504 (Render free tier waking) | yes           |
| `server`           | other 5xx                             | yes           |
| `validation`       | 400 from our API, with field details  | no            |
| `not_found`        | 404                                   | no            |
| `invalid_response` | 200, but not `{ data, meta }`         | no            |

Retrying a 400 would send the same bad request again, so only temporary problems are retried.

## Query keys

A query key identifies the cached data: `['locations', 'search', { q: 'ahm', type: 'city' }]`. It must contain every
input that changes the result. Same key means shared cache and one request; a new key means a new request.
All keys come from `api/queryKeys.ts`, so one is never typed twice by hand.

## The Explore search, step by step

1. The user types. `text` updates on every keystroke (instant, client state).
2. `useDebouncedValue(text, 300)` publishes the value only after 300 ms without typing, so a burst of keystrokes
   makes one request.
3. `enabled` stays false until the query has 2 characters (the API rejects less) or a type filter is set.
4. `placeholderData: keepPreviousData` keeps the old results on screen while the new ones load: no flicker.
5. React Query passes an `AbortSignal` to Axios, so a request for a stale query is cancelled.
6. Popular and Recent show when no search is active.

## Android and localhost

On an Android emulator, `localhost` means the emulator itself. `resolveApiUrl()` rewrites `localhost` and
`127.0.0.1` to `10.0.2.2` (the host computer) on Android only, so one `.env.development` value works on both.

## Why Zod is not in the app

The backend is the trust boundary, so it validates. The app instead guards the envelope (`invalid_response`) and
maps errors. If the API and app ever drift apart and cause bugs, add Zod parsing for specific responses.

## Try it

- Run the API (`yarn workspace api dev`), then the app. Open Explore.
- Stop the API and restart the app (the cache is empty after a restart): you see "Can't reach the server" with a
  Retry button.
- In `__tests__/ExploreScreen.test.tsx`, read the debounce test: three keystrokes, one request.
- Exercise: add a `usePopularLocationsQuery` `staleTime` of 24 hours. Popular places rarely change.
