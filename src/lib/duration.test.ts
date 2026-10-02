import { describe, expect, it } from "vitest";
import { formatDuration } from "./duration";

describe("formatDuration", () => {
  it("formats seconds, minutes and both, in singular and plural", () => {
    expect(formatDuration(0)).toBe("0 segundos");
    expect(formatDuration(1_000)).toBe("1 segundo");
    expect(formatDuration(45_000)).toBe("45 segundos");
    expect(formatDuration(60_000)).toBe("1 minuto");
    expect(formatDuration(125_000)).toBe("2 minutos e 5 segundos");
    expect(formatDuration(184_392)).toBe("3 minutos e 4 segundos");
    expect(formatDuration(61_000)).toBe("1 minuto e 1 segundo");
  });

  it("rounds down to whole seconds and never goes negative", () => {
    expect(formatDuration(59_999)).toBe("59 segundos");
    expect(formatDuration(-5_000)).toBe("0 segundos");
  });
});
