"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertWorkspaceRole, getCurrentUser, redirectToDocument } from "@/lib/data";
import { createDocument } from "@/lib/documents";
import {
  archiveDocumentSchema,
  createDocumentSchema,
  renameDocumentSchema,
} from "@/lib/validation";

export async function createDocumentAction(formData: FormData) {
  const parsed = createDocumentSchema.parse({
    workspaceId: formData.get("workspaceId"),
    type: formData.get("type"),
    title: formData.get("title"),
  });

  const document = await createDocument(parsed);

  revalidatePath("/dashboard");
  await redirectToDocument(document.id, document.type);
}

export async function renameDocumentAction(formData: FormData) {
  const parsed = renameDocumentSchema.parse({
    documentId: formData.get("documentId"),
    title: formData.get("title"),
  });

  const user = await getCurrentUser();
  const document = await getEditableDocument(parsed.documentId);
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("documents")
    .update({
      title: parsed.title,
      updated_by: user.id,
    })
    .eq("id", parsed.documentId);

  if (error) {
    throw new Error(`Failed to rename document: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(document.type === "canvas" ? `/boards/${parsed.documentId}` : `/docs/${parsed.documentId}`);
}

export async function archiveDocumentAction(formData: FormData) {
  const parsed = archiveDocumentSchema.parse({
    documentId: formData.get("documentId"),
  });

  const user = await getCurrentUser();
  const document = await getEditableDocument(parsed.documentId);
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("documents")
    .update({
      archived_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", parsed.documentId);

  if (error) {
    throw new Error(`Failed to archive document: ${error.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath(document.type === "canvas" ? `/boards/${parsed.documentId}` : `/docs/${parsed.documentId}`);
}

export async function duplicateDocumentAction(formData: FormData) {
  const parsed = archiveDocumentSchema.parse({
    documentId: formData.get("documentId"),
  });

  const user = await getCurrentUser();
  const source = await getEditableDocument(parsed.documentId);
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("documents")
    .insert({
      workspace_id: source.workspace_id,
      type: source.type,
      title: `${source.title} copy`,
      summary: source.summary,
      preview: source.preview ?? {},
      yjs_state: source.yjs_state,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id, type")
    .single();

  if (error) {
    throw new Error(`Failed to duplicate document: ${error.message}`);
  }

  revalidatePath("/dashboard");
  await redirectToDocument(data.id, data.type);
}

async function getEditableDocument(documentId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, workspace_id, type, title, summary, preview, yjs_state")
    .eq("id", documentId)
    .is("archived_at", null)
    .single();

  if (error || !data) {
    throw new Error("Document not found.");
  }

  await assertWorkspaceRole(data.workspace_id, ["owner", "admin", "editor"]);
  return data;
}
