import { AppShell } from "@/components/dashboard/app-shell";
import { TeamMembersTable } from "@/components/dashboard/team-members-table";
import { getTeamSettingsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function TeamSettingsPage() {
  const { workspace, members } = await getTeamSettingsData();

  return (
    <AppShell>
      <main className="min-h-[calc(100vh-3.5rem)] bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-700">{workspace.name}</p>
              <h1 className="text-3xl font-semibold text-slate-950">Team settings</h1>
            </div>
            <button className="rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-500 shadow-sm" disabled type="button">
              Invite by email
            </button>
          </header>

          <TeamMembersTable workspaceId={workspace.id} members={members} />
        </div>
      </main>
    </AppShell>
  );
}
