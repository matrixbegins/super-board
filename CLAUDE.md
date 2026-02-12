# Kan — Project Guide for Claude Code

## Overview

Kan is a self-hosted kanban/project management app (Trello alternative). Built with Next.js 15, tRPC, Drizzle ORM, PostgreSQL, and TypeScript in a pnpm monorepo.

## Monorepo Structure

```
apps/web         — Main Next.js app (Pages Router, port 3000)
apps/docs        — Documentation site (Fumadocs, port 3001)
packages/api     — tRPC routers and procedures
packages/auth    — Better Auth configuration
packages/db      — Drizzle ORM schemas, migrations, seed
packages/email   — Email templates and sending
packages/shared  — Shared utilities (S3, slugs, UIDs, colors)
packages/stripe  — Stripe billing integration
packages/widget  — @kanbn/feedback-widget (standalone, Vite-built)
tooling/eslint   — Shared ESLint flat config (@kan/eslint-config)
tooling/prettier — Shared Prettier config (@kan/prettier-config)
tooling/typescript — Shared tsconfig (@kan/tsconfig)
tooling/tailwind — Shared Tailwind config
```

## Commands

```bash
pnpm dev          # Start all packages (turbo watch)
pnpm dev:next     # Start Next.js only
pnpm lint         # ESLint across all packages
pnpm lint:fix     # ESLint with --fix
pnpm format       # Prettier check
pnpm format:fix   # Prettier write
pnpm typecheck    # TypeScript check across all packages
pnpm db:migrate   # Run Drizzle migrations
pnpm db:studio    # Open Drizzle Studio
```

## Coding Conventions

### Naming

- **Components**: PascalCase files with `.tsx` — `Button.tsx`, `AuthForm.tsx`
- **Hooks**: camelCase with `use` prefix — `useDebounce.ts`, `useClickOutside.ts`
- **Utils/helpers**: camelCase — `generateSlug.ts`
- **DB schemas**: camelCase, plural table names — `boards.ts`, `cards.ts`
- **tRPC routers**: camelCase — `board.ts`, `card.ts`
- **Repository files**: camelCase with `.repo.ts` suffix — `board.repo.ts`

### Imports

Order enforced by Prettier plugin (`@ianvs/prettier-plugin-sort-imports`):

1. Type imports
2. `next` / `react`
3. Third-party modules
4. `@kan/*` workspace packages
5. `~/` local imports (web app path alias)
6. Relative imports

Always use `import type { ... }` for type-only imports (enforced by ESLint).

### TypeScript

- **Strict mode** enabled — `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true`
- No `any` types — use `unknown` and narrow, or define proper types
- No non-null assertions (`!`) — handle nullability explicitly
- Prefix unused variables with `_` — e.g., `_unusedParam`
- Use consistent type imports: `import type { Foo } from "bar"`

### Environment Variables

- **Never** access `process.env` directly in `apps/web` — use `~/env` (t3-env)
- ESLint `restrictEnvAccess` rule enforces this
- Define new env vars in `apps/web/src/env.ts` with Zod validation
- Client-side vars must be prefixed `NEXT_PUBLIC_`

### tRPC Patterns

- Routers use `createTRPCRouter` with `.query()` / `.mutation()` procedures
- Input validation with Zod: `input: z.object({ ... })`
- Three procedure types: `publicProcedure`, `protectedProcedure`, `adminProtectedProcedure`
- Errors via `TRPCError` with specific codes: `UNAUTHORIZED`, `NOT_FOUND`, `FORBIDDEN`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR`
- Permission checks: `assertPermission()`, `assertCanEdit()`, `assertCanDelete()`
- CRUD naming: `create`, `update`, `delete`, `byId`, `all`

### Drizzle ORM

- Tables defined with `pgTable()`, enums with `pgEnum()`
- Relations defined separately with `relations()`
- Soft delete pattern: `deletedAt` + `deletedBy` columns
- RLS enabled via `.enableRLS()` on sensitive tables
- Add indexes for frequently queried columns
- Use `bigserial` for primary keys, `varchar` with `publicId` for public-facing IDs

### State Management

- React Context providers in `apps/web/src/providers/`
- Each provider exports a `useXxx()` hook — e.g., `useWorkspace()`, `useModal()`
- No Redux or Zustand — keep it simple with Context
- Modal system is stack-based via `ModalProvider`

### Page Structure (Pages Router)

- Thin page wrappers in `pages/` that delegate to view components:
  ```tsx
  // pages/index.tsx
  import HomeView from "~/views/home";

  export default function Home() {
    return <HomeView />;
  }
  ```
- Feature views in `apps/web/src/views/` organized by domain
- Sub-components co-located in `views/<feature>/components/`

### CSS / Styling

- Tailwind CSS with `cn()` utility for conditional classes (from `@kan/ui`)
- Tailwind class sorting enforced by `prettier-plugin-tailwindcss`
- Use `cva` (class-variance-authority) for component variants

## Pre-commit Hooks

Husky + lint-staged runs on every commit:

- `*.{ts,tsx,js,jsx}` — Prettier format + ESLint fix
- `*.{json,md,mdx,css,yaml,yml}` — Prettier format

Typecheck runs in CI (too slow for pre-commit in monorepo).

## UX Quality Standard

All interfaces must be polished to enterprise production-grade quality. Every interaction, animation, and visual detail matters — it elevates the level and credibility of our work.

- **Never ship mediocre UX** — every feature must feel intuitive and refined
- Interactions should match user expectations from best-in-class tools (Miro, Linear, Figma, Notion)
- Micro-interactions and transitions should feel smooth and intentional
- Drag, hover, focus, and error states must all be handled gracefully
- Accessibility and responsiveness are not optional
- When in doubt, study how top-tier products handle the same interaction

## What to Avoid

- `process.env` in web app code — use `~/env`
- `any` types — use `unknown` or proper types
- Non-null assertions (`!`) — handle null cases
- Direct DOM manipulation in React components
- Adding dependencies without checking if a workspace package already provides it
- Creating new state management patterns — use existing Context providers
- Skipping Zod validation on tRPC inputs
- Omitting error codes on `TRPCError`
- Forgetting `deletedAt`/`deletedBy` on new tables that need soft delete
