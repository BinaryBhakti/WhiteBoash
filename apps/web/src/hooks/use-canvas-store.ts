"use client";

import { create } from "zustand";
import type { CanvasTool, Viewport } from "@/lib/types";

type CanvasState = {
  tool: CanvasTool;
  selectedShapeIds: string[];
  viewport: Viewport;
  isLayersOpen: boolean;
  setTool: (tool: CanvasTool) => void;
  setSelectedShapeIds: (ids: string[]) => void;
  toggleSelectedShapeId: (id: string) => void;
  clearSelection: () => void;
  setViewport: (viewport: Viewport) => void;
  patchViewport: (patch: Partial<Viewport>) => void;
  toggleLayers: () => void;
};

export const useCanvasStore = create<CanvasState>((set) => ({
  tool: "select",
  selectedShapeIds: [],
  viewport: { x: 0, y: 0, zoom: 1 },
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
  toggleLayers: () => set((state) => ({ isLayersOpen: !state.isLayersOpen })),
}));
