"use client";

import { Circle, MousePointer2, Move, PenLine, Square, Type, ArrowUpRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasTool } from "@/lib/types";
import { useCanvasStore } from "@/hooks/use-canvas-store";

const tools: Array<{ id: CanvasTool; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "pan", label: "Pan", icon: Move },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight },
  { id: "freehand", label: "Freehand", icon: PenLine },
  { id: "text", label: "Text", icon: Type },
];

export function CanvasToolbar({ readOnly = false }: { readOnly?: boolean }) {
  const tool = useCanvasStore((state) => state.tool);
  const setTool = useCanvasStore((state) => state.setTool);
  const toggleLayers = useCanvasStore((state) => state.toggleLayers);

  return (
    <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-md border bg-white/95 p-1 shadow-sm backdrop-blur">
      {tools.filter((item) => !readOnly || item.id === "select" || item.id === "pan").map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            aria-label={item.label}
            title={item.label}
            className={cn(
              "grid size-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100",
              tool === item.id && "bg-emerald-50 text-emerald-700",
            )}
            type="button"
            onClick={() => setTool(item.id)}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
      <div className="mx-1 h-6 w-px bg-slate-200" />
      <button
        aria-label="Layers"
        title="Layers"
        className="grid size-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100"
        type="button"
        onClick={toggleLayers}
      >
        <Layers className="size-4" />
      </button>
    </div>
  );
}
