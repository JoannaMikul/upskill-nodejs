# Invoice Management Platform

NestJS 11 REST API for user management with JWT authentication and role-based access (`MANAGER`, `CUSTOMER`). Training project: PostgreSQL via Prisma, validation with Zod, tests with Jest.

## Requirements

- **Node.js** 24.18.x (see `.nvmrc`)
- **pnpm** 11+
- **PostgreSQL** (local or Docker)

## Quick start

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET at minimum

pnpm install
pnpm prisma:migrate
pnpm prisma:seed
pnpm start:dev
```

The API listens on `http://localhost:3000` by default (`PORT` env var).

## Environment variables

| Variable           | Required | Default               | Description                                             |
| ------------------ | -------- | --------------------- | ------------------------------------------------------- |
| `DATABASE_URL`     | Yes      | —                     | PostgreSQL connection string                            |
| `JWT_SECRET`       | Yes      | —                     | Secret for signing JWT access tokens                    |
| `JWT_EXPIRES_IN`   | No       | `900`                 | Access token lifetime in **seconds** (900 = 15 minutes) |
| `PORT`             | No       | `3000`                | HTTP port                                               |
| `MANAGER_EMAIL`    | No       | `manager@example.com` | Seed Manager account email                              |
| `MANAGER_PASSWORD` | No       | `ManagerPass123`      | Seed Manager account password                           |

Sprint 1 uses short-lived access tokens only — no refresh tokens.

## Data model

| Entity    | Description                                           |
| --------- | ----------------------------------------------------- |
| `Account` | Login identity: email (unique), password hash, role   |
| `Manager` | 1:1 profile for Manager accounts (seeded, not public) |
| `Customer`| 1:1 profile created when a Customer registers         |

Registration creates an `Account` with role `CUSTOMER` and a linked `Customer` record. The seeded Manager has role `MANAGER` and a linked `Manager` record.

## Seeded Manager account

After `pnpm prisma:seed`, one Manager exists in the database (created via `UsersService.seedManager()`, not registration):

| Field    | Default value         |
| -------- | --------------------- |
| Email    | `manager@example.com` |
| Password | `ManagerPass123`      |

Override with `MANAGER_EMAIL` and `MANAGER_PASSWORD` in `.env` before seeding.

## API endpoints

All responses for user objects omit `passwordHash`:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

### 1. Register Customer

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"password123"}'
```

- **201** — returns user (no JWT); creates `Account` + `Customer`
- **409** — email already taken
- **400** — validation error (invalid email or password shorter than 8 characters)

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@example.com","password":"ManagerPass123"}'
```

- **200** — `{ "accessToken": "...", "user": { ... } }`
- **401** — invalid credentials

### 3. Current user profile (JWT required)

```bash
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer <accessToken>"
```

- **200** — current user profile
- **401** — missing or invalid token

### 4. Get user by ID (Manager only)

```bash
curl http://localhost:3000/users/<user-id> \
  -H "Authorization: Bearer <managerAccessToken>"
```

- **200** — user profile
- **403** — Customer token
- **404** — user not found

### 5. Get user by email (Manager only)

```bash
curl "http://localhost:3000/users?email=customer@example.com" \
  -H "Authorization: Bearer <managerAccessToken>"
```

- **200** — user profile (exact email match, case-insensitive)
- **403** — Customer token
- **404** — user not found

## Scripts

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `pnpm start:dev`      | Dev server with watch mode             |
| `pnpm build`          | Compile to `dist/`                     |
| `pnpm start:prod`     | Run compiled app                       |
| `pnpm prisma:migrate` | Apply Prisma migrations                |
| `pnpm prisma:seed`    | Seed Manager account                   |
| `pnpm prisma:studio`  | Open Prisma Studio                     |
| `pnpm test`           | Unit tests                             |
| `pnpm test:e2e`       | End-to-end tests (requires PostgreSQL) |
| `pnpm lint`           | ESLint                                 |
| `pnpm format`         | Prettier                               |

## Testing

```bash
pnpm test
pnpm test:e2e
```

E2e tests use the database from `DATABASE_URL`. They seed the Manager via `UsersService.seedManager()` and clean up test users between runs.

## Project structure

```
src/
  auth/       # register, login, JWT strategy
  users/      # profile, Manager lookups, seedManager()
  common/     # guards, decorators, filters, shared types
  prisma/     # PrismaModule (global)
prisma/
  schema.prisma
  seed.ts
test/         # e2e specs
```
