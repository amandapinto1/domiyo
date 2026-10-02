import { customType } from "drizzle-orm/pg-core";

/** Raw bytes; pgcrypto ciphertext columns use it too. */
export const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });
