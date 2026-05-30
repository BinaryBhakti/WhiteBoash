"use client";

import { RefreshCw } from "lucide-react";

type RoomPreparationProps = {
  error?: string | null;
  onRetry?: () => void;
  label: string;
};

export function RoomPreparation({ error, onRetry, label }: RoomPreparationProps) {
  return (
    <div className="grid h-full min-h-[calc(100vh-3.5rem)] place-items-center px-6 text-center">
      <div>
        <p className="text-sm text-slate-500">{error ?? label}</p>
        {error && onRetry ? (
          <button
            className="mx-auto mt-4 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw className="size-4" />
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
