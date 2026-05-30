import "server-only";
import { z } from "zod";

const adminEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const serverSupabaseEnvSchema = adminEnvSchema.extend({
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const webhookEnvSchema = z.object({
  CLERK_WEBHOOK_SECRET: z.string().min(1),
});

const clerkServerEnvSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
});

function parseEnv<TSchema extends z.ZodType>(schema: TSchema, boundary: string): z.infer<TSchema> {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid ${boundary} environment: ${details}`);
  }

  return parsed.data;
}

export function hasSupabaseAdminEnv() {
  return adminEnvSchema.safeParse(process.env).success;
}

export function getSupabaseAdminEnv() {
  return parseEnv(adminEnvSchema, "Supabase admin");
}

export function getServerSupabaseEnv() {
  return parseEnv(serverSupabaseEnvSchema, "Supabase server");
}

export function getWebhookEnv() {
  return parseEnv(webhookEnvSchema, "Clerk webhook");
}

export function assertClerkServerEnv() {
  parseEnv(clerkServerEnvSchema, "Clerk server");
}
