# Deployment Environment

## Web App

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_YJS_WS_URL=
CLERK_WEBHOOK_SECRET=
```

## Collaboration Server

```bash
COLLAB_PORT=1234
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLERK_JWKS_URL=
```

Deploy the collaboration server as a long-running Node service. For multi-instance deployments, add Redis-backed coordination before scaling horizontally.
