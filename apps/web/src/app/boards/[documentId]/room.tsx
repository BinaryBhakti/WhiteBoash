"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { WhiteboardCanvas } from "@/components/canvas/whiteboard-canvas";
import { MultiplayerAvatars } from "@/components/canvas/multiplayer-avatars";
import { RoomPreparation } from "@/components/collaboration/room-preparation";
import { RoomStatus } from "@/components/collaboration/room-status";
import { useAwareness } from "@/hooks/use-awareness";
import { useYRoom } from "@/hooks/use-y-room";
import type { AwarenessUser, DocumentRoomInfo } from "@/lib/types";

export function BoardRoom({ room }: { room: DocumentRoomInfo }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const loadToken = useCallback(() => {
    setTokenError(null);
    void getToken()
      .then((nextToken) => {
        if (!nextToken) {
          throw new Error("Missing collaboration token.");
        }
        setToken(nextToken);
      })
      .catch(() => setTokenError("Your secure collaboration session could not be prepared. Sign in again or retry."));
  }, [getToken]);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  const roomName = token ? `workspace:${room.workspaceId}:document:${room.document.id}` : "";
  const { doc, awareness, status, saveStatus, error, retry } = useYRoom(roomName, token);
  const awarenessUser = useMemo<AwarenessUser | null>(() => {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.fullName ?? user.username ?? "Collaborator",
      avatarUrl: user.imageUrl,
      color: colorFromId(user.id),
    };
  }, [user]);

  const { collaborators, setCursor } = useAwareness(awareness, awarenessUser);

  return (
    <section className="relative h-[calc(100vh-3.5rem)]">
      <MultiplayerAvatars collaborators={collaborators} />
      <RoomStatus error={error} onRetry={retry} saveStatus={saveStatus} status={status} />
      {token && doc ? (
        <WhiteboardCanvas
          documentId={room.document.id}
          doc={doc}
          readOnly={!room.canEdit}
          onCursorChange={setCursor}
        />
      ) : (
        <RoomPreparation error={tokenError} label="Preparing secure room..." onRetry={loadToken} />
      )}
    </section>
  );
}

function colorFromId(id: string) {
  const colors = ["#0f766e", "#2563eb", "#7c3aed", "#be123c", "#b45309"];
  const index = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}
