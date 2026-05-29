"use client";

import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

export type YRoom = {
  doc: Y.Doc;
  provider: HocuspocusProvider;
  roomName: string;
};

export function createYRoom(roomName: string, token?: string | null): YRoom {
  const endpoint = process.env.NEXT_PUBLIC_YJS_WS_URL ?? "ws://localhost:1234";
  const doc = new Y.Doc();
  const provider = new HocuspocusProvider({
    url: endpoint,
    name: roomName,
    document: doc,
    token: token ?? undefined,
  });

  return {
    doc,
    provider,
    roomName,
  };
}

export function destroyYRoom(room: YRoom) {
  room.provider.destroy();
  room.doc.destroy();
}

export function getCanvasShapes(doc: Y.Doc) {
  return doc.getMap("canvas:shapes");
}

export function getEditorBlocks(doc: Y.Doc) {
  return doc.getArray("editor:blocks");
}
