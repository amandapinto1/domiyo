import { describe, expect, it } from "vitest";
import { getThemeColor, parseTheme } from "./theme";

describe("theme helpers", () => {
  it("maps each theme to its screen background color", () => {
    expect(getThemeColor("light")).toBe("#e4e3f2");
    expect(getThemeColor("dark")).toBe("#1f1326");
  });

  it("defaults unknown theme values to light", () => {
    expect(parseTheme(undefined)).toBe("light");
    expect(parseTheme("system")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
  });
});