"use client";

import { create } from "zustand";
import type { CanvasTool, Viewport } from "@/lib/types";

type CanvasState = {
  tool: CanvasTool;
  selectedShapeId: string | null;
  viewport: Viewport;
  isLayersOpen: boolean;
  setTool: (tool: CanvasTool) => void;
  setSelectedShapeId: (id: string | null) => void;
  setViewport: (viewport: Viewport) => void;
  patchViewport: (patch: Partial<Viewport>) => void;
  toggleLayers: () => void;
};

export const useCanvasStore = create<CanvasState>((set) => ({
  tool: "select",
  selectedShapeId: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  isLayersOpen: true,
  setTool: (tool) => set({ tool }),
  setSelectedShapeId: (selectedShapeId) => set({ selectedShapeId }),
  setViewport: (viewport) => set({ viewport }),
  patchViewport: (patch) =>
    set((state) => ({
      viewport: { ...state.viewport, ...patch },
    })),
  toggleLayers: () => set((state) => ({ isLayersOpen: !state.isLayersOpen })),
}));
