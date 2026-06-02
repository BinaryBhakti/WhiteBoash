import { describe, expect, it } from "vitest";
import { centerBoundsInViewport, clampZoom, fitBoundsToViewport, zoomViewportAtPoint } from "@/components/canvas/viewport-utils";

describe("viewport utils", () => {
  it("clamps zoom to supported limits", () => {
    expect(clampZoom(0.01)).toBe(0.2);
    expect(clampZoom(8)).toBe(4);
  });

  it("zooms around the requested screen point", () => {
    expect(zoomViewportAtPoint({ x: 0, y: 0, zoom: 1 }, { x: 100, y: 100 }, 2)).toEqual({
      x: -100,
      y: -100,
      zoom: 2,
    });
  });

  it("fits bounds into the available canvas area", () => {
    expect(fitBoundsToViewport({ x: 100, y: 100, width: 400, height: 200 }, { width: 1000, height: 600 }, 100)).toEqual({
      x: -100,
      y: -100,
      zoom: 2,
    });
  });

  it("centers bounds without changing zoom", () => {
    expect(centerBoundsInViewport({ x: 100, y: 100, width: 400, height: 200 }, { width: 1000, height: 600 }, 1.5)).toEqual({
      x: 50,
      y: 0,
      zoom: 1.5,
    });
  });
});
