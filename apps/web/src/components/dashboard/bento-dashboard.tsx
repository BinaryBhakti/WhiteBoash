import Link from "next/link";
import { Activity, BarChart3, FileText, LayoutDashboard, Users } from "lucide-react";
import { CreateDocumentButtons, TemplateGrid } from "@/components/dashboard/create-document-buttons";
import type { DocumentSummary, Workspace } from "@/lib/types";

type BentoDashboardProps = {
  workspace: Workspace;
  documents: DocumentSummary[];
};

export function BentoDashboard({ workspace, documents }: BentoDashboardProps) {
  const recent = documents.slice(0, 4);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-700">Workspace</p>
            <h1 className="text-3xl font-semibold text-slate-950">{workspace.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm" href="/settings/team">
              <LayoutDashboard className="size-4" />
              Team
            </Link>
            <CreateDocumentButtons workspaceId={workspace.id} />
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-6">
          <article className="rounded-md border bg-white p-5 shadow-sm md:col-span-4 md:row-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-950">Recent work</h2>
              <FileText className="size-5 text-slate-400" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {recent.length === 0 ? (
                <div className="col-span-full rounded-md border border-dashed p-8 text-center text-sm text-slate-500">
                  Create your first board or document to start collaborating.
                </div>
              ) : recent.map((document) => (
                <Link
                  key={document.id}
                  className="rounded-md border p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
                  href={document.type === "canvas" ? `/boards/${document.id}` : `/docs/${document.id}`}
                >
                  <p className="text-xs font-medium uppercase text-slate-500">{document.type}</p>
                  <h3 className="mt-2 font-semibold text-slate-950">{document.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{document.summary ?? "No preview yet."}</p>
                </Link>
              ))}
            </div>
          </article>

          <MetricCard className="md:col-span-2" icon={Users} label="Active collaborators" value="12" />
          <MetricCard className="md:col-span-2" icon={BarChart3} label="Documents edited" value="48" />

          <article className="rounded-md border bg-white p-5 shadow-sm md:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-950">Activity</h2>
              <Activity className="size-5 text-slate-400" />
            </div>
            <div className="space-y-3 text-sm text-slate-600">
              <p>Canvas architecture created for product planning.</p>
              <p>Team notes updated in the launch document.</p>
              <p>Design review board shared with editors.</p>
            </div>
          </article>

          <article className="rounded-md border bg-white p-5 shadow-sm md:col-span-3">
            <h2 className="text-base font-semibold text-slate-950">Templates</h2>
            <TemplateGrid workspaceId={workspace.id} />
          </article>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <article className={`rounded-md border bg-white p-5 shadow-sm ${className ?? ""}`}>
      <Icon className="mb-4 size-5 text-emerald-700" />
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    </article>
  );
}
