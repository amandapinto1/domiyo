import { describe, expect, it } from "vitest";
import { getSignInErrorMessage, getSignInNotice, signInSchema } from "./sign-in";

describe("signInSchema", () => {
  it("requires email and password with pt-BR messages", () => {
    const result = signInSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(["Informe seu e-mail.", "Informe sua senha."]);
  });

  it("rejects an invalid email and trims a valid one", () => {
    expect(signInSchema.safeParse({ email: "amanda@", password: "x" }).error?.issues[0].message).toBe(
      "Informe um e-mail válido.",
    );
    expect(signInSchema.parse({ email: "  amanda@example.com ", password: "x" }).email).toBe("amanda@example.com");
  });
});

describe("getSignInErrorMessage", () => {
  it("maps Better Auth errors to safe messages", () => {
    expect(getSignInErrorMessage({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" })).toBe("E-mail ou senha incorretos.");
    expect(getSignInErrorMessage({ status: 403, code: "EMAIL_NOT_VERIFIED" })).toMatch(/^Confirme seu e-mail/);
    expect(getSignInErrorMessage({ status: 429 })).toMatch(/^Muitas tentativas/);
    expect(getSignInErrorMessage({})).toBe("Não foi possível entrar. Tente de novo.");
  });
});

describe("getSignInNotice", () => {
  it("explains email links and password resets", () => {
    expect(getSignInNotice({ reset: "success" })?.tone).toBe("success");
    expect(getSignInNotice({ error: "TOKEN_EXPIRED" })?.message).toMatch(/^O link de confirmação expirou/);
    expect(getSignInNotice({})).toBeNull();
  });
});
