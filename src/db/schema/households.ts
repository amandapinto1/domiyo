import { sql } from "drizzle-orm";
import { boolean, check, index, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
// Explicit extension: Node-run scripts import this file directly.
import { users } from "./auth.ts";

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// MVP: the unique user_id limits each user to one household (docs/ARCHITECTURE.md); a later migration drops it.
export const householdMembers = pgTable(
  "household_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    canImportPdf: boolean("can_import_pdf"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("household_members_household_id_idx").on(table.householdId)],
);

// Each member gets exactly one agenda, created when they join (docs/PRD.md).
export const agendas = pgTable(
  "agendas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("agendas_household_owner_unique").on(table.householdId, table.ownerUserId)],
);

export type InvitationStatus = "pending" | "accepted" | "declined" | "revoked";

export const householdInvitations = pgTable(
  "household_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    invitedByUserId: uuid("invited_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Null for shareable link invitations.
    email: text("email"),
    // Only the SHA-256 of the token is stored (docs/ARCHITECTURE.md).
    tokenHash: text("token_hash").unique(),
    status: text("status").$type<InvitationStatus>().notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("household_invitations_household_id_idx").on(table.householdId),
    index("household_invitations_expires_at_idx").on(table.expiresAt),
    check("household_invitations_status_check", sql`${table.status} in ('pending', 'accepted', 'declined', 'revoked')`),
  ],
);
