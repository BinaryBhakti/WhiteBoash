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
