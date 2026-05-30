"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { RoomPreparation } from "@/components/collaboration/room-preparation";
import { RoomStatus } from "@/components/collaboration/room-status";
import { CollaborativeEditor } from "@/components/editor/collaborative-editor";
import { useYRoom } from "@/hooks/use-y-room";
import type { DocumentRoomInfo } from "@/lib/types";

export function DocumentRoom({ room }: { room: DocumentRoomInfo }) {
  const { getToken } = useAuth();
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
  const { doc, provider, status, saveStatus, error, retry } = useYRoom(roomName, token);

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] bg-slate-50">
      <RoomStatus error={error} onRetry={retry} placement="top" saveStatus={saveStatus} status={status} />
      {token && doc && provider ? (
        <CollaborativeEditor doc={doc} provider={provider} readOnly={!room.canEdit} title={room.document.title} />
      ) : (
        <RoomPreparation error={tokenError} label="Preparing secure document..." onRetry={loadToken} />
      )}
    </section>
  );
}
