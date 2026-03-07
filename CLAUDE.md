# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BCV Rates is a monorepo for tracking Venezuelan Bolivar (VES) exchange rates from the Banco Central de Venezuela (BCV). It scrapes the BCV website for official USD and EUR rates and exposes them via an API consumed by web and mobile clients.

## Monorepo Structure

- **pnpm workspaces** with **Turborepo** for orchestration
- `apps/api` - NestJS backend (tRPC, Prisma, PostgreSQL, Firebase Auth)
- `apps/web` - React SPA (Vite/Rolldown, TanStack Router, TanStack Query, tRPC, Tailwind CSS, shadcn/ui)
- `apps/mobile` - React Native app (Expo Router, TanStack Query, tRPC)
- `packages/domain` - Shared pure TypeScript library (conversion, formatting, date utilities)

## Commands

### Development
```bash
pnpm dev              # Start all apps in dev mode (turbo)
pnpm --filter api dev # Start only the API
pnpm --filter web dev # Start only the web app
```

### Build
```bash
pnpm build            # Build all packages
```

### Linting & Formatting (Biome)
```bash
pnpm lint:fix         # Auto-fix formatting, imports, and lint issues
pnpm lint             # Check for remaining lint issues
```

### Type Checking
```bash
pnpm type-check       # Run tsc --noEmit across all packages
```

### Database (Prisma, via API package)
```bash
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Create/apply dev migrations
pnpm db:migrate:deploy # Apply migrations in production
pnpm db:push          # Push schema without migrations
pnpm db:studio        # Open Prisma Studio
pnpm docker:up        # Start PostgreSQL (port 5435)
pnpm docker:down      # Stop PostgreSQL
```

### Domain Package Tests
```bash
pnpm --filter domain test  # Build + node --test
```

## Architecture

### API (`apps/api`)
- **NestJS** with modules: `AppModule` → `PrismaModule`, `ExchangeRatesModule`, `TrpcModule`
- **tRPC** router tree: `appRouter` → `account`, `customRates`, `exchangeRates`, `historicalRates`
- **Procedures**: `publicProcedure`, `protectedProcedure` (Firebase Auth), `serverProcedure` (internal server auth), `protectedOrServerProcedure`
- **ExchangeRatesService** scrapes `bcv.org.ve` HTML on startup and via cron (`@nestjs/schedule`). Handles TLS fallback for BCV's unreliable certificates.
- **Prisma** schema at `apps/api/prisma/schema.prisma` with generated client output to `apps/api/generated/prisma`
- Path aliases use `@/` prefix (e.g., `@/prisma/prisma.service`)

### Web (`apps/web`)
- React 19 with React Compiler (babel-plugin-react-compiler)
- TanStack Router for file-based routing, TanStack Query for data fetching with persistence
- tRPC client connects to the API; configured in `src/trpc/`
- UI components in `src/components/ui/` (shadcn/ui pattern), use `cn()` from `src/lib/utils.ts`
- PWA support via vite-plugin-pwa
- Firebase for authentication

### Mobile (`apps/mobile`)
- Expo SDK 54 with Expo Router (file-based routing in `app/`)
- Screens: home (`index.tsx`), history, settings, auth
- Same tRPC + TanStack Query pattern as web
- Google Sign-In via `@react-native-google-signin/google-signin`

### Domain Package (`packages/domain`)
- Pure TypeScript, ESM output, no runtime dependencies
- Exports: `foreignToVes`, `vesToForeign`, `formatAmount`, `formatRate`, `parseAmount`, `formatChartDate`, `parseIsoCalendarDateToLocalDate`

## Quality Checks

After any code change, run these in order before considering the task complete:
1. `pnpm lint:fix` - auto-format and fix
2. `pnpm lint` - verify no remaining issues
3. `pnpm type-check` - catch type errors

Do not suppress lint/type errors with `biome-ignore`, `@ts-ignore`, or `any` casts unless there is a genuine, documented reason.

## Key Conventions

- Formatter: Biome (2-space indent, organized imports)
- Vite is overridden to use `rolldown-vite` via pnpm overrides
- Production deployment uses PM2 (`ecosystem.config.js`), port 3006
- PostgreSQL runs on port 5435 locally (Docker)
