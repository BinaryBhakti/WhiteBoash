import { Server } from "@hocuspocus/server";
import { env } from "./env.js";
import { errorDetails, log } from "./logger.js";
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

  async onRequest({ request, response }) {
    if (request.url !== "/health") {
      return;
    }

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      ok: true,
      service: "collab",
      timestamp: new Date().toISOString(),
    }));

    throw null;
  },

  async onAuthenticate(data) {
    try {
      const { userId } = await verifyClerkToken(data.token);
      const room = parseRoomName(data.documentName);
      const access = await authorizeRoomAccess({ userId, ...room });
      data.connectionConfig.readOnly = !access.canEdit;

      return {
        ...access,
        userId,
        changesSinceSnapshot: 0,
      } satisfies Context;
    } catch (error) {
      log("warn", "room.authentication_rejected", {
        roomName: data.documentName,
        ...errorDetails(error),
      });
      throw error;
    }
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

log("info", "server.started", {
  port: env.COLLAB_PORT,
  environment: env.NODE_ENV,
});

let isShuttingDown = false;

async function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  log("info", "server.shutdown_started", { signal });

  try {
    await server.destroy();
    log("info", "server.shutdown_completed", { signal });
    process.exit(0);
  } catch (error) {
    log("error", "server.shutdown_failed", {
      signal,
      ...errorDetails(error),
    });
    process.exit(1);
  }
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
