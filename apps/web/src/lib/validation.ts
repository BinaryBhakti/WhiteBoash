import { z } from "zod";

export const documentTypeSchema = z.enum(["canvas", "text"]);

export const createDocumentSchema = z.object({
  workspaceId: z.string().uuid(),
  type: documentTypeSchema,
  title: z.string().trim().min(1).max(180),
});

export const renameDocumentSchema = z.object({
  documentId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
});

export const archiveDocumentSchema = z.object({
  documentId: z.string().uuid(),
});
