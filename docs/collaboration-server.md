# Collaboration Server

`apps/collab` runs a Hocuspocus server for Yjs rooms.

Room names use:

```text
workspace:{workspaceId}:document:{documentId}
```

On connection the server:

1. Verifies the Clerk token.
2. Parses the workspace/document room.
3. Checks active workspace membership in Supabase.
4. Loads `documents.yjs_state` into a `Y.Doc`.
5. Stores compacted Yjs state back into Supabase on changes.
6. Creates periodic snapshots in `document_snapshots`.

Viewer connections are accepted but marked read-only by context. Mutations from viewers are rejected in the change hook.

## Health Check

The server exposes:

```text
GET /health
```

Response:

```json
{
  "ok": true,
  "service": "collab",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Use this endpoint as the Railway health check. Startup, rejected authentication, persistence failures, snapshots, and shutdown events are logged as structured JSON.

## Production Deployment

Deploy `apps/collab` as a long-running Railway service:

```text
Root Directory: apps/collab
Build Command: npm install && npm run build
Start Command: npm run start
Health Check Path: /health
```

After Railway creates a public domain, set the Vercel web app variable:

```bash
NEXT_PUBLIC_YJS_WS_URL=wss://<railway-collab-domain>
```
