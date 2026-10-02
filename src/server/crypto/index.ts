import "server-only";
import { sql, type AnyColumn, type SQL } from "drizzle-orm";

// pgcrypto with the key passed as a bound parameter, never stored in the database (docs/ARCHITECTURE.md).
function readKeys() {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  const version = Number(process.env.FIELD_ENCRYPTION_KEY_VERSION ?? "1");
  if (!key || !Number.isInteger(version)) throw new Error("FIELD_ENCRYPTION_KEY is not configured.");
  return { key, version, previousKey: process.env.FIELD_ENCRYPTION_KEY_PREVIOUS || null };
}

/** Ciphertext expression for a bytea value, plus the key version to store next to it. */
export function encryptBytea(value: Buffer): { ciphertext: SQL; keyVersion: number } {
  const { key, version } = readKeys();
  return { ciphertext: sql`pgp_sym_encrypt_bytea(${value}, ${key}::text, 'cipher-algo=aes256')`, keyVersion: version };
}

/** Decrypts with the current key, or the previous one for rows written before a rotation. */
export function decryptBytea(ciphertext: AnyColumn, keyVersion: AnyColumn): SQL<Buffer> {
  const { key, version, previousKey } = readKeys();
  return sql<Buffer>`pgp_sym_decrypt_bytea(${ciphertext}, case when ${keyVersion} = ${version}::int then ${key}::text else ${previousKey}::text end)`;
}

/** Ciphertext for an optional text value (null stays null), plus the key version to store with the row. */
export function encryptText(value: string | null): { ciphertext: SQL; keyVersion: number } {
  const { key, version } = readKeys();
  return { ciphertext: sql`pgp_sym_encrypt(${value}::text, ${key}::text, 'cipher-algo=aes256')`, keyVersion: version };
}

export function decryptText(ciphertext: AnyColumn, keyVersion: AnyColumn): SQL<string | null> {
  const { key, version, previousKey } = readKeys();
  return sql<string | null>`pgp_sym_decrypt(${ciphertext}, case when ${keyVersion} = ${version}::int then ${key}::text else ${previousKey}::text end)`;
}

/** Rewrites a text column with the current key, so a row updated in place keeps one key version for every column. */
export function reencryptText(ciphertext: AnyColumn, keyVersion: AnyColumn): SQL {
  const { key } = readKeys();
  return sql`pgp_sym_encrypt(${decryptText(ciphertext, keyVersion)}, ${key}::text, 'cipher-algo=aes256')`;
}
