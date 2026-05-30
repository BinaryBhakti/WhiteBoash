"use client";

import { AlertCircle, CloudOff, RefreshCw, Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus, SaveStatus } from "@/hooks/use-y-room";

type RoomStatusProps = {
  status: ConnectionStatus;
  saveStatus: SaveStatus;
  error: string | null;
  onRetry: () => void;
  placement?: "top" | "bottom";
};

export function RoomStatus({ status, saveStatus, error, onRetry, placement = "bottom" }: RoomStatusProps) {
  const statusConfig = getStatusConfig(status);

  return (
    <div
      className={`absolute right-4 z-30 max-w-sm rounded-md border bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-sm ${
        placement === "top" ? "top-4" : "bottom-4"
      }`}
    >
      <div className="flex items-center gap-2">
        <statusConfig.icon className={`size-4 ${statusConfig.iconClassName}`} />
        <span className="font-medium text-slate-800">{statusConfig.label}</span>
        {status === "connected" ? <span className="text-slate-400">| {saveStatus}</span> : null}
        {status === "failed" ? (
          <button
            className="ml-1 inline-flex items-center gap-1 rounded-md border px-2 py-1 font-medium text-slate-700 hover:bg-slate-50"
            onClick={onRetry}
            type="button"
          >
            <RefreshCw className="size-3" />
            Retry
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 leading-5 text-rose-700">{error}</p> : null}
    </div>
  );
}

function getStatusConfig(status: ConnectionStatus) {
  if (status === "connected") {
    return { label: "Connected", icon: Wifi, iconClassName: "text-emerald-600" };
  }

  if (status === "offline") {
    return { label: "Offline", icon: CloudOff, iconClassName: "text-amber-600" };
  }

  if (status === "failed") {
    return { label: "Connection failed", icon: AlertCircle, iconClassName: "text-rose-600" };
  }

  if (status === "reconnecting") {
    return { label: "Reconnecting", icon: RefreshCw, iconClassName: "animate-spin text-amber-600" };
  }

  return { label: "Connecting", icon: WifiOff, iconClassName: "text-amber-600" };
}
