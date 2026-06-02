"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock, Search, Unlock } from "lucide-react";
import type { CanvasShape } from "@/lib/types";
import type { LayerOrderCommand } from "@/components/canvas/shape-utils";
import { useCanvasStore } from "@/hooks/use-canvas-store";

type LayersPanelProps = {
  shapes: CanvasShape[];
  readOnly?: boolean;
  onRename: (shapeId: string, name: string) => void;
  onToggleHidden: (shapeId: string) => void;
  onToggleLocked: (shapeId: string) => void;
  onReorder: (command: LayerOrderCommand) => void;
};

export function LayersPanel({ shapes, readOnly = false, onRename, onToggleHidden, onToggleLocked, onReorder }: LayersPanelProps) {
  const [query, setQuery] = useState("");
  const isOpen = useCanvasStore((state) => state.isLayersOpen);
  const selectedShapeIds = useCanvasStore((state) => state.selectedShapeIds);
  const setSelectedShapeIds = useCanvasStore((state) => state.setSelectedShapeIds);
  const toggleSelectedShapeId = useCanvasStore((state) => state.toggleSelectedShapeId);
  const filteredShapes = useMemo(
    () =>
      shapes
        .slice()
        .reverse()
        .filter((shape) => getShapeLabel(shape).toLowerCase().includes(query.trim().toLowerCase())),
    [query, shapes],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="absolute right-4 top-28 z-20 w-80 rounded-md border bg-white/95 p-3 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Layers</h2>
        <span className="text-xs text-slate-500">{shapes.length}</span>
      </div>
      <label className="mb-3 flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 text-slate-500">
        <Search className="size-4" />
        <input
          aria-label="Search layers"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
          placeholder="Search layers"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {!readOnly && selectedShapeIds.length > 0 ? (
        <div className="mb-3 flex items-center gap-1 border-b pb-3">
          <LayerCommand icon={ArrowUp} label="Bring forward" onClick={() => onReorder("forward")} />
          <LayerCommand icon={ArrowDown} label="Send backward" onClick={() => onReorder("backward")} />
          <button className="ml-auto rounded-sm border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50" type="button" onClick={() => onReorder("front")}>
            Front
          </button>
          <button className="rounded-sm border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50" type="button" onClick={() => onReorder("back")}>
            Back
          </button>
        </div>
      ) : null}
      <div className="max-h-[420px] space-y-1 overflow-y-auto">
        {filteredShapes.length === 0 ? (
          <p className="px-1 py-2 text-sm text-slate-500">{shapes.length === 0 ? "No shapes yet." : "No matching layers."}</p>
        ) : (
          filteredShapes.map((shape) => {
            const selected = selectedShapeIds.includes(shape.id);
            return (
              <div
                key={shape.id}
                className={`flex items-center gap-1 rounded-md px-1 py-1 ${selected ? "bg-emerald-50 text-emerald-800" : "text-slate-700 hover:bg-slate-50"}`}
              >
                <button
                  aria-label={`Select ${getShapeLabel(shape)}`}
                  className="min-w-0 flex-1 px-1 py-1 text-left"
                  type="button"
                  onClick={(event) => {
                    if (event.shiftKey) {
                      toggleSelectedShapeId(shape.id);
                      return;
                    }

                    setSelectedShapeIds([shape.id]);
                  }}
                >
                  <span className="block truncate text-sm">{getShapeLabel(shape)}</span>
                  <span className="block font-mono text-[10px] text-slate-400">{shape.kind} {shape.id.slice(0, 6)}</span>
                </button>
                {!readOnly ? (
                  <>
                    <LayerIconButton icon={shape.hidden ? EyeOff : Eye} label={shape.hidden ? "Show layer" : "Hide layer"} onClick={() => onToggleHidden(shape.id)} />
                    <LayerIconButton icon={shape.locked ? Lock : Unlock} label={shape.locked ? "Unlock layer" : "Lock layer"} onClick={() => onToggleLocked(shape.id)} />
                  </>
                ) : null}
                <input
                  aria-label={`Rename ${getShapeLabel(shape)}`}
                  className="w-20 rounded-sm border bg-white px-1 py-0.5 text-xs text-slate-600 outline-none focus:border-emerald-500"
                  disabled={readOnly}
                  value={shape.name ?? ""}
                  placeholder="Name"
                  onChange={(event) => onRename(shape.id, event.target.value)}
                />
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

function getShapeLabel(shape: CanvasShape) {
  return shape.name?.trim() || shape.kind;
}

function LayerIconButton({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button aria-label={label} className="grid size-7 place-items-center rounded-sm text-slate-500 hover:bg-white hover:text-slate-800" title={label} type="button" onClick={onClick}>
      <Icon className="size-3.5" />
    </button>
  );
}

function LayerCommand({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button aria-label={label} className="grid size-7 place-items-center rounded-sm border text-slate-600 hover:bg-slate-50" title={label} type="button" onClick={onClick}>
      <Icon className="size-3.5" />
    </button>
  );
}
