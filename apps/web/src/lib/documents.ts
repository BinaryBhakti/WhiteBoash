import * as Y from "yjs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { encodeBytea } from "@/lib/bytea";
import { getCurrentUser, getWorkspaceRole } from "@/lib/data";
import type { DocumentType } from "@/lib/types";

type CreateDocumentInput = {
  workspaceId: string;
  type: DocumentType;
  title: string;
  summary?: string;
};

type DocumentActor = {
  id: string;
};

export async function createDocument(input: CreateDocumentInput) {
  const user = await getCurrentUser();
  return createDocumentForUser(input, user);
}

export async function createDocumentForUser(input: CreateDocumentInput, user: DocumentActor) {
  const role = await getWorkspaceRole(input.workspaceId, user.id);

  if (!role || !["owner", "admin", "editor"].includes(role)) {
    throw new Error("You do not have permission to create documents in this workspace.");
  }

  const supabase = createSupabaseAdminClient();
  const initialDoc = new Y.Doc();
  const initialState = encodeBytea(Y.encodeStateAsUpdate(initialDoc));

  const { data, error } = await supabase
    .from("documents")
    .insert({
      workspace_id: input.workspaceId,
      type: input.type,
      title: input.title,
      summary: input.summary ?? (input.type === "canvas" ? "New collaborative whiteboard" : "New collaborative document"),
      yjs_state: initialState,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id, type")
    .single();

  if (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }

  return {
    id: data.id as string,
    type: data.type as DocumentType,
    href: data.type === "canvas" ? `/boards/${data.id}` : `/docs/${data.id}`,
  };
}
