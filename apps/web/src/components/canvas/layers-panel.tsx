"use client";

import type { CanvasShape } from "@/lib/types";
import { useCanvasStore } from "@/hooks/use-canvas-store";

export function LayersPanel({ shapes }: { shapes: CanvasShape[] }) {
  const isOpen = useCanvasStore((state) => state.isLayersOpen);
  const selectedShapeId = useCanvasStore((state) => state.selectedShapeId);
  const setSelectedShapeId = useCanvasStore((state) => state.setSelectedShapeId);

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="absolute right-4 top-20 z-20 w-72 rounded-md border bg-white/95 p-3 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Layers</h2>
        <span className="text-xs text-slate-500">{shapes.length}</span>
      </div>
      <div className="space-y-1">
        {shapes.length === 0 ? (
          <p className="text-sm text-slate-500">No shapes yet.</p>
        ) : (
          shapes
            .slice()
            .reverse()
            .map((shape) => (
              <button
                key={shape.id}
                className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm ${
                  selectedShapeId === shape.id ? "bg-emerald-50 text-emerald-800" : "text-slate-700 hover:bg-slate-50"
                }`}
                type="button"
                onClick={() => setSelectedShapeId(shape.id)}
              >
                <span className="capitalize">{shape.kind}</span>
                <span className="font-mono text-xs text-slate-400">{shape.id.slice(0, 6)}</span>
              </button>
            ))
        )}
      </div>
    </aside>
  );
}
