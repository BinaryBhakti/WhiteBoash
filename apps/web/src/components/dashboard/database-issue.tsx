import { AlertTriangle, Database } from "lucide-react";
import type { DatabaseHealth } from "@/lib/supabase/health";

type DatabaseIssueProps = {
  health: Exclude<DatabaseHealth, { ok: true }>;
};

export function DatabaseIssue({ health }: DatabaseIssueProps) {
  const isMissingEnv = health.reason === "missing-env";
  const title = isMissingEnv ? "Connect Supabase to continue" : "Supabase needs attention";

  return (
    <main className="grid min-h-[calc(100vh-3.5rem)] place-items-center bg-slate-50 px-6">
      <section className="max-w-2xl rounded-md border bg-white p-6 shadow-sm">
        <div className="grid size-12 place-items-center rounded-md bg-amber-50 text-amber-700">
          {isMissingEnv ? <Database className="size-5" /> : <AlertTriangle className="size-5" />}
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{health.message}</p>

        {isMissingEnv ? (
          <div className="mt-5 rounded-md bg-slate-50 p-4 text-left font-mono text-xs text-slate-700">
            <p>NEXT_PUBLIC_SUPABASE_URL=...</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</p>
            <p>SUPABASE_SERVICE_ROLE_KEY=...</p>
          </div>
        ) : null}

        {health.reason === "schema" ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-950">Run these migrations in Supabase SQL Editor:</p>
              <p className="mt-2 font-mono text-xs text-slate-700">supabase/migrations/0001_initial_schema.sql</p>
              <p className="mt-1 font-mono text-xs text-slate-700">supabase/migrations/0002_production_hardening.sql</p>
            </div>
            {health.missingTables?.length ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Missing or not visible</p>
                <p className="mt-2 font-mono text-xs text-slate-700">{health.missingTables.join(", ")}</p>
              </div>
            ) : null}
            <p className="text-sm leading-6 text-slate-600">
              If you just ran the SQL, wait a moment and restart the Next.js dev server so PostgREST and Next reload
              the fresh schema.
            </p>
          </div>
        ) : null}

        {health.reason === "connection" ? (
          <div className="mt-5 rounded-md bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-950">Database response</p>
            <p className="mt-2 font-mono text-xs text-slate-700">{health.message}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
