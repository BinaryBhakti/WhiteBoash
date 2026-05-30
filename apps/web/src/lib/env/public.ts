import { z } from "zod";

const publicWebEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_YJS_WS_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith("ws://") || value.startsWith("wss://"), {
      message: "NEXT_PUBLIC_YJS_WS_URL must use ws:// or wss://.",
    }),
});

export function getPublicWebEnv() {
  const parsed = publicWebEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_YJS_WS_URL: process.env.NEXT_PUBLIC_YJS_WS_URL,
  });

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`Invalid public web environment: ${details}`);
  }

  return parsed.data;
}

export function getYjsWebSocketUrl() {
  const parsed = publicWebEnvSchema.shape.NEXT_PUBLIC_YJS_WS_URL.safeParse(process.env.NEXT_PUBLIC_YJS_WS_URL);

  if (!parsed.success) {
    throw new Error("The collaboration server URL is missing or invalid.");
  }

  return parsed.data;
}

export function getAppPublicEnv() {
  const parsed = publicWebEnvSchema
    .pick({
      NEXT_PUBLIC_APP_URL: true,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: true,
    })
    .safeParse({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    });

  if (!parsed.success) {
    throw new Error("The public application URL or Clerk publishable key is missing or invalid.");
  }

  return parsed.data;
}

export function getBrowserSupabaseEnv() {
  const parsed = publicWebEnvSchema
    .pick({
      NEXT_PUBLIC_SUPABASE_URL: true,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
    })
    .safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

  if (!parsed.success) {
    throw new Error("The browser Supabase configuration is missing or invalid.");
  }

  return parsed.data;
}
