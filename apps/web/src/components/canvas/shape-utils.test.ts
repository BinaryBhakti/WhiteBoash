import { describe, expect, it } from "vitest";
import { getShapeBounds, hitTestShape, moveShape } from "@/components/canvas/shape-utils";
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
});
