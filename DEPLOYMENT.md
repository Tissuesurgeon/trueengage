# Deployment Guide — TrueEngage

Deploy the **Next.js frontend** to [Vercel](https://vercel.com) and the **Express + Prisma + Socket.IO backend** to [Railway](https://railway.app).

Smart contracts run on **Ethereum Sepolia** (deploy separately with Foundry — see [README.md](README.md#deploy-contracts)). Vercel and Railway host the web app and API only.

## Architecture

```
┌─────────────────────┐         HTTPS / WSS          ┌──────────────────────────┐
│  Vercel             │  ─────────────────────────►  │  Railway                 │
│  apps/frontend      │   NEXT_PUBLIC_API_URL        │  apps/backend            │
│  (Next.js 15)       │   NEXT_PUBLIC_WS_URL         │  Express + Socket.IO     │
└─────────────────────┘                              └──────────┬───────────────┘
                                                                  │
                                    ┌─────────────────────────────┼──────────────┐
                                    │                             │              │
                              PostgreSQL                      Sepolia RPC    Venice / 1Shot
                           (Railway plugin)                  (Alchemy etc.)   (API keys)
```

| Component | Platform | Notes |
|-----------|----------|--------|
| Frontend | Vercel | `apps/frontend` — Next.js App Router |
| API + WebSocket | Railway | `apps/backend` — long-running Node process |
| Database | Railway PostgreSQL | Prisma (`DATABASE_URL`) |
| Contracts | Sepolia | Not hosted on Vercel/Railway |

**Requirements:** Node.js **≥ 20**, pnpm **9** (`packageManager` in root `package.json`).

---

## Prerequisites

1. **GitHub repo** connected to Vercel and Railway.
2. **Contracts deployed** on Sepolia (or use addresses already in `.env.example`).
3. **Secrets ready** — copy from [`.env.example`](.env.example) and fill production values.
4. **API keys:** Venice AI, 1Shot (relayer), optional Pimlico bundler RPC for local-style smart-account flows.

---

## Part 1 — Railway (backend + database)

Deploy the backend first so you have a public API URL for Vercel.

### 1.1 Create the project

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → select `trueengage`.
2. Add **PostgreSQL**: project → **+ New** → **Database** → **PostgreSQL**.

### 1.2 Configure the backend service

**Option A — Dockerfile (recommended)**

1. Railway service → **Settings** → **Build** → set **Builder** to **Dockerfile**.
2. **Dockerfile path:** `apps/backend/Dockerfile`
3. **Root Directory:** leave empty (repository root — required for pnpm workspaces).
4. Generate a public domain under **Networking**.

The image builds all workspace packages, runs `prisma db push` on container start, then starts the API. See [`apps/backend/Dockerfile`](apps/backend/Dockerfile).

Local test:

```bash
docker build -f apps/backend/Dockerfile -t trueengage-backend .
docker run --rm -p 4000:4000 --env-file .env trueengage-backend
```

**Option B — Nixpacks (no Docker)**

Open the **GitHub-connected service** (not the database service) and set:

| Setting | Value |
|---------|--------|
| **Root Directory** | *(leave empty — repo root)* |
| **Watch Paths** | `apps/backend/**`, `packages/**` |

**Build command** (Option B only):

```bash
pnpm install --frozen-lockfile && pnpm turbo run build --filter=@trueengage/backend...
```

The `...` suffix tells Turbo to build `@trueengage/backend` and all workspace dependencies (`shared`, `ai-engine`, `execution-engine`, etc.).

**Start command** (Option B only):

```bash
pnpm --filter @trueengage/backend start
```

`prestart` runs `prisma db push` automatically before the server starts, so tables are created on first deploy.

**Release command** (Option B only — optional; Dockerfile runs `db push` on container start):

```bash
pnpm --filter @trueengage/backend db:push
```

> With **Option A (Dockerfile)**, schema is applied automatically in `docker-entrypoint.sh`. With **Option B**, use `prestart` or a release command.

Railway sets **`PORT`** automatically. The backend reads `process.env.PORT` (default `4000` locally).

### 1.3 Generate a public domain

Backend service → **Settings** → **Networking** → **Generate Domain**.

Example: `https://trueengage-backend-production.up.railway.app`

### 1.4 Link database variables

On the **backend service** → **Variables**:

1. **Reference** the Postgres plugin variable:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

Railway’s internal URL (`postgres.railway.internal`) works when the backend runs on Railway. Do **not** use the public Railway Postgres URL for the deployed backend.

### 1.5 Backend environment variables

Set these on the Railway backend service:

```env
# Required
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://YOUR-VERCEL-APP.vercel.app

# Venice AI (verification)
VENICE_API_KEY=
VENICE_API_URL=https://api.venice.ai/api/v1/chat/completions

# 1Shot (payout relayer)
ONESHOT_API_KEY=
ONESHOT_API_SECRET=
ONESHOT_API_URL=https://api.1shotapi.com
ONESHOT_RELAYER_URL=https://relayer.1shotapi.dev/relayers
# Leave empty to use public relayer only:
ONESHOT_METHOD_ID=
ONESHOT_DELEGATOR_METHOD_ID=
ONESHOT_WALLET_ID=

# Sepolia
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
CHAIN_ID=11155111
RELAYER_PRIVATE_KEY=

# Contract addresses (after forge deploy)
USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
CAMPAIGN_MANAGER_ADDRESS=
SUBMISSION_MANAGER_ADDRESS=
REWARD_ESCROW_ADDRESS=
PLATFORM_TREASURY_ADDRESS=
```

Set `FRONTEND_URL` to your Vercel production URL (and preview URL if you use branch deploys — see §2.4).

### 1.6 Verify backend

```bash
curl -sS https://YOUR-RAILWAY-DOMAIN/health
curl -sS https://YOUR-RAILWAY-DOMAIN/health/db
```

Expected:

```json
{"status":"ok","product":"TrueEngage"}
{"status":"ok","database":"railway (internal)"}
```

---

## Part 2 — Vercel (frontend)

### 2.1 Import the project

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import `trueengage`.
2. **Framework Preset:** Next.js
3. **Root Directory:** `apps/frontend`

### 2.2 Build settings

Vercel should detect the pnpm monorepo. If the build fails to resolve `@trueengage/shared`, override:

| Setting | Value |
|---------|--------|
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |
| **Build Command** | `cd ../.. && pnpm turbo run build --filter=@trueengage/frontend...` |
| **Output Directory** | `.next` *(default for Next.js)* |

### 2.3 Frontend environment variables

Set in Vercel → **Project** → **Settings** → **Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-DOMAIN
NEXT_PUBLIC_WS_URL=https://YOUR-RAILWAY-DOMAIN
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

Optional (if you use a Pimlico bundler in frontend `.env.local` today):

```env
NEXT_PUBLIC_BUNDLER_RPC_URL=https://api.pimlico.io/v2/sepolia/rpc?apikey=YOUR_KEY
```

`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` must point at the **same Railway host** — Socket.IO shares the HTTP server with Express.

Apply to **Production** (and **Preview** if you test PR deploys).

### 2.4 CORS and preview deploys

The backend allows origins from `FRONTEND_URL` plus `http://localhost:3000`. For Vercel preview URLs, either:

- Set `FRONTEND_URL` to your production Vercel URL only (previews won’t pass CORS), or
- Add preview origins to `FRONTEND_URL` / extend CORS in `apps/backend/src/index.ts` before deploying previews.

### 2.5 Deploy and verify

After deploy, open `https://YOUR-VERCEL-APP.vercel.app`:

1. Connect wallet (MetaMask on Sepolia).
2. Create a campaign or browse the marketplace.
3. Confirm API calls hit Railway (browser DevTools → Network → requests to `YOUR-RAILWAY-DOMAIN`).

---

## Part 3 — Deploy order checklist

| Step | Action |
|------|--------|
| 1 | Deploy Sepolia contracts locally (`pnpm contracts:deploy`) |
| 2 | Create Railway project + Postgres |
| 3 | Configure backend service (build/start commands) |
| 4 | Set backend env vars + `${{Postgres.DATABASE_URL}}` |
| 5 | Generate Railway public domain |
| 6 | `curl /health` and `/health/db` |
| 7 | Import repo to Vercel with root `apps/frontend` |
| 8 | Set `NEXT_PUBLIC_*` vars to Railway URL |
| 9 | Set Railway `FRONTEND_URL` to Vercel URL |
| 10 | Redeploy backend (CORS picks up new `FRONTEND_URL`) |
| 11 | End-to-end test: connect wallet → create campaign → submit → verify |

---

## Environment variable reference

### Backend only (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `${{Postgres.DATABASE_URL}}` on Railway |
| `FRONTEND_URL` | Yes | Vercel app URL for CORS |
| `PORT` | Auto | Set by Railway |
| `VENICE_API_KEY` | For AI verify | Venice API key |
| `ONESHOT_API_KEY` | For payouts | 1Shot API key |
| `ONESHOT_RELAYER_URL` | Recommended | Public relayer base URL |
| `REWARD_ESCROW_ADDRESS` | For payouts | Deployed escrow contract |
| `RELAYER_PRIVATE_KEY` | Optional | Escrow fallback path only |

### Frontend only (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Railway backend HTTPS URL |
| `NEXT_PUBLIC_WS_URL` | Yes | Same Railway URL (Socket.IO) |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | `11155111` (Sepolia) |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Recommended | Public or Alchemy/Infura RPC |

---

## Troubleshooting

### `P1001` / database connection failed on Railway

- Confirm `DATABASE_URL=${{Postgres.DATABASE_URL}}` is referenced on the **backend service**, not copied from a local `.env`.
- Check deploy logs for `[db] Connected (railway (internal))`.

### `P1001` when running `db:push` locally against Railway

- `postgres.railway.internal` only works **inside** Railway’s network.
- For local schema push, use the **public** Postgres URL from Railway → Postgres → **Connect** in `apps/backend/.env.local`.

### CORS errors in the browser

- `FRONTEND_URL` on Railway must exactly match the Vercel origin (scheme + host, no trailing slash).
- Redeploy the backend after changing `FRONTEND_URL`.

### WebSocket / live updates not working

- `NEXT_PUBLIC_WS_URL` must be `https://` (Vercel) → Railway; Socket.IO upgrades over HTTPS.
- Do not point WS at `localhost` in production.

### Build fails on Railway / Vercel

- Ensure **Root Directory** for backend is repo root (Railway) or `apps/frontend` (Vercel).
- Use `pnpm install --frozen-lockfile` and Turbo `--filter=...` builds so workspace packages compile.

### Render Postgres instead of Railway

TrueEngage also works with [Render](https://render.com) Postgres. Use the **External** URL locally and set **Access Control** to allow your IP. On a Render-hosted backend, use the **Internal** URL. See comments in [`.env.example`](.env.example).

---

## Optional: `railway.toml` / `vercel.json`

Not required, but you can commit these at the repo root for reproducible deploys.

**`railway.toml`** (Dockerfile deploy — recommended):

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "apps/backend/Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 120
```

**`railway.toml`** (Nixpacks deploy):

```toml
[build]
buildCommand = "pnpm install --frozen-lockfile && pnpm turbo run build --filter=@trueengage/backend..."

[deploy]
startCommand = "pnpm --filter @trueengage/backend start"
healthcheckPath = "/health"
healthcheckTimeout = 120
```

**`vercel.json`** (monorepo frontend):

```json
{
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@trueengage/frontend...",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile"
}
```

---

## Security notes

- Never commit `.env` or `apps/backend/.env` with real secrets.
- Store `RELAYER_PRIVATE_KEY`, `VENICE_API_KEY`, and `ONESHOT_API_*` only in Railway variables.
- Use Railway and Vercel **secret** env var types for sensitive values.
- Restrict Postgres public networking on Railway if only the backend needs access.
