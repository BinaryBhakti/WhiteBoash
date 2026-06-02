"use client";

import { create } from "zustand";
import type { CanvasStyle, CanvasTool, Viewport } from "@/lib/types";

type CanvasState = {
  tool: CanvasTool;
  selectedShapeIds: string[];
  viewport: Viewport;
  styleDefaults: CanvasStyle;
  isLayersOpen: boolean;
  setTool: (tool: CanvasTool) => void;
  setSelectedShapeIds: (ids: string[]) => void;
  toggleSelectedShapeId: (id: string) => void;
  clearSelection: () => void;
  setViewport: (viewport: Viewport) => void;
  patchViewport: (patch: Partial<Viewport>) => void;
  patchStyleDefaults: (patch: Partial<CanvasStyle>) => void;
  toggleLayers: () => void;
};

export const useCanvasStore = create<CanvasState>((set) => ({
  tool: "select",
  selectedShapeIds: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  styleDefaults: {
    stroke: "#0f172a",
    fill: "#ccfbf1",
    strokeWidth: 2,
    opacity: 1,
  },
  isLayersOpen: true,
  setTool: (tool) => set({ tool }),
  setSelectedShapeIds: (selectedShapeIds) => set({ selectedShapeIds: Array.from(new Set(selectedShapeIds)) }),
  toggleSelectedShapeId: (id) =>
    set((state) => ({
      selectedShapeIds: state.selectedShapeIds.includes(id)
        ? state.selectedShapeIds.filter((selectedId) => selectedId !== id)
        : [...state.selectedShapeIds, id],
    })),
  clearSelection: () => set({ selectedShapeIds: [] }),
  setViewport: (viewport) => set({ viewport }),
  patchViewport: (patch) =>
    set((state) => ({
      viewport: { ...state.viewport, ...patch },
    })),
  patchStyleDefaults: (patch) =>
    set((state) => ({
      styleDefaults: { ...state.styleDefaults, ...patch },
    })),
  toggleLayers: () => set((state) => ({ isLayersOpen: !state.isLayersOpen })),
}));
