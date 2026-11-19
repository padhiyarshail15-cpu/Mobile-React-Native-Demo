# Server state vs client state (React Query)

Status: stub, filled in during W2D3 when React Query is installed.

## Two kinds of state

- **Client state** lives only in the app: selected location, units, chat draft. Zustand holds it.
- **Server state** is a copy of data that lives on the server: locations, climate numbers. It can go stale and can fail to load. React Query holds it.

Rule for this project: never copy an API response into Zustand.

## What React Query gives us

- Loading, error and success states from one hook.
- A cache keyed by a **query key**, so two screens asking for the same data share one request.
- Retry, refetch and `staleTime` (how long data counts as fresh).

## To cover in W2D3

- `queryKey` design (`['locations','search',{q}]`) and why it must contain every input.
- `staleTime` vs `gcTime`.
- `enabled` (do not search for fewer than 2 characters).
- `keepPreviousData` (no flicker while typing).
- Why Axios no longer retries.
