# Deploying to Render (W2D5)

## What "deploy" means

So far the API only ran on your laptop. Deploying means Render runs it on a server with a public URL, so the app
works when your laptop is off.

```
Phone app ──https──▶ Render (Express, free) ──▶ Supabase Postgres (Mumbai)
                     https://climatelens-api.onrender.com
```

## Development vs production: what is different

| Thing         | On your laptop                | On Render                                     |
| ------------- | ----------------------------- | --------------------------------------------- |
| How it starts | `tsx watch src/server.ts`     | `node apps/api/dist/server.js` (compiled)     |
| Code          | TypeScript, run directly      | JavaScript in `dist/`, built by `tsc`         |
| `NODE_ENV`    | `development`                 | `production` (Render sets it)                 |
| Secrets       | `apps/api/.env` (git-ignored) | Environment variables in the Render dashboard |
| Port          | 4000                          | `PORT=10000`                                  |
| Restarts      | when you save a file          | when you push a commit, or Render restarts it |

`tsx` is a development tool. In production, TypeScript is compiled once to plain JavaScript, which Node runs
directly. That is why the build step exists.

## The build, line by line

```
corepack enable && yarn workspaces focus api && yarn workspace api build
```

1. `corepack enable` turns on the Yarn version pinned in `package.json` (4.18.1). Without it Render might use Yarn 1.
2. `yarn workspaces focus api` installs only the API's dependencies. This repo also holds the React Native app, and
   installing all of it would waste minutes on packages the server never uses.
3. `yarn workspace api build` runs `tsc`, which writes `apps/api/dist/`.

The start command is just `node apps/api/dist/server.js`. It needs no Yarn.

## Why the root directory is blank

Render lets you set a "root directory". `apps/api` alone would hide the root `yarn.lock` and `package.json` that
Yarn needs to understand the workspaces. So the service uses the repository root, and the commands point into
`apps/api`. A build filter in `render.yaml` stops commits that only touch the mobile app from redeploying the API.

## render.yaml: infrastructure as code

[render.yaml](../../../render.yaml) describes the service in a file, so the settings live in git instead of in
dashboard clicks. If the service is ever deleted, creating the Blueprint again rebuilds it. Secrets are the exception:
`DATABASE_URL` is marked `sync: false`, so Render asks for it in the dashboard and it never enters git.

## Health checks

Render calls `GET /api/v1/health` every few seconds. A 2xx within 5 seconds means healthy. If it keeps failing, Render
restarts the service. Our health route does not touch the database on purpose: a short database problem should not
make Render restart a working API. That is the difference between a liveness check (is the process up?) and a
readiness check (can it do its job?).

## Graceful shutdown, again

Every deploy, Render sends the old instance a `SIGTERM`. `server.ts` stops accepting new requests, lets running
ones finish, closes the database pool, and exits with code 0. This was tested on the production build: the log shows
`"msg":"Shutting down"` and the port closes.

## The free tier, honestly

- It **sleeps after 15 minutes** without traffic. The next request takes about a minute while it wakes. The app copes:
  a 60-second timeout and the "server is waking up" message.
- You get **750 free hours a month**, and Render says free instances are not for production. That is fine for this MVP.
- The local disk is **wiped on every restart**. Our API stores nothing on disk, which is why that is harmless.

## Reading the logs

Render dashboard > your service > **Logs**. Look for `"msg":"API listening"` after a deploy. Each request line shows the
method, URL and status, with `lat` and `lon` replaced by `[redacted]`. Use the log level (`LOG_LEVEL`) to get more or
less detail.

## Try it

- After the first deploy, call `https://<service>.onrender.com/api/v1/health` twice: once right away, and once after 20
  minutes of silence. Compare the response times.
- In the dashboard, change `LOG_LEVEL` to `warn`, redeploy, and see what disappears from the logs.
- Exercise: add a `GET /api/v1/ready` that runs `SELECT 1` through the pool and returns 503 when the database is down.
  Decide whether Render should use it as the health check, and write down why you would or would not.
