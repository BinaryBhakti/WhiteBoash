import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { getErrorMessage, isMissingSupabaseSchemaError } from "@/lib/supabase/errors";

const REQUIRED_TABLES = [
  "profiles",
  "workspaces",
  "workspace_members",
  "documents",
  "document_snapshots",
  "audit_events",
] as const;

export type DatabaseHealth =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: "missing-env" | "schema" | "connection";
      message: string;
      missingTables?: string[];
    };

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  if (!hasSupabaseAdminEnv()) {
    return {
      ok: false,
      reason: "missing-env",
      message: "Supabase URL or service role key is missing.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const missingTables: string[] = [];

  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select("*", { count: "exact", head: true });

    if (!error) {
      continue;
    }

    if (isMissingSupabaseSchemaError(error)) {
      missingTables.push(table);
      continue;
    }

    return {
      ok: false,
      reason: "connection",
      message: getErrorMessage(error),
    };
  }

  if (missingTables.length > 0) {
    return {
      ok: false,
      reason: "schema",
      message: "Supabase is reachable, but required application tables are not available.",
      missingTables,
    };
  }

  return { ok: true };
}
