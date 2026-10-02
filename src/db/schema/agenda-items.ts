import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
// Explicit extension: Node-run scripts import the schema directly.
import { bytea } from "./columns.ts";
import { agendas } from "./households.ts";

export type AgendaItemSource = "imported" | "manual";

// docs/ARCHITECTURE.md › Sensitive data: times, color and flags in plaintext; the content columns are pgcrypto ciphertext.
export const agendaItems = pgTable(
  "agenda_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agendaId: uuid("agenda_id")
      .notNull()
      .references(() => agendas.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    /** "#RRGGBB" subject color from the imported PDF legend. */
    color: text("color").notNull(),
    source: text("source").$type<AgendaItemSource>().notNull(),
    editedManually: boolean("edited_manually").notNull().default(false),
    title: bytea("title").notNull(),
    type: bytea("type"),
    location: bytea("location"),
    teacher: bytea("teacher"),
    content: bytea("content"),
    /** Methodology label (NAF, AIM n, CBL, TBL, OSCE) shown as a tag on the card. */
    tag: bytea("tag"),
    notes: bytea("notes"),
    importKey: bytea("import_key"),
    keyVersion: integer("key_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("agenda_items_agenda_id_starts_at_idx").on(table.agendaId, table.startsAt),
    check("agenda_items_source_check", sql`${table.source} in ('imported', 'manual')`),
    check("agenda_items_color_check", sql`${table.color} ~ '^#[0-9A-Fa-f]{6}$'`),
    check("agenda_items_time_check", sql`${table.endsAt} > ${table.startsAt}`),
  ],
);
