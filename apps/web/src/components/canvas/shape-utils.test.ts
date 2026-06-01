import { describe, expect, it } from "vitest";
import {
  findResizeHandleAtPoint,
  findShapesInBounds,
  getCombinedBounds,
  getShapeBounds,
  hitTestShape,
  isMeaningfulShape,
  moveShape,
  resizeBounds,
  resizeShape,
  simplifyPoints,
} from "@/components/canvas/shape-utils";
import type { CanvasShape } from "@/lib/types";

describe("shape utils", () => {
  const rectangle: CanvasShape = {
    id: "rect-1",
    kind: "rectangle",
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    stroke: "#000",
    fill: "#fff",
    strokeWidth: 2,
    updatedAt: 1,
  };

  it("calculates rectangle bounds", () => {
    expect(getShapeBounds(rectangle)).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("hit tests within bounds with tolerance", () => {
    expect(hitTestShape(rectangle, { x: 15, y: 25 })).toBe(true);
    expect(hitTestShape(rectangle, { x: 250, y: 25 })).toBe(false);
  });

  it("moves arrow start and end points together", () => {
    const arrow: CanvasShape = {
      id: "arrow-1",
      kind: "arrow",
      x: 0,
      y: 0,
      end: { x: 50, y: 50 },
      stroke: "#000",
      strokeWidth: 2,
      updatedAt: 1,
    };

    expect(moveShape(arrow, { x: 5, y: 10 })).toMatchObject({
      x: 5,
      y: 10,
      end: { x: 55, y: 60 },
    });
  });

  it("uses segment distance instead of arrow bounding boxes", () => {
    const arrow: CanvasShape = {
      id: "arrow-1",
      kind: "arrow",
      x: 0,
      y: 0,
      end: { x: 100, y: 100 },
      stroke: "#000",
      strokeWidth: 2,
      updatedAt: 1,
    };

    expect(hitTestShape(arrow, { x: 52, y: 48 })).toBe(true);
    expect(hitTestShape(arrow, { x: 10, y: 90 })).toBe(false);
  });

  it("hit tests circles and freehand strokes accurately", () => {
    const circle: CanvasShape = {
      id: "circle-1",
      kind: "circle",
      x: 50,
      y: 50,
      radius: 20,
      stroke: "#000",
      strokeWidth: 2,
      updatedAt: 1,
    };
    const freehand: CanvasShape = {
      id: "pen-1",
      kind: "freehand",
      x: 0,
      y: 0,
      points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      stroke: "#000",
      strokeWidth: 2,
      updatedAt: 1,
    };

    expect(hitTestShape(circle, { x: 68, y: 50 })).toBe(true);
    expect(hitTestShape(circle, { x: 90, y: 90 })).toBe(false);
    expect(hitTestShape(freehand, { x: 40, y: 3 })).toBe(true);
    expect(hitTestShape(freehand, { x: 40, y: 20 })).toBe(false);
  });

  it("finds shapes intersecting marquee bounds", () => {
    const outside = { ...rectangle, id: "rect-2", x: 300, y: 300 };

    expect(findShapesInBounds([rectangle, outside], { x: 0, y: 0, width: 80, height: 80 })).toEqual([rectangle]);
  });

  it("calculates combined bounds and resizes grouped rectangles", () => {
    const second = { ...rectangle, id: "rect-2", x: 120, width: 80 };
    const bounds = getCombinedBounds([rectangle, second]);

    expect(bounds).toEqual({ x: 10, y: 20, width: 190, height: 50 });
    expect(resizeShape(second, bounds!, { x: 10, y: 20, width: 380, height: 100 })).toMatchObject({
      x: 230,
      y: 20,
      width: 160,
      height: 100,
    });
  });

  it("exposes resize handles and enforces minimum resize bounds", () => {
    expect(findResizeHandleAtPoint([rectangle], { x: 110, y: 70 })).toBe("se");
    expect(resizeBounds(getShapeBounds(rectangle), "se", { x: 12, y: 22 })).toEqual({
      x: 10,
      y: 20,
      width: 8,
      height: 8,
    });
  });

  it("supports proportional and centered resize modifiers", () => {
    expect(resizeBounds(getShapeBounds(rectangle), "se", { x: 210, y: 80 }, { preserveAspectRatio: true })).toEqual({
      x: 10,
      y: 20,
      width: 200,
      height: 100,
    });
    expect(resizeBounds(getShapeBounds(rectangle), "e", { x: 160, y: 45 }, { fromCenter: true })).toEqual({
      x: -40,
      y: 20,
      width: 200,
      height: 50,
    });
  });

  it("filters accidental tiny shapes", () => {
    expect(isMeaningfulShape({ ...rectangle, width: 2, height: 2 })).toBe(false);
    expect(isMeaningfulShape(rectangle)).toBe(true);
  });

  it("simplifies freehand points while preserving meaningful corners", () => {
    expect(
      simplifyPoints([
        { x: 0, y: 0 },
        { x: 25, y: 0.4 },
        { x: 50, y: 0 },
        { x: 50, y: 30 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 30 },
    ]);
  });
});
