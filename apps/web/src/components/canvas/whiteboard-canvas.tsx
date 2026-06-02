"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import type { AwarenessCursor, CanvasShape, CanvasStyle, CanvasTool, Point, StickyShape, TextShape, Viewport } from "@/lib/types";
import { useCanvasStore } from "@/hooks/use-canvas-store";
import { useCRDTMap } from "@/hooks/use-crdt-map";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";
import { CanvasStyleToolbar } from "@/components/canvas/canvas-style-toolbar";
import { drawCanvasScene, screenToWorld } from "@/components/canvas/canvas-renderer";
import { LayersPanel } from "@/components/canvas/layers-panel";
import {
  boundsFromPoints,
  duplicateShape,
  findResizeHandleAtPoint,
  findShapeAtPoint,
  findShapesInBounds,
  getCombinedBounds,
  isMeaningfulShape,
  moveShape,
  resizeBounds,
  resizeShape,
  simplifyFreehandShape,
  type ResizeHandle,
  type ShapeBounds,
} from "@/components/canvas/shape-utils";

type WhiteboardCanvasProps = {
  documentId: string;
  doc: Y.Doc;
  readOnly?: boolean;
  onCursorChange?: (cursor: AwarenessCursor | null) => void;
};

type PointerSession = {
  pointerId: number;
  mode: "pan" | "move" | "marquee" | "resize" | "draw" | "erase";
  startedAt: Point;
  lastScreen: Point;
  originalShapes?: CanvasShape[];
  originalBounds?: ShapeBounds;
  resizeHandle?: ResizeHandle;
  appendSelection?: boolean;
};

type EditableTextShape = TextShape | StickyShape;

type TextEditorState = {
  shape: EditableTextShape;
  isNew: boolean;
};

