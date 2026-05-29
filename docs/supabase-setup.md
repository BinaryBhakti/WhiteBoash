# Supabase Setup

Apply migrations in order:

```bash
supabase db push
```

Or paste the SQL files from `supabase/migrations` into the Supabase SQL editor.

## RLS Model

- `profiles.id` is the Clerk user ID.
- `workspace_members` defines the tenant boundary.
- `documents.workspace_id` ties boards and text documents to a workspace.
- RLS allows members to read documents and only `owner`, `admin`, or `editor` to create/update documents.

The app uses the service role key only on trusted server paths for first-run onboarding, webhooks, admin actions, and the collaboration server.
