import { createClient } from "@supabase/supabase-js";
import { getBrowserSupabaseEnv } from "@/lib/env/public";

export function createSupabaseBrowserClient(accessToken?: string | null) {
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey } = getBrowserSupabaseEnv();

  return createClient(url, anonKey, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}
