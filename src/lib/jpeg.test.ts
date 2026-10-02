import { describe, expect, it } from "vitest";
import { jpegDimensions } from "./jpeg";

// SOI, an APP0 segment, then a baseline frame header (SOF0) for 512×384.
const app0 = [0xff, 0xe0, 0x00, 0x04, 0x00, 0x00];
const sof0 = [0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x80, 0x02, 0x00, 0x03, 0x01, 0x22, 0x00];

describe("jpegDimensions", () => {
  it("reads width and height from the frame header after other segments", () => {
    const bytes = new Uint8Array([0xff, 0xd8, ...app0, ...sof0, 0, 0, 0, 0]);
    expect(jpegDimensions(bytes)).toEqual({ width: 512, height: 384 });
  });

  it("rejects anything that does not start like a JPEG", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(jpegDimensions(png)).toBeNull();
  });

  it("rejects a JPEG cut before its frame header", () => {
    expect(jpegDimensions(new Uint8Array([0xff, 0xd8, ...app0]))).toBeNull();
  });
});
