"use client";

import { useEffect, useMemo, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import { createYRoom, destroyYRoom, type YRoom } from "@/lib/yjs-setup";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useYRoom(roomName: string, token?: string | null) {
  const stableRoomName = useMemo(() => roomName.trim(), [roomName]);
  const [room, setRoom] = useState<YRoom | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    if (!stableRoomName) {
      return;
    }

    setStatus("connecting");
    const nextRoom = createYRoom(stableRoomName, token);
    setRoom(nextRoom);

    const handleStatus = (event: { status: ConnectionStatus }) => {
      setStatus(event.status);
    };

    nextRoom.provider.on("status", handleStatus);

    return () => {
      nextRoom.provider.off("status", handleStatus);
      destroyYRoom(nextRoom);
      setRoom(null);
    };
  }, [stableRoomName, token]);

  return {
    doc: room?.doc ?? null,
    provider: room?.provider ?? null,
    awareness: (room?.provider.awareness ?? null) as Awareness | null,
    status,
  };
}
