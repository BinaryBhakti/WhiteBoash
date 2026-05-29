"use client";

import type { AwarenessState } from "@/hooks/use-awareness";

export function MultiplayerAvatars({ collaborators }: { collaborators: AwarenessState[] }) {
  return (
    <div className="absolute left-4 top-4 z-20 flex items-center -space-x-2">
      {collaborators.slice(0, 5).map((state, index) => (
        <div
          key={`${state.user?.id ?? "guest"}-${index}`}
          className="grid size-9 place-items-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm"
          style={{ backgroundColor: state.user?.color ?? "#0f766e" }}
          title={state.user?.name ?? "Collaborator"}
        >
          {(state.user?.name ?? "C").slice(0, 1).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
