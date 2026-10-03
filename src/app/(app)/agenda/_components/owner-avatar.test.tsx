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
    expect(markup).toContain("border-2 border-white");
    expect(markup).toContain("dark:border-lavender-900");
    expect(markup).toContain("-space-x-1.5");
    expect(markup).not.toContain("+2");
  });

  it("matches small avatar borders to the agenda item's background", () => {
    const markup = renderToStaticMarkup(<OwnersAvatar owners={owners} borderColor="#b9b8e1" />);

    expect(markup.match(/border-2/g)).toHaveLength(4);
    expect(markup.match(/border-color:#b9b8e1/g)).toHaveLength(4);
  });
});