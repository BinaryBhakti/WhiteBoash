"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Wifi, WifiOff } from "lucide-react";
import { CollaborativeEditor } from "@/components/editor/collaborative-editor";
import { useYRoom } from "@/hooks/use-y-room";
import type { DocumentRoomInfo } from "@/lib/types";

export function DocumentRoom({ room }: { room: DocumentRoomInfo }) {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    void getToken().then(setToken);
  }, [getToken]);

  const roomName = token ? `workspace:${room.workspaceId}:document:${room.document.id}` : "";
  const { doc, provider, status } = useYRoom(roomName, token);

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] bg-slate-50">
      <div className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-md border bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-sm">
        {status === "connected" ? <Wifi className="size-4 text-emerald-600" /> : <WifiOff className="size-4 text-amber-600" />}
        {status}
      </div>
      {token && doc && provider ? (
        <CollaborativeEditor doc={doc} provider={provider} readOnly={!room.canEdit} title={room.document.title} />
      ) : (
        <div className="grid min-h-screen place-items-center text-sm text-slate-500">Preparing secure document...</div>
      )}
    </section>
  );
}
