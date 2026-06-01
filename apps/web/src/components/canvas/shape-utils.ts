import type { CanvasShape, Point } from "@/lib/types";

export type ShapeBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "arrow-start" | "arrow-end";

export type ResizeHandlePoint = {
  handle: ResizeHandle;
  point: Point;
};

const MIN_SHAPE_SIZE = 8;

export function getShapeBounds(shape: CanvasShape): ShapeBounds {
  if (shape.kind === "rectangle") {
    return normalizeBounds({ x: shape.x, y: shape.y, width: shape.width, height: shape.height });
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
    return boundsFromPoints({ x: shape.x, y: shape.y }, shape.end);
  }

  if (shape.kind === "freehand") {
    return getPointsBounds(shape.points);
  }

  return {
    x: shape.x,
    y: shape.y - 18,
    width: shape.width,
    height: Math.max(28, Math.ceil(shape.text.length / 22) * 22),
  };
}

export function getCombinedBounds(shapes: CanvasShape[]): ShapeBounds | null {
  if (shapes.length === 0) {
    return null;
  }

  const bounds = shapes.map(getShapeBounds);
  const left = Math.min(...bounds.map((item) => item.x));
  const top = Math.min(...bounds.map((item) => item.y));
  const right = Math.max(...bounds.map((item) => item.x + item.width));
  const bottom = Math.max(...bounds.map((item) => item.y + item.height));

  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function boundsFromPoints(start: Point, end: Point): ShapeBounds {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function hitTestShape(shape: CanvasShape, point: Point, tolerance = 6) {
  if (shape.kind === "circle") {
    return Math.hypot(point.x - shape.x, point.y - shape.y) <= shape.radius + tolerance;
  }

  if (shape.kind === "arrow") {
    return distanceToSegment(point, { x: shape.x, y: shape.y }, shape.end) <= tolerance;
  }

  if (shape.kind === "freehand") {
    return shape.points.some((current, index) => {
      const next = shape.points[index + 1];
      return next ? distanceToSegment(point, current, next) <= tolerance : distance(point, current) <= tolerance;
    });
  }

  return pointInBounds(point, getShapeBounds(shape), tolerance);
}

export function findShapeAtPoint(shapes: CanvasShape[], point: Point) {
  return shapes
    .slice()
    .reverse()
    .find((shape) => hitTestShape(shape, point));
}

export function findShapesInBounds(shapes: CanvasShape[], bounds: ShapeBounds) {
  return shapes.filter((shape) => boundsIntersect(getShapeBounds(shape), bounds));
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

export function resizeShape(
  shape: CanvasShape,
  originalSelectionBounds: ShapeBounds,
  nextSelectionBounds: ShapeBounds,
  handle?: ResizeHandle,
): CanvasShape {
  if (shape.kind === "arrow" && handle === "arrow-start") {
    return { ...shape, x: nextSelectionBounds.x, y: nextSelectionBounds.y, updatedAt: Date.now() };
  }

  if (shape.kind === "arrow" && handle === "arrow-end") {
    return {
      ...shape,
      end: { x: nextSelectionBounds.x + nextSelectionBounds.width, y: nextSelectionBounds.y + nextSelectionBounds.height },
      updatedAt: Date.now(),
    };
  }

  const scaleX = originalSelectionBounds.width === 0 ? 1 : nextSelectionBounds.width / originalSelectionBounds.width;
  const scaleY = originalSelectionBounds.height === 0 ? 1 : nextSelectionBounds.height / originalSelectionBounds.height;
  const transform = (point: Point): Point => ({
    x: nextSelectionBounds.x + (point.x - originalSelectionBounds.x) * scaleX,
    y: nextSelectionBounds.y + (point.y - originalSelectionBounds.y) * scaleY,
  });

  if (shape.kind === "rectangle") {
    const origin = transform({ x: shape.x, y: shape.y });
    return { ...shape, ...origin, width: shape.width * scaleX, height: shape.height * scaleY, updatedAt: Date.now() };
  }

  if (shape.kind === "circle") {
    const center = transform({ x: shape.x, y: shape.y });
    return { ...shape, ...center, radius: Math.max(1, shape.radius * Math.max(scaleX, scaleY)), updatedAt: Date.now() };
  }

  if (shape.kind === "arrow") {
    const start = transform({ x: shape.x, y: shape.y });
    return { ...shape, ...start, end: transform(shape.end), updatedAt: Date.now() };
  }

  if (shape.kind === "freehand") {
    const points = shape.points.map(transform);
    const origin = transform({ x: shape.x, y: shape.y });
    return { ...shape, ...origin, points, updatedAt: Date.now() };
  }

  const origin = transform({ x: shape.x, y: shape.y });
  return { ...shape, ...origin, width: Math.max(MIN_SHAPE_SIZE, shape.width * scaleX), updatedAt: Date.now() };
}

export function getResizeHandles(shapes: CanvasShape[]): ResizeHandlePoint[] {
  if (shapes.length === 1 && shapes[0]?.kind === "arrow") {
    const arrow = shapes[0];
    return [
      { handle: "arrow-start", point: { x: arrow.x, y: arrow.y } },
      { handle: "arrow-end", point: arrow.end },
    ];
  }

  const bounds = getCombinedBounds(shapes);
  if (!bounds) {
    return [];
  }

  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const right = bounds.x + bounds.width;
  const bottom = bounds.y + bounds.height;

  return [
    { handle: "nw", point: { x: bounds.x, y: bounds.y } },
    { handle: "n", point: { x: centerX, y: bounds.y } },
    { handle: "ne", point: { x: right, y: bounds.y } },
    { handle: "e", point: { x: right, y: centerY } },
    { handle: "se", point: { x: right, y: bottom } },
    { handle: "s", point: { x: centerX, y: bottom } },
    { handle: "sw", point: { x: bounds.x, y: bottom } },
    { handle: "w", point: { x: bounds.x, y: centerY } },
  ];
}

export function findResizeHandleAtPoint(shapes: CanvasShape[], point: Point, tolerance = 8) {
  return getResizeHandles(shapes).find((item) => distance(item.point, point) <= tolerance)?.handle;
}

export function resizeBounds(
  bounds: ShapeBounds,
  handle: ResizeHandle,
  point: Point,
  options: { preserveAspectRatio?: boolean; fromCenter?: boolean } = {},
): ShapeBounds {
  if (handle === "arrow-start" || handle === "arrow-end") {
    return boundsFromPoints(
      handle === "arrow-start" ? point : { x: bounds.x, y: bounds.y },
      handle === "arrow-end" ? point : { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    );
  }

  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  let left = handle.includes("w") ? Math.min(point.x, bounds.x + bounds.width - MIN_SHAPE_SIZE) : bounds.x;
  let top = handle.includes("n") ? Math.min(point.y, bounds.y + bounds.height - MIN_SHAPE_SIZE) : bounds.y;
  let right = handle.includes("e") ? Math.max(point.x, bounds.x + MIN_SHAPE_SIZE) : bounds.x + bounds.width;
  let bottom = handle.includes("s") ? Math.max(point.y, bounds.y + MIN_SHAPE_SIZE) : bounds.y + bounds.height;

  if (options.fromCenter) {
    if (handle.includes("w") || handle.includes("e")) {
      const halfWidth = Math.max(MIN_SHAPE_SIZE / 2, Math.abs(point.x - center.x));
      left = center.x - halfWidth;
      right = center.x + halfWidth;
    }

    if (handle.includes("n") || handle.includes("s")) {
      const halfHeight = Math.max(MIN_SHAPE_SIZE / 2, Math.abs(point.y - center.y));
      top = center.y - halfHeight;
      bottom = center.y + halfHeight;
    }
  }

  if (options.preserveAspectRatio && handle.length === 2) {
    const aspectRatio = bounds.width / Math.max(1, bounds.height);
    const width = right - left;
    const height = bottom - top;

    if (width / Math.max(1, height) > aspectRatio) {
      const nextHeight = width / aspectRatio;
      if (handle.includes("n")) top = bottom - nextHeight;
      else bottom = top + nextHeight;
    } else {
      const nextWidth = height * aspectRatio;
      if (handle.includes("w")) left = right - nextWidth;
      else right = left + nextWidth;
    }
  }

  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function isMeaningfulShape(shape: CanvasShape) {
  if (shape.kind === "rectangle") return shape.width >= MIN_SHAPE_SIZE && shape.height >= MIN_SHAPE_SIZE;
  if (shape.kind === "circle") return shape.radius >= MIN_SHAPE_SIZE / 2;
  if (shape.kind === "arrow") return distance({ x: shape.x, y: shape.y }, shape.end) >= MIN_SHAPE_SIZE;
  if (shape.kind === "freehand") return shape.points.length > 1 && getPolylineLength(shape.points) >= MIN_SHAPE_SIZE;
  return shape.text.trim().length > 0;
}

export function duplicateShape(shape: CanvasShape): CanvasShape {
  return moveShape({ ...shape, id: crypto.randomUUID() }, { x: 24, y: 24 });
}

export function simplifyFreehandShape(shape: CanvasShape, tolerance = 1.5): CanvasShape {
  if (shape.kind !== "freehand" || shape.points.length <= 2) {
    return shape;
  }

  return {
    ...shape,
    points: simplifyPoints(shape.points, tolerance),
  };
}

export function simplifyPoints(points: Point[], tolerance = 1.5): Point[] {
  if (points.length <= 2) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];
  let furthestIndex = 0;
  let furthestDistance = 0;

  for (let index = 1; index < points.length - 1; index += 1) {
    const pointDistance = distanceToSegment(points[index], first, last);
    if (pointDistance > furthestDistance) {
      furthestDistance = pointDistance;
      furthestIndex = index;
    }
  }

  if (furthestDistance <= tolerance) {
    return [first, last];
  }

  const left = simplifyPoints(points.slice(0, furthestIndex + 1), tolerance);
  const right = simplifyPoints(points.slice(furthestIndex), tolerance);
  return [...left.slice(0, -1), ...right];
}

function getPointsBounds(points: Point[]): ShapeBounds {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function normalizeBounds(bounds: ShapeBounds): ShapeBounds {
  return boundsFromPoints({ x: bounds.x, y: bounds.y }, { x: bounds.x + bounds.width, y: bounds.y + bounds.height });
}

function pointInBounds(point: Point, bounds: ShapeBounds, tolerance = 0) {
  return (
    point.x >= bounds.x - tolerance &&
    point.x <= bounds.x + bounds.width + tolerance &&
    point.y >= bounds.y - tolerance &&
    point.y <= bounds.y + bounds.height + tolerance
  );
}

function boundsIntersect(left: ShapeBounds, right: ShapeBounds) {
  return (
    left.x <= right.x + right.width &&
    left.x + left.width >= right.x &&
    left.y <= right.y + right.height &&
    left.y + left.height >= right.y
  );
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (lengthSquared === 0) return distance(point, start);
  const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / lengthSquared));
  return distance(point, { x: start.x + ratio * (end.x - start.x), y: start.y + ratio * (end.y - start.y) });
}

function distance(left: Point, right: Point) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function getPolylineLength(points: Point[]) {
  return points.reduce((total, point, index) => {
    const next = points[index + 1];
    return next ? total + distance(point, next) : total;
  }, 0);
}
