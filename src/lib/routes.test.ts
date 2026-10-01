import { describe, expect, it } from "vitest";
import { safeNextPath, withNext } from "./routes";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/invite/abc")).toBe("/invite/abc");
  });

  it("rejects anything that could leave the app", () => {
    for (const value of ["https://evil.example", "//evil.example", "/\\evil.example", "invite", undefined, ["/a"]]) {
      expect(safeNextPath(value)).toBeUndefined();
    }
  });
});

describe("withNext", () => {
  it("encodes the return path only when there is one", () => {
    expect(withNext("/login", "/invite/a b")).toBe("/login?next=%2Finvite%2Fa%20b");
    expect(withNext("/login", undefined)).toBe("/login");
  });
});
