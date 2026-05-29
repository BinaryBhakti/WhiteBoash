"use client";

import { removeMemberAction, updateMemberRoleAction } from "@/app/actions/members";
import type { WorkspaceRole } from "@/lib/types";

type TeamMember = {
  userId: string;
  role: WorkspaceRole;
  status: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
};

export function TeamMembersTable({ workspaceId, members }: { workspaceId: string; members: TeamMember[] }) {
  return (
    <section className="overflow-hidden rounded-md border bg-white shadow-sm">
      <div className="grid grid-cols-[1fr_160px_180px] border-b bg-slate-50 px-4 py-3 text-xs font-medium uppercase text-slate-500">
        <span>Member</span>
        <span>Role</span>
        <span>Actions</span>
      </div>
      {members.map((member) => (
        <div key={member.userId} className="grid grid-cols-[1fr_160px_180px] items-center gap-3 border-b px-4 py-3 last:border-b-0">
          <div>
            <p className="font-medium text-slate-950">{member.displayName}</p>
            <p className="text-sm text-slate-500">{member.email ?? member.userId}</p>
          </div>
          <form action={updateMemberRoleAction}>
            <input name="workspaceId" type="hidden" value={workspaceId} />
            <input name="userId" type="hidden" value={member.userId} />
            <select
              className="w-full rounded-md border bg-white px-2 py-2 text-sm"
              defaultValue={member.role}
              disabled={member.role === "owner" || member.status !== "active"}
              name="role"
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <option value="owner" disabled>Owner</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </form>
          <form action={removeMemberAction}>
            <input name="workspaceId" type="hidden" value={workspaceId} />
            <input name="userId" type="hidden" value={member.userId} />
            <button
              className="rounded-md border px-3 py-2 text-sm font-medium text-rose-700 disabled:text-slate-400"
              disabled={member.role === "owner" || member.status !== "active"}
              type="submit"
            >
              {member.status === "active" ? "Remove" : "Removed"}
            </button>
          </form>
        </div>
      ))}
    </section>
  );
}
