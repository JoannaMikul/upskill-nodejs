# Invoice Management Platform

[![CI](https://github.com/JoannaMikul/upskill-nodejs/actions/workflows/ci.yml/badge.svg)](https://github.com/JoannaMikul/upskill-nodejs/actions/workflows/ci.yml)

NestJS 11 REST API for user management, monthly invoice submission, and automated reminders. JWT authentication with role-based access (`MANAGER`, `CUSTOMER`). Training project: PostgreSQL via Prisma, validation with Zod, scheduled jobs with `@nestjs/schedule`, tests with Jest.

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

| Entity         | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| `Account`      | Login identity: email (unique), password hash, role                         |
| `Manager`      | 1:1 profile for Manager accounts (seeded, not public)                       |
| `Customer`     | 1:1 profile created when a Customer registers; notification preferences   |
| `Invoice`      | Monthly invoice record linked to a Customer (`createdAt` = submission time) |
| `Notification` | Log of sent reminders (channel, recipient, subject, body, `sentAt`)         |

Registration creates an `Account` with role `CUSTOMER` and a linked `Customer` record (default notification channel: `EMAIL`). The seeded Manager has role `MANAGER` and a linked `Manager` record.

Each `Customer` has:

- `notificationChannel` — `EMAIL` or `SMS` (default `EMAIL`)
- `phoneNumber` — required when channel is `SMS`

A Customer **has submitted an invoice** for a calendar month when an `Invoice` exists with `createdAt` in that month.

## Seeded Manager account

After `pnpm prisma:seed`, one Manager exists in the database (created via `UsersService.seedManager()`, not registration):

| Field    | Default value         |
| -------- | --------------------- |
| Email    | `manager@example.com` |
| Password | `ManagerPass123`      |

Override with `MANAGER_EMAIL` and `MANAGER_PASSWORD` in `.env` before seeding.

## API endpoints

All responses for user objects omit `passwordHash`. Customer profiles include notification preferences; Manager profiles return `null` for those fields:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "notificationChannel": "EMAIL",
  "phoneNumber": null,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

Invoice responses:

```json
{
  "id": "uuid",
  "customerId": "uuid",
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

- **200** — current user profile (includes `notificationChannel` and `phoneNumber` for Customers)
- **401** — missing or invalid token

### 4. Update notification preferences (Customer only)

```bash
curl -X PATCH http://localhost:3000/users/me/notification-preferences \
  -H "Authorization: Bearer <customerAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{"notificationChannel":"SMS","phoneNumber":"+48123456789"}'
```

- **200** — updated user profile
- **400** — validation error (`phoneNumber` required when channel is `SMS`)
- **401** — missing or invalid token
- **403** — Manager token

### 5. Get user by ID (Manager only)

```bash
curl http://localhost:3000/users/<user-id> \
  -H "Authorization: Bearer <managerAccessToken>"
```

- **200** — user profile
- **403** — Customer token
- **404** — user not found

### 6. Get user by email (Manager only)

```bash
curl "http://localhost:3000/users?email=customer@example.com" \
  -H "Authorization: Bearer <managerAccessToken>"
```

- **200** — user profile (exact email match, case-insensitive)
- **403** — Customer token
- **404** — user not found

### 7. Submit invoice (Customer only)

```bash
curl -X POST http://localhost:3000/invoices \
  -H "Authorization: Bearer <customerAccessToken>"
```

- **201** — created invoice
- **401** — missing or invalid token
- **403** — Manager token
- **404** — Customer profile not found

### 8. List my invoices (Customer only)

```bash
curl http://localhost:3000/invoices/me \
  -H "Authorization: Bearer <customerAccessToken>"
```

- **200** — array of invoices for the authenticated Customer
- **401** — missing or invalid token
- **403** — Manager token

## Invoice reminder cron

A scheduled job runs **every day at 09:00** (`@Cron('0 9 * * *')`). On the **third-to-last day of the month** (e.g. 28 Jan, 25 Feb 2026, 27 Apr), it:

1. Finds Customers with **no invoice** in the current calendar month (`Invoice.createdAt`).
2. Sends a reminder via the Customer's preferred channel (`EMAIL` or `SMS`).
3. Persists each sent notification in the `Notification` table.

Outbound email and SMS are **stubbed** — messages are logged to the console instead of sent to real recipients.

Reminder message (EN):

> Reminder: you have not submitted an invoice for {Month YYYY}. Please submit it before month end.

Logic lives in `src/cron/` (`CronService` → `InvoiceReminderService` → `NotificationHandler`). Notifications use hexagonal architecture under `src/notifications/` (ports + adapters).

## Docker

The image is multi-stage and based on `node:24.18-bookworm-slim`. `prisma` is a production dependency, so `prisma migrate deploy` runs inside the container. Seeding stays local (`pnpm prisma:seed`) and is not part of the image.

Build and start Postgres, apply migrations, then serve the API on port 3000:

```bash
docker compose up --build
```

Build and run the same steps manually:

```bash
docker build -t upskill-nodejs .

docker run --rm \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/upskill?schema=public \
  upskill-nodejs \
  node_modules/.bin/prisma migrate deploy

docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/upskill?schema=public \
  -e JWT_SECRET=change-me \
  upskill-nodejs
```

Pushes to `main` publish the image to GHCR with tags `latest` and `sha-<commit>`:

```bash
docker pull ghcr.io/joannamikul/upskill-nodejs:latest
```

## CI/CD

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on pull requests to `main`, pushes to `main`, and `workflow_dispatch`. Jobs `lint`, `depcruise`, `audit`, `unit-tests`, `e2e-tests`, and `build` start in parallel. `docker` waits for all of them and pushes to `ghcr.io` only on a push to `main`.

| Job | What it runs |
| --- | --- |
| `lint` | `pnpm lint:ci`, `pnpm format:check`, `pnpm typecheck` |
| `depcruise` | `pnpm depcruise` |
| `audit` | `pnpm audit:ci` (fails on high production vulnerabilities). Full `pnpm audit` is informational and does not fail the job. |
| `unit-tests` | `pnpm test:ci`; uploads the `coverage/` artifact |
| `e2e-tests` | PostgreSQL 17 service, then `pnpm prisma:deploy` and `pnpm test:e2e:ci` |
| `build` | `pnpm build`; uploads the `dist/` artifact |
| `docker` | Builds the image. Publishes it only on push to `main`. |

[`.github/workflows/codeql.yml`](.github/workflows/codeql.yml) analyzes JavaScript and TypeScript on pull requests, pushes to `main`, and a weekly schedule.

Dependabot (`.github/dependabot.yml`) opens weekly updates for npm, GitHub Actions, and Docker. Minor and major bumps of the Node base image are ignored, because `engines.node` is pinned to `24.18.x`.

## Scripts

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `pnpm start:dev`      | Dev server with watch mode                       |
| `pnpm build`          | Compile to `dist/`                               |
| `pnpm start:prod`     | Run compiled app                                 |
| `pnpm prisma:migrate` | Create and apply a dev migration                 |
| `pnpm prisma:deploy`  | Apply existing migrations (`migrate deploy`)     |
| `pnpm prisma:seed`    | Seed Manager account                             |
| `pnpm prisma:studio`  | Open Prisma Studio                               |
| `pnpm test`           | Unit tests                                       |
| `pnpm test:ci`        | Unit tests in CI mode with coverage              |
| `pnpm test:e2e`       | End-to-end tests (requires PostgreSQL)           |
| `pnpm test:e2e:ci`    | End-to-end tests in CI mode                      |
| `pnpm lint`           | ESLint with `--fix`                              |
| `pnpm lint:ci`        | ESLint without `--fix`, warnings fail the run    |
| `pnpm format`         | Prettier write                                   |
| `pnpm format:check`   | Prettier check                                   |
| `pnpm typecheck`      | `tsc --noEmit` for `src` and `test`              |
| `pnpm depcruise`      | Dependency and architecture rules                |
| `pnpm audit:ci`       | `pnpm audit --prod`, fails on high severity      |

## Testing

```bash
pnpm test
pnpm test:e2e
```

E2e tests use the database from `DATABASE_URL`. They seed the Manager via `UsersService.seedManager()` and clean up test users, invoices, and notifications between runs.

## Project structure

```
src/
  auth/           # register, login, JWT strategy
  users/          # profile, notification preferences, Manager lookups, seedManager()
  invoices/       # submit and list invoices, query for reminder cron
  notifications/  # hexagonal module: ports, adapters, NotificationHandler
  cron/           # scheduled invoice reminders (@nestjs/schedule)
  common/         # guards, decorators, filters, shared types
  prisma/         # PrismaModule (global)
prisma/
  schema.prisma
  seed.ts
test/             # e2e specs (auth, users, notifications)
```
