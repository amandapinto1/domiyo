import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { bytea } from "./columns.ts";
import { users } from "./auth.ts";
import { agendas } from "./households.ts";

export const agendaCronograms = pgTable("agenda_cronograms", {
  agendaId: uuid("agenda_id")
    .primaryKey()
    .references(() => agendas.id, { onDelete: "cascade" }),
  pdf: bytea("pdf").notNull(),
  fileName: bytea("file_name").notNull(),
  keyVersion: integer("key_version").notNull(),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pendingAgendaImports = pgTable(
  "pending_agenda_imports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agendaId: uuid("agenda_id")
      .notNull()
      .unique()
      .references(() => agendas.id, { onDelete: "cascade" }),
    uploadedByUserId: uuid("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pdf: bytea("pdf").notNull(),
    fileName: bytea("file_name").notNull(),
    schedule: bytea("schedule"),
    /** Non-sensitive failure code of the background read (e.g. "timeout"); null while reading or once ready. */
    failure: text("failure"),
    /** When the background read ended, with a result or a failure; null while reading. */
    readFinishedAt: timestamp("read_finished_at", { withTimezone: true }),
    keyVersion: integer("key_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("pending_agenda_imports_expires_at_idx").on(table.expiresAt)],
);