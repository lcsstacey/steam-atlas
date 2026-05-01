# Steam Atlas

Steam Atlas is a Next.js dashboard that turns your Steam library into a calm decision engine. Sign in with Steam OpenID, the backend imports your owned games and playtime through the Steam Web API, and the app renders analytics, backlog categories, manual statuses, and explainable recommendations.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with a custom Steam-inspired blue design system
- **Prisma 7** with libSQL (SQLite) in development
- **TanStack Query** for client data fetching
- **Framer Motion** + **Recharts** + **Three.js** for the UI
- **Steam OpenID** custom flow + **Steam Web API** server-side services
- **Vitest** for recommendation-scoring unit tests

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env and fill it in:

   ```bash
   cp .env.example .env
   ```

   Required:

   - `STEAM_API_KEY` — get one at <https://steamcommunity.com/dev/apikey>
   - `AUTH_SECRET` — long random string (e.g. `openssl rand -hex 32`)
   - `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for local dev
   - `DATABASE_URL` — used by Prisma migrations only; the runtime adapter points at `prisma/dev.db` directly

3. Generate the Prisma client and create the dev database:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Steam Notes

- Steam login uses OpenID 2.0 and only returns a SteamID64. The app never asks for your Steam username or password.
- The Steam API key is only read by server code — it never reaches the browser.
- Library import uses `IPlayerService/GetOwnedGames` with `include_appinfo=true` and `include_played_free_games=true`.
- Steam doesn't reliably expose locally-installed games via the public API. Steam Atlas stores manual statuses instead: **Installed**, **Want to install**, **Play next**, **Finished**, **Dropped**, and **Not interested**.
- If your Steam profile has *Game details* set to private, the API returns no library data — the dashboard then renders a friendly private-profile state.

## Recommendation Engine

The recommender:

1. Builds a taste profile from top-played games (weighted by playtime).
2. Scores available genres, categories, and tags.
3. Falls back to playtime and name-pattern signals when metadata is sparse.
4. Boosts backlog candidates (low playtime, unopened).
5. Applies mode-specific modifiers (e.g. `BACKLOG_GEM`, `COMFORT_PICK`, `WILDCARD`, `RETRY_THIS`).
6. Adds controlled randomness so suggestions feel intentional but not stale.

Every recommendation includes a short, plain-English explanation of *why* it picked that game.

Run tests:

```bash
npm test
```

## Data Controls

The dashboard exposes:

- **Refresh library** — reimports the Steam library into the local cache.
- **Delete data** — removes the local user row and cascades all related profile, library, status, and recommendation rows. Steam itself is unaffected.

## Deploy (Vercel + Turso)

The local SQLite file in `prisma/dev.db` is fine for development but won't survive on a serverless host (Vercel functions have an ephemeral filesystem). Production uses [Turso](https://turso.tech), which is hosted libsql — drop-in compatible with the libsql adapter the app already uses.

1. **Create the Turso database:**

   ```bash
   # Install the CLI (https://docs.turso.tech/cli/installation)
   turso auth signup
   turso db create steam-atlas
   turso db show steam-atlas --url      # → libsql://… copy this
   turso db tokens create steam-atlas   # → ey…       copy this
   ```

2. **Apply the schema to Turso:**

   ```bash
   DATABASE_URL="libsql://your-url-here?authToken=your-token-here" npx prisma migrate deploy
   ```

3. **Push to GitHub** if you haven't already.

4. **Import the repo into [Vercel](https://vercel.com/new)** — pick `lcsstacey/steam-atlas`, leave the framework auto-detection as Next.js.

5. **Set environment variables** in Vercel project settings:

   | Name | Value |
   |---|---|
   | `STEAM_API_KEY` | from steamcommunity.com/dev/apikey |
   | `AUTH_SECRET` | `openssl rand -hex 32` |
   | `NEXT_PUBLIC_APP_URL` | your Vercel URL, e.g. `https://steam-atlas.vercel.app` |
   | `TURSO_DATABASE_URL` | from step 1 |
   | `TURSO_AUTH_TOKEN` | from step 1 |

6. **Redeploy.** Steam OpenID has no callback whitelist — it just trusts the realm/return URL the app sends — so nothing else needs registering.

## Design

The UI uses a Steam-inspired blue palette layered over a deep blue-black surface, with warm coral and lime accents reserved for "active" and "warning" signals. Typography pairs Instrument Sans (body), Space Grotesk (display), and JetBrains Mono (numeric labels).
