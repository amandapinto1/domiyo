import { describe, expect, it } from "vitest";
import { clampOffset, cropSource } from "./photo-crop";

const wide = { width: 2000, height: 1000 };

describe("cropSource", () => {
  it("takes the centered square of the short side at zoom 1", () => {
    expect(cropSource(wide, 1, { x: 0, y: 0 }, 200)).toEqual({ x: 500, y: 0, size: 1000 });
  });

  it("takes a smaller square when zoomed in", () => {
    expect(cropSource({ width: 1000, height: 1000 }, 2, { x: 0, y: 0 }, 200)).toEqual({ x: 250, y: 250, size: 500 });
  });

  it("reaches the left edge when the image is dragged fully to the right", () => {
    const offset = clampOffset({ x: 10_000, y: 0 }, wide, 1, 200);
    expect(offset.x).toBe(100);
    expect(cropSource(wide, 1, offset, 200).x).toBe(0);
  });
});

describe("clampOffset", () => {
  it("never uncovers the circle", () => {
    expect(clampOffset({ x: -500, y: 500 }, wide, 1, 200)).toEqual({ x: -100, y: 0 });
  });
});
