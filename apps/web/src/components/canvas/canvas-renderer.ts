import type { CanvasShape, Point, Viewport } from "@/lib/types";
import { getCombinedBounds, getResizeHandles, type ShapeBounds } from "@/components/canvas/shape-utils";

export function screenToWorld(point: Point, viewport: Viewport): Point {
  return {
    x: (point.x - viewport.x) / viewport.zoom,
    y: (point.y - viewport.y) / viewport.zoom,
  };
}

export function drawCanvasScene(
  context: CanvasRenderingContext2D,
  shapes: CanvasShape[],
  viewport: Viewport,
  draftShape?: CanvasShape | null,
  selectedShapeIds: string[] = [],
  marqueeBounds?: ShapeBounds | null,
) {
  const canvas = context.canvas;
  const pixelRatio = canvas.width / Math.max(1, canvas.clientWidth);
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawGrid(context, viewport, pixelRatio);

  context.setTransform(viewport.zoom * pixelRatio, 0, 0, viewport.zoom * pixelRatio, viewport.x * pixelRatio, viewport.y * pixelRatio);
  for (const shape of shapes) {
    if (shape.hidden) {
      continue;
    }

    drawShape(context, shape);
  }

  if (draftShape) {
    drawShape(context, draftShape);
  }

  const selectedShapes = shapes.filter((shape) => !shape.hidden && selectedShapeIds.includes(shape.id));
  if (selectedShapes.length > 0) {
    drawSelection(context, selectedShapes, viewport.zoom);
  }

  if (marqueeBounds) {
    drawMarquee(context, marqueeBounds, viewport.zoom);
  }
}

function drawGrid(context: CanvasRenderingContext2D, viewport: Viewport, pixelRatio: number) {
  const size = 32 * viewport.zoom;
  if (size < 8) {
    return;
  }

  const width = context.canvas.width / pixelRatio;
  const height = context.canvas.height / pixelRatio;
  const offsetX = viewport.x % size;
  const offsetY = viewport.y % size;

  context.beginPath();
  context.strokeStyle = "rgba(15, 23, 42, 0.08)";
  context.lineWidth = 1;

  for (let x = offsetX; x < width; x += size) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }

  for (let y = offsetY; y < height; y += size) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }

  context.stroke();
}

export function drawShape(context: CanvasRenderingContext2D, shape: CanvasShape) {
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = shape.stroke;
  context.fillStyle = shape.fill ?? "transparent";
  context.lineWidth = shape.strokeWidth;
  context.globalAlpha = shape.opacity ?? 1;

  if (shape.kind === "rectangle") {
    context.beginPath();
    context.roundRect(shape.x, shape.y, shape.width, shape.height, 8);
    if (shape.fill) context.fill();
    context.stroke();
  }

  if (shape.kind === "circle") {
    context.beginPath();
    context.arc(shape.x, shape.y, Math.max(1, shape.radius), 0, Math.PI * 2);
    if (shape.fill) context.fill();
    context.stroke();
  }

  if (shape.kind === "arrow") {
    drawArrow(context, { x: shape.x, y: shape.y }, shape.end);
  }

  if (shape.kind === "freehand") {
    context.beginPath();
    shape.points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y);
      } else {
        context.lineTo(point.x, point.y);
      }
    });
    context.stroke();
  }

  if (shape.kind === "text") {
    context.font = "16px Inter, ui-sans-serif, system-ui";
    context.fillStyle = shape.fill ?? "#0f172a";
    wrapText(context, shape.text, shape.x, shape.y, shape.width, 22);
  }

  if (shape.kind === "sticky") {
    context.beginPath();
    context.roundRect(shape.x, shape.y, shape.width, shape.height, 6);
    context.fillStyle = shape.fill ?? "#fef08a";
    context.fill();
    context.stroke();
    context.font = "16px Inter, ui-sans-serif, system-ui";
    context.fillStyle = shape.stroke;
    wrapText(context, shape.text, shape.x + 12, shape.y + 28, Math.max(24, shape.width - 24), 22);
  }

  context.restore();
}

function drawArrow(context: CanvasRenderingContext2D, start: Point, end: Point) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLength = 14;

  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();

  context.beginPath();
  context.moveTo(end.x, end.y);
  context.lineTo(
    end.x - headLength * Math.cos(angle - Math.PI / 6),
    end.y - headLength * Math.sin(angle - Math.PI / 6),
  );
  context.moveTo(end.x, end.y);
  context.lineTo(
    end.x - headLength * Math.cos(angle + Math.PI / 6),
    end.y - headLength * Math.sin(angle + Math.PI / 6),
  );
  context.stroke();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  let lineY = y;

  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (context.measureText(testLine).width > maxWidth && line) {
        context.fillText(line, x, lineY);
        line = word;
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }

    context.fillText(line, x, lineY);
    lineY += lineHeight;
  }
}

function drawSelection(context: CanvasRenderingContext2D, shapes: CanvasShape[], zoom: number) {
  const bounds = getCombinedBounds(shapes);
  if (!bounds) {
    return;
  }

  context.save();
  context.strokeStyle = "#0f766e";
  context.lineWidth = 1 / zoom;
  context.setLineDash([6 / zoom, 5 / zoom]);
  context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.setLineDash([]);

  for (const { point } of getResizeHandles(shapes)) {
    context.beginPath();
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#0f766e";
    context.lineWidth = 1.5 / zoom;
    context.rect(point.x - 4 / zoom, point.y - 4 / zoom, 8 / zoom, 8 / zoom);
    context.fill();
    context.stroke();
  }

  context.restore();
}

function drawMarquee(context: CanvasRenderingContext2D, bounds: ShapeBounds, zoom: number) {
  context.save();
  context.fillStyle = "rgba(13, 148, 136, 0.08)";
  context.strokeStyle = "#0f766e";
  context.lineWidth = 1 / zoom;
  context.setLineDash([5 / zoom, 4 / zoom]);
  context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
  context.restore();
}
