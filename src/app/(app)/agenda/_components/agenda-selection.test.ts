import { describe, expect, it } from "vitest";
import { parseSelectedAgendas, selectionParam, toggleAgenda } from "./agenda-selection";

const all = ["a", "b", "c"];

describe("parseSelectedAgendas", () => {
  it("keeps only agendas of the household, in household order", () => {
    expect(parseSelectedAgendas("c,zzz,a", all)).toEqual(["a", "c"]);
  });

  it("falls back to every agenda when nothing valid is selected", () => {
    expect(parseSelectedAgendas(undefined, all)).toEqual(all);
    expect(parseSelectedAgendas("not-an-agenda", all)).toEqual(all);
  });
});

describe("toggleAgenda", () => {
  it("adds and removes agendas", () => {
    expect(toggleAgenda(["a"], all, "c")).toEqual(["a", "c"]);
    expect(toggleAgenda(["a", "c"], all, "a")).toEqual(["c"]);
  });

  it("never deselects the last agenda", () => {
    expect(toggleAgenda(["b"], all, "b")).toEqual(["b"]);
  });
});

describe("selectionParam", () => {
  it("omits the parameter when every agenda is selected", () => {
    expect(selectionParam(all, all)).toBeNull();
    expect(selectionParam(["a", "c"], all)).toBe("a,c");
  });
});
