import * as Y from "yjs";
import { errorDetails, log } from "./logger.js";
import { supabase } from "./supabase.js";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export type RoomAccess = {
  documentId: string;
  workspaceId: string;
  role: WorkspaceRole;
  canEdit: boolean;
};

export async function authorizeRoomAccess({
  userId,
  workspaceId,
  documentId,
}: {
  userId: string;
  workspaceId: string;
  documentId: string;
}): Promise<RoomAccess> {
  const { data: document, error: documentError } = await supabase
    .from("documents")
    .select("id, workspace_id, archived_at")
    .eq("id", documentId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (documentError || !document || document.archived_at) {
    throw new Error("Document not found.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError || !membership?.role) {
    throw new Error("Workspace access denied.");
  }

  const role = membership.role as WorkspaceRole;

  return {
    documentId,
    workspaceId,
    role,
    canEdit: role === "owner" || role === "admin" || role === "editor",
  };
}

export async function loadYDocument(documentId: string) {
  const ydoc = new Y.Doc();
  const { data, error } = await supabase
    .from("documents")
    .select("yjs_state")
    .eq("id", documentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Yjs state: ${error.message}`);
  }

  const update = decodeBytea(data?.yjs_state);
  if (update) {
    Y.applyUpdate(ydoc, update);
  }

  return ydoc;
}

export async function storeYDocument(documentId: string, ydoc: Y.Doc) {
  const update = encodeBytea(Y.encodeStateAsUpdate(ydoc));

  const { error } = await supabase
    .from("documents")
    .update({
      yjs_state: update,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  if (error) {
    log("error", "document.persistence_failed", {
      documentId,
      ...errorDetails(error),
    });
    throw new Error(`Failed to store Yjs state: ${error.message}`);
  }
}

export async function createSnapshot(documentId: string, ydoc: Y.Doc, userId?: string) {
  const { count, error: countError } = await supabase
    .from("document_snapshots")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId);

  if (countError) {
    log("error", "snapshot.count_failed", {
      documentId,
      ...errorDetails(countError),
    });
    throw new Error(`Failed to count snapshots: ${countError.message}`);
  }

  const { error } = await supabase.from("document_snapshots").insert({
    document_id: documentId,
    version: (count ?? 0) + 1,
      yjs_state: encodeBytea(Y.encodeStateAsUpdate(ydoc)),
    created_by: userId ?? null,
  });

  if (error) {
    log("error", "snapshot.creation_failed", {
      documentId,
      ...errorDetails(error),
    });
    throw new Error(`Failed to create snapshot: ${error.message}`);
  }

  log("info", "snapshot.created", {
    documentId,
    version: (count ?? 0) + 1,
  });
}

function decodeBytea(value: unknown): Uint8Array | null {
  if (!value) {
    return null;
  }

  if (value instanceof Uint8Array) {
    return value;
  }

  if (typeof value === "string") {
    const hex = value.startsWith("\\x") ? value.slice(2) : value;
    return Buffer.from(hex, "hex");
  }

  if (Array.isArray(value)) {
    return Uint8Array.from(value as number[]);
  }

  return null;
}

function encodeBytea(update: Uint8Array) {
  return `\\x${Buffer.from(update).toString("hex")}`;
}
