CREATE TABLE "agenda_cronograms" (
	"agenda_id" uuid PRIMARY KEY NOT NULL,
	"pdf" "bytea" NOT NULL,
	"file_name" "bytea" NOT NULL,
	"key_version" integer NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pending_agenda_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agenda_id" uuid NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"pdf" "bytea" NOT NULL,
	"file_name" "bytea" NOT NULL,
	"schedule" "bytea" NOT NULL,
	"key_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "pending_agenda_imports_agenda_id_unique" UNIQUE("agenda_id")
);
--> statement-breakpoint
ALTER TABLE "agenda_items" ADD COLUMN "import_key" "bytea";--> statement-breakpoint
ALTER TABLE "agenda_cronograms" ADD CONSTRAINT "agenda_cronograms_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_agenda_imports" ADD CONSTRAINT "pending_agenda_imports_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_agenda_imports" ADD CONSTRAINT "pending_agenda_imports_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pending_agenda_imports_expires_at_idx" ON "pending_agenda_imports" USING btree ("expires_at");