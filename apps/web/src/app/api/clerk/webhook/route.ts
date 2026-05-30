import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { getWebhookEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  let secret: string;
  try {
    secret = getWebhookEnv().CLERK_WEBHOOK_SECRET;
  } catch {
    return Response.json({ error: "Clerk webhook is not configured." }, { status: 500 });
  }

  const payload = await request.text();
  const headerStore = await headers();
  const svixHeaders = {
    "svix-id": headerStore.get("svix-id") ?? "",
    "svix-timestamp": headerStore.get("svix-timestamp") ?? "",
    "svix-signature": headerStore.get("svix-signature") ?? "",
  };

  let event: WebhookEvent;

  try {
    event = new Webhook(secret).verify(payload, svixHeaders) as WebhookEvent;
  } catch {
    return Response.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type !== "user.created" && event.type !== "user.updated") {
    return Response.json({ ok: true });
  }

  const user = event.data;
  const primaryEmail = user.email_addresses.find((email) => email.id === user.primary_email_address_id);
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Collaborator";
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: primaryEmail?.email_address ?? user.email_addresses[0]?.email_address ?? null,
    display_name: displayName,
    avatar_url: user.image_url,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
