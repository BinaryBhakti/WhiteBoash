import { AppShell } from "@/components/dashboard/app-shell";
import { BentoDashboard } from "@/components/dashboard/bento-dashboard";
import { DatabaseIssue } from "@/components/dashboard/database-issue";
import { getDashboardData } from "@/lib/data";
import { isMissingSupabaseSchemaError } from "@/lib/supabase/errors";
import { checkDatabaseHealth } from "@/lib/supabase/health";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const databaseHealth = await checkDatabaseHealth();

  if (!databaseHealth.ok) {
    return (
      <AppShell>
        <DatabaseIssue health={databaseHealth} />
      </AppShell>
    );
  }

  const dashboardData = await getDashboardData().catch((error: unknown) => {
    if (isMissingSupabaseSchemaError(error)) {
      return {
        databaseError: {
          ok: false as const,
          reason: "schema" as const,
          message: "Supabase is reachable, but required application tables are not available.",
          missingTables: ["profiles"],
        },
      };
    }

    throw error;
  });

  if ("databaseError" in dashboardData) {
    return (
      <AppShell>
        <DatabaseIssue health={dashboardData.databaseError} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <BentoDashboard workspace={dashboardData.workspace} documents={dashboardData.documents} />
    </AppShell>
  );
}
