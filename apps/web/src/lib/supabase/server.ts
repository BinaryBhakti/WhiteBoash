import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabaseEnv } from "@/lib/env/server";

export async function createSupabaseServerClient() {
  const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey } = getServerSupabaseEnv();

  const { getToken } = await auth();
  const token = await getToken({ template: "supabase" });

  return createClient(url, anonKey, {
    global: token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  });
}
