import "server-only";
import { hash, verify } from "@node-rs/argon2";

// @node-rs/argon2 defaults to Argon2id (m=19456 KiB, t=2, p=1), the OWASP baseline.
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export function verifyPassword({ hash: passwordHash, password }: { hash: string; password: string }): Promise<boolean> {
  return verify(passwordHash, password);
}
