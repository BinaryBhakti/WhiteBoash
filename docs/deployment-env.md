# Deployment Environment

## Topology

Deploy `apps/web` to Vercel and `apps/collab` to Railway. The web app must use the Railway public domain over secure WebSockets.

## Vercel Web App

```bash
NEXT_PUBLIC_APP_URL=https://<vercel-domain>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_YJS_WS_URL=wss://<railway-collab-domain>
CLERK_WEBHOOK_SECRET=
```

Vercel project settings:

```text
Root Directory: apps/web
Install Command: npm install
Build Command: npm run build
Output Directory: override disabled
```

## Railway Collaboration Server

```bash
COLLAB_PORT=1234
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLERK_JWKS_URL=
NODE_ENV=production
```

Railway service settings:

```text
Root Directory: apps/collab
Build Command: npm install && npm run build
Start Command: npm run start
Health Check Path: /health
```

Confirm `https://<railway-collab-domain>/health` returns `200`, then redeploy Vercel after setting `NEXT_PUBLIC_YJS_WS_URL`.

Use one collaboration-server instance initially. Add Redis-backed coordination before scaling horizontally.
