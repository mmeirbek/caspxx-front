# CaspX Frontend

Client portal and admin dashboard for the CaspX logistics platform (Caspian Sea region).

Built with React 19, Vite (rolldown), TanStack Router (file-based), TanStack Query,
shadcn/ui + Tailwind CSS 4, Leaflet maps, Recharts, and i18n (ru/kk/en).

## Requirements

- [bun](https://bun.sh) >= 1.3
- A running CaspX backend (see `caspxx-front`'s sibling repo `caspXX`). Default base URL: `http://localhost:3000`.

## Setup

```bash
bun install
cp .env.example .env   # set VITE_API_BASE_URL if needed
```

## Development

```bash
bun run dev            # Vite dev server on http://localhost:5173
```

## Checks & build

```bash
bun run gen:routes     # regenerate TanStack Router route tree
bunx tsc -b            # typecheck
bun run lint           # ESLint
bun run build          # tsr generate + tsc + vite build → dist/
```

## Features

- **Auth** — login/register, JWT storage, automatic token refresh (single-flight on 401).
- **Orders** — create (with map point picking + geocoding), browse mine/available, carrier assignment and status transitions (IN_TRANSIT → DELIVERED), client cancellation.
- **Map** — live route visualization via `/routes/calculate`.
- **Carrier onboarding** — `/carrier/apply` with approval flow; unapproved carriers cannot assign orders.
- **Devices** — CRUD, bind/unbind vehicle, secret rotation (shown once), live telemetry via Socket.IO (`/caspex` namespace).
- **Telemetry** — metric cards, aggregated history chart (Recharts), realtime updates.
- **Alerts** — list by status, acknowledge/resolve, alert rules (metric/operator/threshold/severity).
- **Predictions** — AI land-route assessment (`/predictions/land`), advisory only.
- **Admin (SUPERADMIN/ADMIN)** — users (role/status/password, create), carrier approval, vehicles, all orders.
- **Uploads** — cargo/product photos attached to an order.

## Docker

Build a production image (defaults to `VITE_API_BASE_URL=http://localhost:3000`):

```bash
docker build -t caspxx-front \
  --build-arg VITE_API_BASE_URL=http://localhost:3000 .
docker run -p 8080:80 caspxx-front
```

The CaspX backend's `docker-compose.yml` includes this repo as the `frontend`
service (nginx on port 8080). CORS is already enabled on the backend.

## Environment

| Variable             | Default             | Description                        |
| -------------------- | ------------------- | ---------------------------------- |
| `VITE_API_BASE_URL`  | `http://localhost:3000` | Backend origin (REST + Socket.IO). |

## Tech notes

- Route tree is generated: edit `src/routes/**`, then `bun run gen:routes`.
- API layer lives in `src/lib/api` (typed endpoints, no envelope assumptions).
- Realtime: `src/lib/realtime/realtime.ts` wraps `socket.io-client` (auth via JWT in `auth.token`).