"use client";

import { Focus, LocateFixed, Maximize, Minus, Plus } from "lucide-react";

type ViewportControlsProps = {
  canZoomToSelection: boolean;
  zoom: number;
  onFitBoard: () => void;
  onCenterBoard: () => void;
  onReset: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToSelection: () => void;
};

export function ViewportControls({
  canZoomToSelection,
  zoom,
  onFitBoard,
  onCenterBoard,
  onReset,
  onZoomIn,
  onZoomOut,
  onZoomToSelection,
}: ViewportControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-md border bg-white/95 p-1 shadow-sm backdrop-blur">
      <ViewportButton icon={Minus} label="Zoom out" onClick={onZoomOut} />
      <button aria-label="Reset zoom" className="min-w-14 rounded-sm px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100" title="Reset zoom" type="button" onClick={onReset}>
        {Math.round(zoom * 100)}%
      </button>
      <ViewportButton icon={Plus} label="Zoom in" onClick={onZoomIn} />
      <div className="mx-1 h-5 w-px bg-slate-200" />
      <ViewportButton icon={Maximize} label="Fit board" onClick={onFitBoard} />
      <ViewportButton disabled={!canZoomToSelection} icon={Focus} label="Zoom to selection" onClick={onZoomToSelection} />
      <ViewportButton icon={LocateFixed} label="Center board" onClick={onCenterBoard} />
    </div>
  );
}

function ViewportButton({
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="grid size-8 place-items-center rounded-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
    >
      <Icon className="size-4" />
    </button>
  );
}
