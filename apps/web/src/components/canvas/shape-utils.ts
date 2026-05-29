import type { CanvasShape, Point } from "@/lib/types";

export type ShapeBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getShapeBounds(shape: CanvasShape): ShapeBounds {
  if (shape.kind === "rectangle") {
    return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  }

  if (shape.kind === "circle") {
    return {
      x: shape.x - shape.radius,
      y: shape.y - shape.radius,
      width: shape.radius * 2,
      height: shape.radius * 2,
    };
  }

  if (shape.kind === "arrow") {
    return {
      x: Math.min(shape.x, shape.end.x),
      y: Math.min(shape.y, shape.end.y),
      width: Math.abs(shape.end.x - shape.x),
      height: Math.abs(shape.end.y - shape.y),
    };
  }

  if (shape.kind === "freehand") {
    const xs = shape.points.map((point) => point.x);
    const ys = shape.points.map((point) => point.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);

    return {
      x,
      y,
      width: Math.max(...xs) - x,
      height: Math.max(...ys) - y,
    };
  }

  return {
    x: shape.x,
    y: shape.y - 18,
    width: shape.width,
    height: Math.max(28, Math.ceil(shape.text.length / 22) * 22),
  };
}

export function hitTestShape(shape: CanvasShape, point: Point, tolerance = 6) {
  const bounds = getShapeBounds(shape);

  return (
    point.x >= bounds.x - tolerance &&
    point.x <= bounds.x + bounds.width + tolerance &&
    point.y >= bounds.y - tolerance &&
    point.y <= bounds.y + bounds.height + tolerance
  );
}

export function findShapeAtPoint(shapes: CanvasShape[], point: Point) {
  return shapes
    .slice()
    .reverse()
    .find((shape) => hitTestShape(shape, point));
}

export function moveShape(shape: CanvasShape, delta: Point): CanvasShape {
  const base = {
    ...shape,
    x: shape.x + delta.x,
    y: shape.y + delta.y,
    updatedAt: Date.now(),
  };

  if (shape.kind === "arrow") {
    return {
      ...base,
      kind: "arrow",
      end: {
        x: shape.end.x + delta.x,
        y: shape.end.y + delta.y,
      },
    };
  }

  if (shape.kind === "freehand") {
    return {
      ...base,
      kind: "freehand",
      points: shape.points.map((point) => ({
        x: point.x + delta.x,
        y: point.y + delta.y,
      })),
    };
  }

  return base;
}

export function duplicateShape(shape: CanvasShape): CanvasShape {
  return moveShape(
    {
      ...shape,
      id: crypto.randomUUID(),
    },
    { x: 24, y: 24 },
  );
}
