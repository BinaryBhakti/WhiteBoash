"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import type { AwarenessCursor, CanvasShape, CanvasTool, Point, Viewport } from "@/lib/types";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import { useCRDTMap } from "@/hooks/use-crdt-map";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";
import { drawCanvasScene, screenToWorld } from "@/components/canvas/canvas-renderer";
import { LayersPanel } from "@/components/canvas/layers-panel";
import { duplicateShape, findShapeAtPoint, moveShape } from "@/components/canvas/shape-utils";

type WhiteboardCanvasProps = {
  documentId: string;
  doc: Y.Doc;
  readOnly?: boolean;
  onCursorChange?: (cursor: AwarenessCursor | null) => void;
};

type PointerSession = {
  pointerId: number;
  startedAt: Point;
  lastScreen: Point;
  shapeId?: string;
  originalShape?: CanvasShape;
};

export function WhiteboardCanvas({ documentId, doc, readOnly = false, onCursorChange }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draftShapeRef = useRef<CanvasShape | null>(null);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const viewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  const tool = useCanvasStore((state) => state.tool);
  const viewport = useCanvasStore((state) => state.viewport);
  const setViewport = useCanvasStore((state) => state.setViewport);
  const setSelectedShapeId = useCanvasStore((state) => state.setSelectedShapeId);
  const selectedShapeId = useCanvasStore((state) => state.selectedShapeId);
  const { map: shapeMap, values: shapes } = useCRDTMap<CanvasShape>(doc, "canvas:shapes");
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

  viewportRef.current = viewport;

  const sortedShapes = useMemo(
    () => shapes.slice().sort((left, right) => left.updatedAt - right.updatedAt),
    [shapes],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    drawCanvasScene(context, sortedShapes, viewportRef.current, draftShapeRef.current, selectedShapeId);
  }, [selectedShapeId, sortedShapes]);

  useEffect(() => {
    const shapesMap = doc.getMap<CanvasShape>("canvas:shapes");
    const manager = new Y.UndoManager(shapesMap);
    undoManagerRef.current = manager;

    return () => {
      manager.destroy();
      undoManagerRef.current = null;
    };
  }, [doc]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (readOnly || !shapeMap) {
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        undoManagerRef.current?.redo();
      } else if (isMod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        undoManagerRef.current?.undo();
      } else if (isMod && event.key.toLowerCase() === "d" && selectedShapeId) {
        event.preventDefault();
        const selected = shapeMap.get(selectedShapeId);
        if (selected) {
          const duplicate = duplicateShape(selected);
          shapeMap.set(duplicate.id, duplicate);
          setSelectedShapeId(duplicate.id);
        }
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedShapeId) {
        event.preventDefault();
        shapeMap.delete(selectedShapeId);
        setSelectedShapeId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [readOnly, selectedShapeId, setSelectedShapeId, shapeMap]);

  const requestRender = useCallback(() => {
    if (animationFrameRef.current !== null) {
      return;
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      render();
    });
  }, [render]);

  useEffect(() => {
    requestRender();
  }, [requestRender, sortedShapes, viewport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width);
      canvas.height = Math.floor(rect.height);
      setCanvasSize({ width: rect.width, height: rect.height });
      requestRender();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [requestRender]);

  const createDraftShape = useCallback((shapeTool: CanvasTool, start: Point): CanvasShape | null => {
    const base = {
      id: crypto.randomUUID(),
      x: start.x,
      y: start.y,
      stroke: "#0f172a",
      fill: "rgba(20, 184, 166, 0.12)",
      strokeWidth: 2,
      updatedAt: Date.now(),
    };

    if (shapeTool === "rectangle") {
      return { ...base, kind: "rectangle", width: 1, height: 1 };
    }

    if (shapeTool === "circle") {
      return { ...base, kind: "circle", radius: 1 };
    }

    if (shapeTool === "arrow") {
      return { ...base, kind: "arrow", end: start };
    }

    if (shapeTool === "freehand") {
      return { ...base, kind: "freehand", fill: undefined, points: [start] };
    }

    if (shapeTool === "text") {
      return { ...base, kind: "text", fill: "#0f172a", text: "Note", width: 180 };
    }

    return null;
  }, []);

  const updateDraftShape = useCallback((draft: CanvasShape, start: Point, current: Point): CanvasShape => {
    if (draft.kind === "rectangle") {
      return { ...draft, x: Math.min(start.x, current.x), y: Math.min(start.y, current.y), width: Math.abs(current.x - start.x), height: Math.abs(current.y - start.y), updatedAt: Date.now() };
    }

    if (draft.kind === "circle") {
      return { ...draft, radius: Math.hypot(current.x - start.x, current.y - start.y), updatedAt: Date.now() };
    }

    if (draft.kind === "arrow") {
      return { ...draft, end: current, updatedAt: Date.now() };
    }

    if (draft.kind === "freehand") {
      return { ...draft, points: [...draft.points, current], updatedAt: Date.now() };
    }

    return draft;
  }, []);

  const getScreenPoint = (event: { currentTarget: HTMLCanvasElement; clientX: number; clientY: number }): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const screenPoint = getScreenPoint(event);
    const worldPoint = screenToWorld(screenPoint, viewportRef.current);

    pointerSessionRef.current = {
      pointerId: event.pointerId,
      startedAt: worldPoint,
      lastScreen: screenPoint,
    };

    if (readOnly) {
      return;
    }

    if (tool === "select") {
      const selected = findShapeAtPoint(sortedShapes, worldPoint);
      setSelectedShapeId(selected?.id ?? null);
      pointerSessionRef.current = {
        pointerId: event.pointerId,
        startedAt: worldPoint,
        lastScreen: screenPoint,
        shapeId: selected?.id,
        originalShape: selected,
      };
      return;
    }

    if (tool === "pan") {
      return;
    }

    const draft = createDraftShape(tool, worldPoint);
    draftShapeRef.current = draft;

    if (draft?.kind === "text" && shapeMap) {
      shapeMap.set(draft.id, draft);
      draftShapeRef.current = null;
    }

    requestRender();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const screenPoint = getScreenPoint(event);
    const worldPoint = screenToWorld(screenPoint, viewportRef.current);
    onCursorChange?.({ ...worldPoint, documentId });

    const session = pointerSessionRef.current;
    if (!session) {
      return;
    }

    if (readOnly || tool === "pan") {
      const dx = screenPoint.x - session.lastScreen.x;
      const dy = screenPoint.y - session.lastScreen.y;
      const nextViewport = {
        ...viewportRef.current,
        x: viewportRef.current.x + dx,
        y: viewportRef.current.y + dy,
      };
      pointerSessionRef.current = { ...session, lastScreen: screenPoint };
      viewportRef.current = nextViewport;
      setViewport(nextViewport);
      requestRender();
      return;
    }

    if (!readOnly && tool === "select" && session.shapeId && session.originalShape && shapeMap) {
      const delta = {
        x: worldPoint.x - session.startedAt.x,
        y: worldPoint.y - session.startedAt.y,
      };
      shapeMap.set(session.shapeId, moveShape(session.originalShape, delta));
      requestRender();
      return;
    }

    if (!readOnly && draftShapeRef.current) {
      draftShapeRef.current = updateDraftShape(draftShapeRef.current, session.startedAt, worldPoint);
      requestRender();
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    const draft = draftShapeRef.current;

    if (!readOnly && draft && shapeMap) {
      shapeMap.set(draft.id, draft);
    }

    draftShapeRef.current = null;
    pointerSessionRef.current = null;
    requestRender();
  };

  const handlePointerLeave = () => {
    onCursorChange?.(null);
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const screenPoint = getScreenPoint(event);
    const before = screenToWorld(screenPoint, viewportRef.current);
    const nextZoom = Math.min(4, Math.max(0.2, viewportRef.current.zoom * (event.deltaY > 0 ? 0.92 : 1.08)));
    const nextViewport = {
      x: screenPoint.x - before.x * nextZoom,
      y: screenPoint.y - before.y * nextZoom,
      zoom: nextZoom,
    };

    viewportRef.current = nextViewport;
    setViewport(nextViewport);
    requestRender();
  };

  return (
    <div className="relative h-full min-h-[640px] overflow-hidden bg-slate-50">
      {!readOnly && <CanvasToolbar />}
      <LayersPanel shapes={sortedShapes} />
      <div className="absolute bottom-4 left-4 z-20 rounded-md border bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-sm">
        {readOnly ? "Read only | " : ""}{Math.round(viewport.zoom * 100)}% | {canvasSize.width.toFixed(0)}x{canvasSize.height.toFixed(0)}
      </div>
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
      />
    </div>
  );
}
