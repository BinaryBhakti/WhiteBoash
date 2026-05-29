# Local Development

## Services

Run the web app:

```bash
npm run dev
```

Run the collaboration server:

```bash
npm run dev:collab
```

The web app expects `NEXT_PUBLIC_YJS_WS_URL` to point at the collaboration server, usually:

```bash
NEXT_PUBLIC_YJS_WS_URL=ws://localhost:1234
```

## Required Environment

Copy `.env.example` to `.env.local` for local web development and set:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_YJS_WS_URL=ws://localhost:1234
CLERK_WEBHOOK_SECRET=
CLERK_JWKS_URL=
```

The collaboration server also reads the Supabase service role key and Clerk JWKS URL so it can authorize WebSocket room access.

In this monorepo, the Next.js app reads env values from `apps/web/.env.local`. The Clerk CLI may also create a root `.env.local`; keep `apps/web/.env.local` populated for local web builds.
