import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv, hasSupabaseAdminEnv } from "@/lib/env/server";

export { hasSupabaseAdminEnv };

export function createSupabaseAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey } = getSupabaseAdminEnv();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
