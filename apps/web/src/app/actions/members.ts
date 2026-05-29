"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertWorkspaceRole, getCurrentUser } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const updateMemberSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().min(1),
  role: z.enum(["admin", "editor", "viewer"]),
});

const removeMemberSchema = z.object({
  workspaceId: z.string().uuid(),
  userId: z.string().min(1),
});

export async function updateMemberRoleAction(formData: FormData) {
  const parsed = updateMemberSchema.parse({
    workspaceId: formData.get("workspaceId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  const actor = await getCurrentUser();
  await assertWorkspaceRole(parsed.workspaceId, ["owner", "admin"]);

  if (actor.id === parsed.userId) {
    throw new Error("You cannot change your own role.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("workspace_members")
    .update({ role: parsed.role })
    .eq("workspace_id", parsed.workspaceId)
    .eq("user_id", parsed.userId)
    .neq("role", "owner");

  if (error) {
    throw new Error(`Failed to update member role: ${error.message}`);
  }

  await writeAuditEvent(parsed.workspaceId, actor.id, "member.role_updated", {
    targetUserId: parsed.userId,
    role: parsed.role,
  });

  revalidatePath("/settings/team");
}

export async function removeMemberAction(formData: FormData) {
  const parsed = removeMemberSchema.parse({
    workspaceId: formData.get("workspaceId"),
    userId: formData.get("userId"),
  });

  const actor = await getCurrentUser();
  await assertWorkspaceRole(parsed.workspaceId, ["owner", "admin"]);

  if (actor.id === parsed.userId) {
    throw new Error("You cannot remove yourself.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("workspace_members")
    .update({ status: "removed" })
    .eq("workspace_id", parsed.workspaceId)
    .eq("user_id", parsed.userId)
    .neq("role", "owner");

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`);
  }

  await writeAuditEvent(parsed.workspaceId, actor.id, "member.removed", {
    targetUserId: parsed.userId,
  });

  revalidatePath("/settings/team");
}

async function writeAuditEvent(workspaceId: string, actorId: string, action: string, metadata: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    actor_id: actorId,
    action,
    metadata,
  });
}
