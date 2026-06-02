import type { Point, Viewport } from "@/lib/types";
import type { ShapeBounds } from "@/components/canvas/shape-utils";

export const MIN_ZOOM = 0.2;
export const MAX_ZOOM = 4;

export function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function zoomViewportAtPoint(viewport: Viewport, screenPoint: Point, nextZoom: number): Viewport {
  const zoom = clampZoom(nextZoom);
  const worldPoint = {
    x: (screenPoint.x - viewport.x) / viewport.zoom,
    y: (screenPoint.y - viewport.y) / viewport.zoom,
  };

  return {
    x: screenPoint.x - worldPoint.x * zoom,
    y: screenPoint.y - worldPoint.y * zoom,
    zoom,
  };
}

export function fitBoundsToViewport(
  bounds: ShapeBounds,
  canvasSize: { width: number; height: number },
  padding = 64,
): Viewport {
  const availableWidth = Math.max(1, canvasSize.width - padding * 2);
  const availableHeight = Math.max(1, canvasSize.height - padding * 2);
  const zoom = clampZoom(Math.min(availableWidth / Math.max(1, bounds.width), availableHeight / Math.max(1, bounds.height)));

  return {
    x: canvasSize.width / 2 - (bounds.x + bounds.width / 2) * zoom,
    y: canvasSize.height / 2 - (bounds.y + bounds.height / 2) * zoom,
    zoom,
  };
}

export function centerBoundsInViewport(
  bounds: ShapeBounds,
  canvasSize: { width: number; height: number },
  zoom: number,
): Viewport {
  return {
    x: canvasSize.width / 2 - (bounds.x + bounds.width / 2) * zoom,
    y: canvasSize.height / 2 - (bounds.y + bounds.height / 2) * zoom,
    zoom: clampZoom(zoom),
  };
}
