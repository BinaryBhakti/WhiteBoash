import { Server } from "@hocuspocus/server";
import { env } from "./env.js";
import { verifyClerkToken } from "./auth.js";
import { parseRoomName } from "./rooms.js";
import {
  authorizeRoomAccess,
  createSnapshot,
  loadYDocument,
  storeYDocument,
  type RoomAccess,
} from "./storage.js";

type Context = RoomAccess & {
  userId: string;
  changesSinceSnapshot: number;
};

const server = new Server<Context>({
  port: env.COLLAB_PORT,

  async onAuthenticate(data) {
    const { userId } = await verifyClerkToken(data.token);
    const room = parseRoomName(data.documentName);
    const access = await authorizeRoomAccess({ userId, ...room });
    data.connectionConfig.readOnly = !access.canEdit;

    return {
      ...access,
      userId,
      changesSinceSnapshot: 0,
    } satisfies Context;
  },

  async onLoadDocument(data) {
    const context = data.context as Context;
    return loadYDocument(context.documentId);
  },

  async onChange(data) {
    const context = data.context as Context;
    context.changesSinceSnapshot += 1;
  },

  async beforeSync(data) {
    const context = data.context as Context;

    if (!context.canEdit && data.type === 2) {
      throw new Error("Read-only users cannot update documents.");
    }
  },

  async onStoreDocument(data) {
    const context = data.lastContext as Context;
    await storeYDocument(context.documentId, data.document);

    if (context.changesSinceSnapshot >= 50) {
      await createSnapshot(context.documentId, data.document, context.userId);
      context.changesSinceSnapshot = 0;
    }
  },
});

await server.listen();

console.log(`Collaboration server listening on ws://localhost:${env.COLLAB_PORT}`);
