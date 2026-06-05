# Chatty Nest

> A real-time chat platform — built as a DDD monolith, designed for distributed scale.

![Proposed Design](./proposed_design.png)

## Description

Chatty Nest is a real-time chat application currently in early development. It follows **Domain-Driven Design** and **Clean Architecture** principles, built on **NestJS** with **uwestjs** (uWebSockets.js adapter) for high-performance I/O.

The system is structured as a **monolith** with clear bounded contexts (auth, messaging, notifications, etc.) so each can be extracted into its own microservice when scaling demands.

### Current
- Auth module — register, login, JWT access + refresh tokens via httpOnly cookies, Argon2 password hashing
- RBAC — role-based access control with DB-level checks (USER, ADMIN)
- CLS — continuation-local storage for request-scoped auth context
- PostgreSQL + Drizzle ORM
- Domain events for cross-context communication

### Planned
- Real-time messaging via WebSockets
- Message queues with idempotency guarantees
- Caching layer
- Rate limiting / throttling
- Migration from monolith to distributed microservices

## Motivation

**Why uwestjs instead of Express?** — uwestjs wraps uWebSockets.js, offering significantly higher throughput and lower latency for IO-heavy workloads. Since the system will eventually handle persistent WebSocket connections for real-time chat, starting with uwestjs avoids a painful migration later.

**Monolith-first** — faster iteration, simpler deployment, easier reasoning. Each bounded context is a NestJS module with its own domain layer, so extracting it into a service later is a mechanical task, not an architectural one.

**DDD + Clean Architecture** — business logic lives in domain aggregates and entities. Repositories handle persistence mapping. Application services orchestrate. This keeps the core framework-agnostic and testable.

## Project Structure

```
chatty-nest/
├── apps/
│   ├── api/              # NestJS application (uwestjs adapter)
│   └── api-e2e/          # End-to-end tests
├── packages/
│   ├── database/         # Shared Drizzle schema (users, accounts, sessions, etc.)
│   └── shared-utils/     # Shared utilities (config validation, etc.)
├── docker/
│   └── compose.yaml      # PostgreSQL 18.3-alpine
└── ...
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker (for PostgreSQL)

### Setup

```bash
# 1. Start PostgreSQL
docker compose -f docker/compose.yaml up -d

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp apps/api/.env.example apps/api/.env
```

Generate RS256 keys and fill in `JWT_PUBLIC_KEY` / `JWT_PRIVATE_KEY` in `apps/api/.env`:

```bash
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private.pem -out public.pem
echo "JWT_PRIVATE_KEY=$(base64 -i private.pem | tr -d '\n')" >> apps/api/.env
echo "JWT_PUBLIC_KEY=$(base64 -i public.pem | tr -d '\n')" >> apps/api/.env
rm private.pem public.pem
```

Then:

```bash
# 4. Push database schema
pnpm nx run api:db:push

# 5. Start dev server
pnpm nx run api:serve
```

The server starts at `http://localhost:3000`.

### Environment Variables

See `apps/api/.env.example` for the full template.

| Variable | Default | Required | Description |
|---|---|---|---|
| `NODE_ENV` | `development` | No | Runtime environment |
| `PORT` | `3000` | No | Server port |
| `DATABASE_URL` | — | Yes | PostgreSQL connection string |
| `DATABASE_POOL_MIN` | `2` | No | Minimum pool connections |
| `DATABASE_POOL_MAX` | `10` | No | Maximum pool connections |
| `JWT_PUBLIC_KEY` | — | Yes | RS256 public key (base64, no newlines) |
| `JWT_PRIVATE_KEY` | — | Yes | RS256 private key (base64, no newlines) |
| `JWT_EXPIRATION` | `3600` | No | Access token TTL (seconds) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | No | Refresh token TTL |

### Docker

```bash
docker compose -f docker/compose.yaml up -d   # start PostgreSQL
docker compose -f docker/compose.yaml down     # stop
```

### Useful Commands

| Command | Description |
|---|---|
| `pnpm nx run api:serve` | Start dev server with watch |
| `pnpm nx run api:build` | Production build |
| `pnpm nx run api:lint` | Lint check |
| `pnpm nx run api:test` | Run tests |
| `pnpm nx run api:typecheck` | TypeScript type-check |
| `pnpm nx run api:db:push` | Push Drizzle schema to database |
| `pnpm nx run api:db:migrate` | Run Drizzle migrations |
| `pnpm nx run api:db:studio` | Open Drizzle Studio GUI |

## Usage

### API Documentation

Once the server is running, visit **http://localhost:3000/api/reference** for interactive API documentation (Scalar UI).

All endpoints are prefixed with `/api` (e.g., `POST /api/auth/register`).

## Contributing

1. Ensure `pnpm nx run api:lint` passes with no new errors
2. Ensure `pnpm nx run api:typecheck` passes (0 errors)
3. Write tests for new features
4. Follow the existing DDD module structure
