"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import { createYRoom, destroyYRoom, type YRoom } from "@/lib/yjs-setup";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "offline" | "failed";
export type SaveStatus = "saved" | "saving" | "offline";

export function useYRoom(roomName: string, token?: string | null) {
  const stableRoomName = useMemo(() => roomName.trim(), [roomName]);
  const [room, setRoom] = useState<YRoom | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!stableRoomName) {
      return;
    }

    setStatus("connecting");
    setError(null);

    let nextRoom: YRoom;
    try {
      nextRoom = createYRoom(stableRoomName, token);
    } catch (roomError) {
      setStatus("failed");
      setError(roomError instanceof Error ? roomError.message : "The collaboration room could not be created.");
      return;
    }

    setRoom(nextRoom);
    let hasConnected = false;
    const connectionTimeout = window.setTimeout(() => {
      if (!hasConnected) {
        setStatus("failed");
        setError("The collaboration server could not be reached. Check the WebSocket URL and retry.");
      }
    }, 12_000);

    const handleStatus = (event: { status: "connecting" | "connected" | "disconnected" }) => {
      if (event.status === "connected") {
        hasConnected = true;
        window.clearTimeout(connectionTimeout);
        setStatus("connected");
        setError(null);
        return;
      }

      if (event.status === "connecting") {
        setStatus(hasConnected ? "reconnecting" : "connecting");
        return;
      }

      setStatus(window.navigator.onLine ? "reconnecting" : "offline");
    };

    const handleAuthenticationFailed = (event: { reason?: string }) => {
      window.clearTimeout(connectionTimeout);
      setStatus("failed");
      setError(classifyRoomError(event.reason));
    };

    const handleUnsyncedChanges = (event: { number: number }) => {
      setSaveStatus(event.number > 0 ? "saving" : "saved");
    };

    const handleOffline = () => {
      setStatus("offline");
      setSaveStatus("offline");
    };

    const handleOnline = () => {
      setStatus(hasConnected ? "reconnecting" : "connecting");
      setSaveStatus(nextRoom.provider.hasUnsyncedChanges ? "saving" : "saved");
    };

    nextRoom.provider.on("status", handleStatus);
    nextRoom.provider.on("authenticationFailed", handleAuthenticationFailed);
    nextRoom.provider.on("unsyncedChanges", handleUnsyncedChanges);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      nextRoom.provider.off("status", handleStatus);
      nextRoom.provider.off("authenticationFailed", handleAuthenticationFailed);
      nextRoom.provider.off("unsyncedChanges", handleUnsyncedChanges);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.clearTimeout(connectionTimeout);
      destroyYRoom(nextRoom);
      setRoom(null);
    };
  }, [attempt, stableRoomName, token]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return {
    doc: room?.doc ?? null,
    provider: room?.provider ?? null,
    awareness: (room?.provider.awareness ?? null) as Awareness | null,
    status,
    saveStatus,
    error,
    retry,
  };
}

function classifyRoomError(reason?: string) {
  const normalized = reason?.toLowerCase() ?? "";

  if (normalized.includes("workspace access denied") || normalized.includes("document not found")) {
    return "You do not have access to this collaboration room.";
  }

  if (normalized.includes("token") || normalized.includes("auth")) {
    return "Your collaboration session could not be authenticated. Sign in again and retry.";
  }

  return "The collaboration server rejected the room connection.";
}
