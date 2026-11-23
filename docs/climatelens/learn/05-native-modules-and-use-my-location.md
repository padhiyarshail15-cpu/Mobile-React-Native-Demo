# Native modules, permissions and "Use my location" (W2D4)

## The flow

```
tap "Use my location"
  └─ geolocationService   ask permission, read position once, round it to ~1 km
      └─ nearestLocationQuery (React Query)   GET /locations/nearest?lat=&lon=
          └─ select the place, add it to Recent, go to Home
```

Each step can fail, and each failure has its own message:

| Step              | Failure                     | Message the user sees                                 |
| ----------------- | --------------------------- | ----------------------------------------------------- |
| permission        | refused / switched off      | "Location access is off. Turn it on in Settings…"     |
| read the position | no signal, GPS off, timeout | "Couldn't get your location. Try again…"              |
| API               | `NO_SUPPORTED_LOCATION`     | the API's own message ("…within 150 km"), plus a hint |
| API / network     | any other failure           | the mapped `ApiError` message                         |

The rest of the app keeps working after any of them: the user can still search.

## What a native module is

`@react-native-community/geolocation` is JavaScript plus iOS and Android code. JavaScript cannot read a GPS, so the
native side does it and the JS side calls it. That has three consequences:

1. **It needs a rebuild.** `yarn add` is not enough. iOS needs `pod install` and a new Xcode build; Android needs a
   Gradle build. Fast Refresh cannot load new native code.
2. **It needs permission declarations.** iOS reads a usage sentence from `Info.plist`
   (`NSLocationWhenInUseUsageDescription`) and shows it in the system dialog. An empty one fails silently. Android
   needs `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` in `AndroidManifest.xml`.
3. **It does not exist in Jest.** Tests run in Node with no phone. `__mocks__/@react-native-community/geolocation.js`
   replaces it, and each test sets the behaviour it needs.

## Privacy decisions

A location is personal data, so the app asks for as little as possible:

- **Coarse and cached**: `enableHighAccuracy: false`, a position up to 5 minutes old is fine. City level is enough.
- **Rounded on the device**: 2 decimals is about 1 km. The precise position never leaves `geolocationService.ts`.
- **Not in the logs**: the API's request logger records URLs, so `lat` and `lon` values are replaced by `[redacted]`.
  A test checks real log output.
- **Not stored**: the app stores the chosen _place_ (Mumbai), never the coordinates.

## Why `fetchQuery` and not a hook

A hook such as `useQuery` describes data that a screen _shows_. This lookup is an _action_: it happens once, when the
user taps. `queryClient.fetchQuery(options)` runs a query on demand and still gives you the cache, the abort signal and
the shared retry rule. The same options object (`nearestLocationQuery`) could back a hook later.

## Gotchas this day taught

- A `loading` button replaced its label with a spinner, so screen readers lost its name. A test that looked the
  button up by name found it. The shared `Button` now labels itself with its title.
- Ignore a double tap with a `useRef` flag, not state: a ref changes immediately, while state is not visible until
  the next render, so a second tap in the same instant would slip through.
- Test each outcome on a real simulator too: `xcrun simctl location booted set 19.07,72.87` fakes a position and
  `xcrun simctl privacy booted revoke location <bundle id>` removes the permission.

## Try it

- Run the API and the app. In the Simulator choose Features > Location > Custom Location (Mumbai is 19.07, 72.87),
  open Explore, tap "Use my location", and watch Home change.
- Set a location in the ocean (0, -30) and tap again: you get the "within 150 km" message.
- Exercise: make the message for `unsupported` mention the nearest supported place's distance. Hint: the API already
  returns `distanceKm` for found places; think about what it should return when nothing is in range.
