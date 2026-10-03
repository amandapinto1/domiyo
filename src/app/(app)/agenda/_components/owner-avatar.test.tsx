import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OwnersAvatar } from "./owner-avatar";

const owners = Array.from({ length: 5 }, (_, index) => ({
  id: `owner-${index}`,
  name: `Pessoa ${index + 1}`,
  initials: `P${index + 1}`,
  photoUrl: null,
}));

describe("OwnersAvatar", () => {
  it("shows every owner in the large detail header", () => {
    const markup = renderToStaticMarkup(<OwnersAvatar owners={owners} size="large" />);

    expect(markup.match(/role="img"/g)).toHaveLength(owners.length);
    expect(markup).not.toContain("+2");
  });
});