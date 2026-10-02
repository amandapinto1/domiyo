import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
// Explicit extension: Node-run scripts import the schema directly.
import { users } from "./auth.ts";
import { bytea } from "./columns.ts";

// One profile photo per user: a 512×512 JPEG, encrypted with pgcrypto (docs/ARCHITECTURE.md › Sensitive data).
export const userPhotos = pgTable("user_photos", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  photo: bytea("photo").notNull(),
  keyVersion: integer("key_version").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
