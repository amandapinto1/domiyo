import { describe, expect, it } from "vitest";
import { generateInvitationToken } from "./invitation-token";

describe("generateInvitationToken", () => {
  it("returns eight alphanumeric characters", () => {
    expect(generateInvitationToken()).toMatch(/^[A-Za-z0-9]{8}$/);
  });
});