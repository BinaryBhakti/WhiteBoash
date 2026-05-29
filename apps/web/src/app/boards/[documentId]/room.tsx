"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Wifi, WifiOff } from "lucide-react";
import { WhiteboardCanvas } from "@/components/canvas/whiteboard-canvas";
import { MultiplayerAvatars } from "@/components/canvas/multiplayer-avatars";
import { useAwareness } from "@/hooks/use-awareness";
import { useYRoom } from "@/hooks/use-y-room";
import type { AwarenessUser, DocumentRoomInfo } from "@/lib/types";

export function BoardRoom({ room }: { room: DocumentRoomInfo }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    void getToken().then(setToken);
  }, [getToken]);

  const roomName = token ? `workspace:${room.workspaceId}:document:${room.document.id}` : "";
  const { doc, awareness, status } = useYRoom(roomName, token);
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
      <div className="absolute right-4 bottom-4 z-30 inline-flex items-center gap-2 rounded-md border bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-sm">
        {status === "connected" ? <Wifi className="size-4 text-emerald-600" /> : <WifiOff className="size-4 text-amber-600" />}
        {status}
      </div>
      {token && doc ? (
        <WhiteboardCanvas
          documentId={room.document.id}
          doc={doc}
          readOnly={!room.canEdit}
          onCursorChange={setCursor}
        />
      ) : (
        <div className="grid h-full place-items-center text-sm text-slate-500">Preparing secure room...</div>
      )}
    </section>
  );
}

function colorFromId(id: string) {
  const colors = ["#0f766e", "#2563eb", "#7c3aed", "#be123c", "#b45309"];
  const index = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}