export function WhiteboardCanvas({ documentId, doc, readOnly = false, onCursorChange }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const draftShapeRef = useRef<CanvasShape | null>(null);
  const marqueeBoundsRef = useRef<ShapeBounds | null>(null);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const viewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const clipboardRef = useRef<CanvasShape[]>([]);
  const pasteCountRef = useRef(0);
  const lastPointerWorldRef = useRef<Point | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const textCancelRef = useRef(false);

  const tool = useCanvasStore((state) => state.tool);
  const viewport = useCanvasStore((state) => state.viewport);
  const setViewport = useCanvasStore((state) => state.setViewport);
  const setTool = useCanvasStore((state) => state.setTool);
  const styleDefaults = useCanvasStore((state) => state.styleDefaults);
  const patchStyleDefaults = useCanvasStore((state) => state.patchStyleDefaults);
  const selectedShapeIds = useCanvasStore((state) => state.selectedShapeIds);
  const setSelectedShapeIds = useCanvasStore((state) => state.setSelectedShapeIds);
  const toggleSelectedShapeId = useCanvasStore((state) => state.toggleSelectedShapeId);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const { map: shapeMap, values: shapes } = useCRDTMap<CanvasShape>(doc, "canvas:shapes");
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [activeMode, setActiveMode] = useState<PointerSession["mode"] | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<ResizeHandle | null>(null);
  const [textEditor, setTextEditor] = useState<TextEditorState | null>(null);

  viewportRef.current = viewport;

  useEffect(() => {
    clearSelection();
    return clearSelection;
  }, [clearSelection, doc]);

  useEffect(() => {
    setHoveredHandle(null);
  }, [tool]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [textEditor?.shape.id]);

  const sortedShapes = useMemo(
    () => shapes.slice().sort((left, right) => left.updatedAt - right.updatedAt),
    [shapes],
  );
  const selectedShapes = useMemo(
    () => sortedShapes.filter((shape) => selectedShapeIds.includes(shape.id)),
    [selectedShapeIds, sortedShapes],
  );
  const activeStyle = useMemo<CanvasStyle>(() => {
    const selected = selectedShapes[0];
    return selected
      ? {
          stroke: selected.stroke,
          fill: selected.fill ?? styleDefaults.fill,
          strokeWidth: selected.strokeWidth,
          opacity: selected.opacity ?? 1,
        }
      : styleDefaults;
  }, [selectedShapes, styleDefaults]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    drawCanvasScene(context, sortedShapes, viewportRef.current, draftShapeRef.current, selectedShapeIds, marqueeBoundsRef.current);
  }, [selectedShapeIds, sortedShapes]);

  useEffect(() => {
    const shapesMap = doc.getMap<CanvasShape>("canvas:shapes");
    const manager = new Y.UndoManager(shapesMap);
    undoManagerRef.current = manager;

    return () => {
      manager.destroy();
      undoManagerRef.current = null;
    };
  }, [doc]);

  const copySelectedShapes = useCallback(() => {
    clipboardRef.current = selectedShapes.map((shape) => structuredClone(shape));
    pasteCountRef.current = 0;
  }, [selectedShapes]);

  const pasteClipboardShapes = useCallback(() => {
    if (!shapeMap || clipboardRef.current.length === 0) {
      return;
    }

    pasteCountRef.current += 1;
    const bounds = getCombinedBounds(clipboardRef.current);
    const anchor = lastPointerWorldRef.current;
    const cascadeOffset = 24 * pasteCountRef.current;
    const delta = anchor && bounds
      ? { x: anchor.x - bounds.x + cascadeOffset, y: anchor.y - bounds.y + cascadeOffset }
      : { x: cascadeOffset, y: cascadeOffset };
    const pastedIds = clipboardRef.current.map((shape) => {
      const pasted = moveShape({ ...shape, id: crypto.randomUUID() }, delta);
      shapeMap.set(pasted.id, pasted);
      return pasted.id;
    });
    setSelectedShapeIds(pastedIds);
  }, [setSelectedShapeIds, shapeMap]);

  const cancelTextEditing = useCallback(() => {
    textCancelRef.current = true;
    setTextEditor(null);
  }, []);

  const commitTextEditing = useCallback(() => {
    if (textCancelRef.current) {
      textCancelRef.current = false;
      return;
    }

    if (!shapeMap || !textEditor) {
      return;
    }

    const text = textEditor.shape.text.trim();
    if (text) {
      shapeMap.set(textEditor.shape.id, {
        ...textEditor.shape,
        text,
        updatedAt: Date.now(),
      });
      setSelectedShapeIds([textEditor.shape.id]);
    }

    setTextEditor(null);
  }, [setSelectedShapeIds, shapeMap, textEditor]);

  const applyStyle = useCallback((patch: Partial<CanvasStyle>) => {
    patchStyleDefaults(patch);
    if (!shapeMap || selectedShapes.length === 0) {
      return;
    }

    doc.transact(() => {
      selectedShapes.forEach((shape) => {
        shapeMap.set(shape.id, {
          ...shape,
          ...patch,
          updatedAt: Date.now(),
        });
      });
    });
  }, [doc, patchStyleDefaults, selectedShapes, shapeMap]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, [contenteditable='true']")) {
        return;
      }

      if (event.key === "Escape") {
        clearSelection();
        marqueeBoundsRef.current = null;
        return;
      }

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
      } else if (isMod && event.key.toLowerCase() === "d" && selectedShapes.length > 0) {
        event.preventDefault();
        const duplicateIds = selectedShapes.map((selected) => {
          const duplicate = duplicateShape(selected);
          shapeMap.set(duplicate.id, duplicate);
          return duplicate.id;
        });
        setSelectedShapeIds(duplicateIds);
      } else if (isMod && event.key.toLowerCase() === "c" && selectedShapes.length > 0) {
        event.preventDefault();
        copySelectedShapes();
      } else if (isMod && event.key.toLowerCase() === "x" && selectedShapes.length > 0) {
        event.preventDefault();
        copySelectedShapes();
        selectedShapeIds.forEach((id) => shapeMap.delete(id));
        clearSelection();
      } else if (isMod && event.key.toLowerCase() === "v") {
        event.preventDefault();
        pasteClipboardShapes();
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedShapeIds.length > 0) {
        event.preventDefault();
        selectedShapeIds.forEach((id) => shapeMap.delete(id));
        clearSelection();
      } else if (!isMod && !event.altKey) {
        const shortcutTool = getToolForShortcut(event.key);
        if (shortcutTool && (!readOnly || shortcutTool === "select" || shortcutTool === "pan")) {
          event.preventDefault();
          setTool(shortcutTool);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearSelection, copySelectedShapes, pasteClipboardShapes, readOnly, selectedShapeIds, selectedShapes, setSelectedShapeIds, setTool, shapeMap]);

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
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * pixelRatio);
      canvas.height = Math.floor(rect.height * pixelRatio);
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
      stroke: styleDefaults.stroke,
      fill: styleDefaults.fill,
      strokeWidth: styleDefaults.strokeWidth,
      opacity: styleDefaults.opacity,
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
      return { ...base, kind: "text", fill: styleDefaults.stroke, text: "", width: 180 };
    }

    if (shapeTool === "sticky") {
      return { ...base, kind: "sticky", text: "", width: 180, height: 140 };
    }

    return null;
  }, [styleDefaults]);

  const beginTextEditing = useCallback((shape: EditableTextShape, isNew = false) => {
    textCancelRef.current = false;
    setSelectedShapeIds([shape.id]);
    setTextEditor({ shape, isNew });
  }, [setSelectedShapeIds]);

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

  const eraseAtPoint = useCallback((point: Point) => {
    if (!shapeMap) {
      return;
    }

    const shape = findShapeAtPoint(sortedShapes, point);
    if (!shape) {
      return;
    }

    shapeMap.delete(shape.id);
    if (selectedShapeIds.includes(shape.id)) {
      setSelectedShapeIds(selectedShapeIds.filter((id) => id !== shape.id));
    }
  }, [selectedShapeIds, setSelectedShapeIds, shapeMap, sortedShapes]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const screenPoint = getScreenPoint(event);
    const worldPoint = screenToWorld(screenPoint, viewportRef.current);
    lastPointerWorldRef.current = worldPoint;
    setHoveredHandle(null);

    if (tool === "eraser" && !readOnly) {
      event.currentTarget.setPointerCapture(event.pointerId);
      eraseAtPoint(worldPoint);
      setActiveMode("erase");
      pointerSessionRef.current = {
        pointerId: event.pointerId,
        mode: "erase",
        startedAt: worldPoint,
        lastScreen: screenPoint,
      };
      return;
    }

    if (tool === "pan" || event.button === 1) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setActiveMode("pan");
      pointerSessionRef.current = {
        pointerId: event.pointerId,
        mode: "pan",
        startedAt: worldPoint,
        lastScreen: screenPoint,
      };
      return;
    }

    if (tool === "select") {
      const resizeHandle = readOnly ? undefined : findResizeHandleAtPoint(selectedShapes, worldPoint, 8 / viewportRef.current.zoom);
      const selectionBounds = getCombinedBounds(selectedShapes);

      if (resizeHandle && selectionBounds) {
        event.currentTarget.setPointerCapture(event.pointerId);
        setActiveMode("resize");
        pointerSessionRef.current = {
          pointerId: event.pointerId,
          mode: "resize",
          startedAt: worldPoint,
          lastScreen: screenPoint,
          originalShapes: selectedShapes,
          originalBounds: selectionBounds,
          resizeHandle,
        };
        return;
      }

      const selected = findShapeAtPoint(sortedShapes, worldPoint);
      if (selected) {
        event.currentTarget.setPointerCapture(event.pointerId);
        const nextIds = event.shiftKey
          ? selectedShapeIds.includes(selected.id)
            ? selectedShapeIds.filter((id) => id !== selected.id)
            : [...selectedShapeIds, selected.id]
          : selectedShapeIds.includes(selected.id)
            ? selectedShapeIds
            : [selected.id];

        if (event.shiftKey) {
          toggleSelectedShapeId(selected.id);
        } else {
          setSelectedShapeIds(nextIds);
        }

        const movableShapes = sortedShapes.filter((shape) => nextIds.includes(shape.id));
        setActiveMode("move");
        pointerSessionRef.current = {
          pointerId: event.pointerId,
          mode: "move",
          startedAt: worldPoint,
          lastScreen: screenPoint,
          originalShapes: movableShapes,
        };
        return;
      }

      if (!event.shiftKey) {
        clearSelection();
      }

      marqueeBoundsRef.current = boundsFromPoints(worldPoint, worldPoint);
      event.currentTarget.setPointerCapture(event.pointerId);
      setActiveMode("marquee");
      pointerSessionRef.current = {
        pointerId: event.pointerId,
        mode: "marquee",
        startedAt: worldPoint,
        lastScreen: screenPoint,
        appendSelection: event.shiftKey,
      };
      requestRender();
      return;
    }

    if (readOnly) {
      return;
    }

    const draft = createDraftShape(tool, worldPoint);
    if (draft?.kind === "text" || draft?.kind === "sticky") {
      beginTextEditing(draft, true);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveMode("draw");
    pointerSessionRef.current = {
      pointerId: event.pointerId,
      mode: "draw",
      startedAt: worldPoint,
      lastScreen: screenPoint,
    };
    draftShapeRef.current = draft;

    requestRender();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const screenPoint = getScreenPoint(event);
    const worldPoint = screenToWorld(screenPoint, viewportRef.current);
    lastPointerWorldRef.current = worldPoint;
    onCursorChange?.({ ...worldPoint, documentId });

    const session = pointerSessionRef.current;
    if (!session) {
      if (tool === "select") {
        setHoveredHandle(findResizeHandleAtPoint(selectedShapes, worldPoint, 8 / viewportRef.current.zoom) ?? null);
      }
      return;
    }

    if (session.mode === "pan") {
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

    if (session.mode === "erase" && !readOnly) {
      eraseAtPoint(worldPoint);
      return;
    }

    if (session.mode === "move" && !readOnly && session.originalShapes && shapeMap) {
      const delta = {
        x: worldPoint.x - session.startedAt.x,
        y: worldPoint.y - session.startedAt.y,
      };
      session.originalShapes.forEach((shape) => shapeMap.set(shape.id, moveShape(shape, delta)));
      requestRender();
      return;
    }

    if (session.mode === "resize" && !readOnly && session.originalShapes && session.originalBounds && session.resizeHandle && shapeMap) {
      if (session.originalShapes.length === 1 && session.originalShapes[0]?.kind === "arrow") {
        const arrow = session.originalShapes[0];
        shapeMap.set(arrow.id, resizeArrowEndpoint(arrow, session.resizeHandle, worldPoint));
        requestRender();
        return;
      }

      const nextBounds = resizeBounds(session.originalBounds, session.resizeHandle, worldPoint, {
        preserveAspectRatio: event.shiftKey,
        fromCenter: event.altKey,
      });
      session.originalShapes.forEach((shape) => shapeMap.set(shape.id, resizeShape(shape, session.originalBounds!, nextBounds)));
      requestRender();
      return;
    }

    if (session.mode === "marquee") {
      marqueeBoundsRef.current = boundsFromPoints(session.startedAt, worldPoint);
      requestRender();
      return;
    }

    if (session.mode === "draw" && !readOnly && draftShapeRef.current) {
      draftShapeRef.current = updateDraftShape(draftShapeRef.current, session.startedAt, worldPoint);
      requestRender();
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const draft = draftShapeRef.current;
    const session = pointerSessionRef.current;

    if (!readOnly && draft && shapeMap && isMeaningfulShape(draft)) {
      const persistentShape = simplifyFreehandShape(draft);
      shapeMap.set(persistentShape.id, persistentShape);
      setSelectedShapeIds([persistentShape.id]);
    }

    if (session?.mode === "marquee" && marqueeBoundsRef.current) {
      const isDragSelection = marqueeBoundsRef.current.width >= 2 || marqueeBoundsRef.current.height >= 2;
      const marqueeIds = isDragSelection
        ? findShapesInBounds(sortedShapes, marqueeBoundsRef.current).map((shape) => shape.id)
        : [];
      setSelectedShapeIds(session.appendSelection ? [...selectedShapeIds, ...marqueeIds] : marqueeIds);
    }

    draftShapeRef.current = null;
    marqueeBoundsRef.current = null;
    pointerSessionRef.current = null;
    setActiveMode(null);
    setHoveredHandle(null);
    requestRender();
  };

  const handlePointerLeave = () => {
    onCursorChange?.(null);
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) {
      return;
    }

    const screenPoint = getScreenPoint(event);
    const shape = findShapeAtPoint(sortedShapes, screenToWorld(screenPoint, viewportRef.current));
    if (shape?.kind === "text" || shape?.kind === "sticky") {
      beginTextEditing(shape);
    }
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
      <CanvasToolbar readOnly={readOnly} />
      <CanvasStyleToolbar hasSelection={selectedShapes.length > 0} readOnly={readOnly} style={activeStyle} onChange={applyStyle} />
      <LayersPanel shapes={sortedShapes} />
      <div className="absolute bottom-4 left-4 z-20 rounded-md border bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-sm">
        {readOnly ? "Read only | " : ""}{Math.round(viewport.zoom * 100)}% | {canvasSize.width.toFixed(0)}x{canvasSize.height.toFixed(0)}
      </div>
      {textEditor ? (
        <textarea
          ref={textAreaRef}
          aria-label={textEditor.isNew ? "New text note" : "Edit text note"}
          className="absolute z-30 resize-none rounded-sm border border-emerald-600 bg-white/95 px-1 py-0.5 text-slate-900 shadow-sm outline-none ring-2 ring-emerald-200"
          style={{
            left: viewport.x + textEditor.shape.x * viewport.zoom,
            top: viewport.y + (textEditor.shape.kind === "sticky" ? textEditor.shape.y + 8 : textEditor.shape.y - 20) * viewport.zoom,
            width: Math.max(120, textEditor.shape.width * viewport.zoom),
            minHeight: Math.max(56, (textEditor.shape.kind === "sticky" ? textEditor.shape.height - 16 : 72) * viewport.zoom),
            fontSize: Math.max(12, 16 * viewport.zoom),
            lineHeight: `${Math.max(18, 22 * viewport.zoom)}px`,
          }}
          value={textEditor.shape.text}
          onBlur={commitTextEditing}
          onChange={(event) =>
            setTextEditor((current) =>
              current
                ? {
                    ...current,
                    shape: {
                      ...current.shape,
                      text: event.target.value,
                    },
                  }
                : null,
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancelTextEditing();
              return;
            }

            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              commitTextEditing();
            }
          }}
        />
      ) : null}
      <canvas
        ref={canvasRef}
        className={`h-full w-full ${getCanvasCursor(tool, activeMode, hoveredHandle)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />
    </div>
  );
}

function getToolForShortcut(key: string): CanvasTool | null {
  const shortcuts: Record<string, CanvasTool> = {
    v: "select",
    h: "pan",
    r: "rectangle",
    o: "circle",
    a: "arrow",
    p: "freehand",
    t: "text",
    s: "sticky",
    e: "eraser",
  };

  return shortcuts[key.toLowerCase()] ?? null;
}

function getCanvasCursor(tool: CanvasTool, activeMode: PointerSession["mode"] | null, hoveredHandle: ResizeHandle | null) {
  if (activeMode === "pan" || activeMode === "move") return "cursor-grabbing";
  if (hoveredHandle === "n" || hoveredHandle === "s") return "cursor-ns-resize";
  if (hoveredHandle === "e" || hoveredHandle === "w") return "cursor-ew-resize";
  if (hoveredHandle === "nw" || hoveredHandle === "se") return "cursor-nwse-resize";
  if (hoveredHandle === "ne" || hoveredHandle === "sw") return "cursor-nesw-resize";
  if (hoveredHandle === "arrow-start" || hoveredHandle === "arrow-end") return "cursor-move";
  if (tool === "pan") return "cursor-grab";
  if (tool === "select") return "cursor-default";
  if (tool === "eraser") return "cursor-cell";
  if (tool === "text") return "cursor-text";
  return "cursor-crosshair";
}

function resizeArrowEndpoint(shape: CanvasShape, handle: ResizeHandle, point: Point): CanvasShape {
  if (shape.kind !== "arrow") {
    return shape;
  }

  if (handle === "arrow-start") {
    return { ...shape, x: point.x, y: point.y, updatedAt: Date.now() };
  }

  return { ...shape, end: point, updatedAt: Date.now() };
}
