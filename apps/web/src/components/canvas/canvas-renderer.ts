import type { CanvasShape, Point, Viewport } from "@/lib/types";
import { getShapeBounds } from "@/components/canvas/shape-utils";

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
  selectedShapeId?: string | null,
) {
  const canvas = context.canvas;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid(context, viewport);

  context.setTransform(viewport.zoom, 0, 0, viewport.zoom, viewport.x, viewport.y);
  for (const shape of shapes) {
    drawShape(context, shape);
  }

  if (draftShape) {
    drawShape(context, draftShape);
  }

  if (selectedShapeId) {
    const selected = shapes.find((shape) => shape.id === selectedShapeId);
    if (selected) {
      drawSelection(context, selected);
    }
  }
}

function drawGrid(context: CanvasRenderingContext2D, viewport: Viewport) {
  const size = 32 * viewport.zoom;
  if (size < 8) {
    return;
  }

  const width = context.canvas.width;
  const height = context.canvas.height;
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
  const words = text.split(" ");
  let line = "";
  let lineY = y;

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
}

function drawSelection(context: CanvasRenderingContext2D, shape: CanvasShape) {
  const bounds = getShapeBounds(shape);

  context.save();
  context.strokeStyle = "#0f766e";
  context.lineWidth = 1;
  context.setLineDash([6, 5]);
  context.strokeRect(bounds.x - 6, bounds.y - 6, bounds.width + 12, bounds.height + 12);
  context.restore();
}
