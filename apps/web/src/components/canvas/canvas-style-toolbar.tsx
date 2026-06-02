"use client";

import type { CanvasStyle } from "@/lib/types";

const strokeColors = ["#0f172a", "#0f766e", "#2563eb", "#dc2626", "#7c3aed"];
const fillColors = ["#ccfbf1", "#dbeafe", "#fef08a", "#fecdd3", "#e9d5ff", "#ffffff"];
const strokeWidths = [1, 2, 4, 6];

type CanvasStyleToolbarProps = {
  style: CanvasStyle;
  hasSelection: boolean;
  readOnly?: boolean;
  onChange: (patch: Partial<CanvasStyle>) => void;
};

export function CanvasStyleToolbar({ style, hasSelection, readOnly = false, onChange }: CanvasStyleToolbarProps) {
  if (readOnly) {
    return null;
  }

  return (
    <div className="absolute left-1/2 top-16 z-20 flex -translate-x-1/2 items-center gap-3 rounded-md border bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
      <span className="text-xs font-medium text-slate-500">{hasSelection ? "Selection" : "New shapes"}</span>
      <Swatches label="Stroke color" colors={strokeColors} value={style.stroke} onChange={(stroke) => onChange({ stroke })} />
      <div className="h-5 w-px bg-slate-200" />
      <Swatches label="Fill color" colors={fillColors} value={style.fill} onChange={(fill) => onChange({ fill })} />
      <div className="h-5 w-px bg-slate-200" />
      <label className="flex items-center gap-2 text-xs text-slate-500">
        <span>Stroke</span>
        <select
          aria-label="Stroke width"
          className="rounded-sm border bg-white px-1 py-0.5 text-xs text-slate-700"
          value={style.strokeWidth}
          onChange={(event) => onChange({ strokeWidth: Number(event.target.value) })}
        >
          {strokeWidths.map((width) => (
            <option key={width} value={width}>{width}px</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-slate-500">
        <span>Opacity</span>
        <input
          aria-label="Opacity"
          className="w-20 accent-emerald-700"
          max="1"
          min="0.2"
          step="0.1"
          type="range"
          value={style.opacity}
          onChange={(event) => onChange({ opacity: Number(event.target.value) })}
        />
      </label>
    </div>
  );
}

function Swatches({
  colors,
  label,
  value,
  onChange,
}: {
  colors: string[];
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div aria-label={label} className="flex items-center gap-1" role="group">
      {colors.map((color) => (
        <button
          key={color}
          aria-label={`${label} ${color}`}
          className={`size-5 rounded-sm border ${value === color ? "ring-2 ring-emerald-600 ring-offset-1" : ""}`}
          style={{ backgroundColor: color }}
          title={`${label}: ${color}`}
          type="button"
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
