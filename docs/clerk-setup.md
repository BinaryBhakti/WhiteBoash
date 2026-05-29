# Clerk Setup

## Supabase JWT Template

Create a Clerk JWT template named `supabase` with a `sub` claim matching the Clerk user ID. Supabase RLS functions read the `sub` claim.

## Webhook

Create a Clerk webhook pointing to:

```text
/api/clerk/webhook
```

Subscribe to:

- `user.created`
- `user.updated`

Set `CLERK_WEBHOOK_SECRET` to the signing secret from Clerk.

## Collaboration Server

Set `CLERK_JWKS_URL` to the Clerk JWKS endpoint for your instance so `apps/collab` can verify room tokens. The Yjs client sends the default Clerk session token to Hocuspocus; Supabase database reads still use the `supabase` JWT template.
