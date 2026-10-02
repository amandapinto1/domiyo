CREATE TABLE "agenda_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agenda_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"color" text NOT NULL,
	"source" text NOT NULL,
	"edited_manually" boolean DEFAULT false NOT NULL,
	"title" "bytea" NOT NULL,
	"type" "bytea",
	"location" "bytea",
	"teacher" "bytea",
	"content" "bytea",
	"notes" "bytea",
	"key_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agenda_items_source_check" CHECK ("agenda_items"."source" in ('imported', 'manual')),
	CONSTRAINT "agenda_items_color_check" CHECK ("agenda_items"."color" ~ '^#[0-9A-Fa-f]{6}$'),
	CONSTRAINT "agenda_items_time_check" CHECK ("agenda_items"."ends_at" > "agenda_items"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agenda_items_agenda_id_starts_at_idx" ON "agenda_items" USING btree ("agenda_id","starts_at");