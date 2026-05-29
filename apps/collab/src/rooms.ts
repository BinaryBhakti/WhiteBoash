import { z } from "zod";

export const roomNameSchema = z
  .string()
  .regex(/^workspace:[0-9a-f-]{36}:document:[0-9a-f-]{36}$/i);

export function parseRoomName(roomName: string) {
  roomNameSchema.parse(roomName);
  const [, workspaceId, , documentId] = roomName.split(":");

  return {
    workspaceId,
    documentId,
  };
}
