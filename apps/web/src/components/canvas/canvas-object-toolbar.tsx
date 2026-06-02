"use client";

import { ArrowDownToLine, ArrowUpToLine, Copy, EyeOff, Lock, Trash2, Unlock } from "lucide-react";
import type { LayerOrderCommand } from "@/components/canvas/shape-utils";

type CanvasObjectToolbarProps = {
  hasLockedShape: boolean;
  readOnly?: boolean;
  selectedCount: number;
  onDelete: () => void;
  onDuplicate: () => void;
  onReorder: (command: LayerOrderCommand) => void;
  onToggleHidden: () => void;
  onToggleLocked: () => void;
};

export function CanvasObjectToolbar({
  hasLockedShape,
  readOnly = false,
  selectedCount,
  onDelete,
  onDuplicate,
  onReorder,
  onToggleHidden,
  onToggleLocked,
}: CanvasObjectToolbarProps) {
  if (readOnly || selectedCount === 0) {
    return null;
  }

  return (
    <div className="absolute left-1/2 top-28 z-20 flex -translate-x-1/2 items-center gap-1 rounded-md border bg-white/95 p-1 shadow-sm backdrop-blur">
      <ObjectButton icon={Copy} label="Duplicate selection" onClick={onDuplicate} />
      <ObjectButton icon={ArrowUpToLine} label="Bring to front" onClick={() => onReorder("front")} />
      <ObjectButton icon={ArrowDownToLine} label="Send to back" onClick={() => onReorder("back")} />
      <ObjectButton icon={hasLockedShape ? Unlock : Lock} label={hasLockedShape ? "Unlock selection" : "Lock selection"} onClick={onToggleLocked} />
      <ObjectButton icon={EyeOff} label="Hide selection" onClick={onToggleHidden} />
      <ObjectButton danger icon={Trash2} label="Delete selection" onClick={onDelete} />
    </div>
  );
}

function ObjectButton({
  danger = false,
  icon: Icon,
  label,
  onClick,
}: {
  danger?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={`grid size-8 place-items-center rounded-sm transition ${danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-600 hover:bg-slate-100"}`}
      title={label}
      type="button"
      onClick={onClick}
    >
      <Icon className="size-4" />
    </button>
  );
}
