# Production Checklist

## Supabase

1. Apply migrations in order:

```text
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_production_hardening.sql
```

2. Confirm these tables are visible:

```text
profiles
workspaces
workspace_members
documents
document_snapshots
audit_events
```

## Clerk

1. Configure the `supabase` JWT template with the Clerk user ID in the `sub` claim.
2. Configure the webhook endpoint:

```text
POST https://<vercel-domain>/api/clerk/webhook
```

3. Subscribe to:

```text
user.created
user.updated
```

4. Add the webhook signing secret to Vercel as `CLERK_WEBHOOK_SECRET`.
5. Add the active Clerk instance JWKS endpoint to Railway as `CLERK_JWKS_URL`.

## Railway Collaboration Server

1. Deploy `apps/collab` using the settings in `docs/deployment-env.md`.
2. Add the required Railway variables.
3. Generate a public domain.
4. Confirm:

```text
GET https://<railway-collab-domain>/health
```

returns `200`.

## Vercel Web App

1. Deploy `apps/web` using the settings in `docs/deployment-env.md`.
2. Add:

```bash
NEXT_PUBLIC_YJS_WS_URL=wss://<railway-collab-domain>
```

3. Redeploy after changing environment variables.

## Acceptance Checks

1. Create a new Clerk user and confirm a Supabase profile and default workspace exist.
2. Create a board and draw a shape.
3. Refresh the board and confirm the shape reloads.
4. Restart the Railway service and confirm the shape still reloads.
5. Open the same board in two authenticated browser sessions and confirm updates synchronize.
6. Confirm a viewer can open the board but cannot mutate it.

## Dependency Review

`npm audit --package-lock-only` currently reports five advisories: one moderate and four high. The available automated fixes require upgrading Next.js and `eslint-config-next` to `16.2.6`, which is a major compatibility change. Handle that as a dedicated upgrade task with Clerk, middleware, build, and E2E regression checks. Do not run `npm audit fix --force` during routine deployment.
