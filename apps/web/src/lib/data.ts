import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentUser } from "@/lib/clerk";
import type { DocumentSummary, DocumentType, Workspace, WorkspaceRole } from "@/lib/types";

type WorkspaceMemberRow = {
  role: WorkspaceRole;
  workspaces:
    | {
        id: string;
        name: string;
        slug: string;
        archived_at: string | null;
      }
    | Array<{
        id: string;
        name: string;
        slug: string;
        archived_at: string | null;
      }>;
};

type DocumentRow = {
  id: string;
  workspace_id: string;
  type: DocumentType;
  title: string;
  summary: string | null;
  updated_at: string;
};

export const getCurrentUser = cache(requireCurrentUser);

export async function upsertCurrentProfile() {
  const user = await getCurrentUser();
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    display_name: user.displayName,
    avatar_url: user.avatarUrl,
  });

  if (error) {
    throw new Error(`Failed to upsert profile: ${error.message}`);
  }

  return user;
}

export async function getOrCreateDefaultWorkspace(): Promise<Workspace> {
  const user = await upsertCurrentProfile();
  const supabase = createSupabaseAdminClient();

  const { data: membershipRows, error } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name, slug, archived_at)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(20);

  if (error) {
    throw new Error(`Failed to load workspaces: ${error.message}`);
  }

  const firstMembership = (membershipRows as WorkspaceMemberRow[] | null)?.find((row) => {
    const workspace = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
    return workspace && !workspace.archived_at;
  });

  if (firstMembership) {
    const workspace = Array.isArray(firstMembership.workspaces)
      ? firstMembership.workspaces[0]
      : firstMembership.workspaces;

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: firstMembership.role,
    };
  }

  const { data: ownedWorkspace, error: ownedWorkspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("created_by", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (ownedWorkspaceError) {
    throw new Error(`Failed to recover owned workspace: ${ownedWorkspaceError.message}`);
  }

  if (ownedWorkspace) {
    const { error: memberError } = await supabase.from("workspace_members").upsert({
      workspace_id: ownedWorkspace.id,
      user_id: user.id,
      role: "owner",
      status: "active",
    });

    if (memberError) {
      throw new Error(`Failed to recover workspace membership: ${memberError.message}`);
    }

    return {
      id: ownedWorkspace.id,
      name: ownedWorkspace.name,
      slug: ownedWorkspace.slug,
      role: "owner",
    };
  }

  const slug = `workspace-${user.id.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 32)}`;
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      name: "My Workspace",
      slug,
      created_by: user.id,
    })
    .select("id, name, slug")
    .single();

  if (workspaceError) {
    throw new Error(`Failed to create workspace: ${workspaceError.message}`);
  }

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  });

  if (memberError) {
    throw new Error(`Failed to create workspace membership: ${memberError.message}`);
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    role: "owner",
  };
}

export async function getDashboardData() {
  const workspace = await getOrCreateDefaultWorkspace();
  const documents = await getWorkspaceDocuments(workspace.id);

  return {
    workspace,
    documents,
  };
}

export async function getTeamSettingsData() {
  const workspace = await getOrCreateDefaultWorkspace();
  const role = await assertWorkspaceRole(workspace.id, ["owner", "admin"]);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id, role, status, profiles!workspace_members_user_id_fkey(id, email, display_name, avatar_url)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load members: ${error.message}`);
  }

  return {
    workspace: {
      ...workspace,
      role,
    },
    members: ((data as Array<{
      user_id: string;
      role: WorkspaceRole;
      status: string;
      profiles:
        | {
            id: string;
            email: string | null;
            display_name: string | null;
            avatar_url: string | null;
          }
        | Array<{
            id: string;
            email: string | null;
            display_name: string | null;
            avatar_url: string | null;
          }>;
    }> | null) ?? []).map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

      return {
        userId: row.user_id,
        role: row.role,
        status: row.status,
        email: profile?.email ?? null,
        displayName: profile?.display_name ?? "Collaborator",
        avatarUrl: profile?.avatar_url ?? null,
      };
    }),
  };
}

export async function getWorkspaceDocuments(workspaceId: string): Promise<DocumentSummary[]> {
  await assertWorkspaceRole(workspaceId, ["owner", "admin", "editor", "viewer"]);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, workspace_id, type, title, summary, updated_at")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load documents: ${error.message}`);
  }

  return ((data as DocumentRow[] | null) ?? []).map(mapDocumentSummary);
}

export async function getDocumentRoom(documentId: string, expectedType?: DocumentType) {
  const user = await getCurrentUser();
  const supabase = createSupabaseAdminClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, workspace_id, type, title, summary, updated_at, archived_at")
    .eq("id", documentId)
    .single();

  if (error || !document || document.archived_at) {
    notFound();
  }

  if (expectedType && document.type !== expectedType) {
    notFound();
  }

  const role = await getWorkspaceRole(document.workspace_id, user.id);
  if (!role) {
    notFound();
  }

  return {
    document: mapDocumentSummary(document as DocumentRow),
    workspaceId: document.workspace_id as string,
    role,
    canEdit: role === "owner" || role === "admin" || role === "editor",
  };
}

export async function getWorkspaceRole(workspaceId: string, userId?: string): Promise<WorkspaceRole | null> {
  const currentUser = userId ? null : await getCurrentUser();
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId ?? currentUser?.id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load workspace role: ${error.message}`);
  }

  return (data?.role as WorkspaceRole | undefined) ?? null;
}

export async function assertWorkspaceRole(workspaceId: string, allowedRoles: WorkspaceRole[]) {
  const role = await getWorkspaceRole(workspaceId);

  if (!role || !allowedRoles.includes(role)) {
    notFound();
  }

  return role;
}

export async function redirectToDocument(documentId: string, type: DocumentType): Promise<never> {
  redirect(type === "canvas" ? `/boards/${documentId}` : `/docs/${documentId}`);
}

function mapDocumentSummary(row: DocumentRow): DocumentSummary {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: row.type,
    title: row.title,
    summary: row.summary,
    updatedAt: row.updated_at,
  };
}
