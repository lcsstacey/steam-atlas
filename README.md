# Steam Compass

Steam Compass is a Next.js dashboard that turns your Steam library into a calm decision engine. Sign in with Steam OpenID, the backend imports your owned games and playtime through the Steam Web API, and the app renders analytics, backlog categories, manual statuses, and explainable recommendations.

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
- Steam doesn't reliably expose locally-installed games via the public API. Steam Compass stores manual statuses instead: **Installed**, **Want to install**, **Play next**, **Finished**, **Dropped**, and **Not interested**.
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

## Design

The UI uses a Steam-inspired blue palette layered over a deep blue-black surface, with warm coral and lime accents reserved for "active" and "warning" signals. Typography pairs Instrument Sans (body), Space Grotesk (display), and JetBrains Mono (numeric labels).
