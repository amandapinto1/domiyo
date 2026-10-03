CREATE TABLE "agenda_item_agendas" (
	"agenda_item_id" uuid NOT NULL,
	"agenda_id" uuid NOT NULL,
	CONSTRAINT "agenda_item_agendas_agenda_item_id_agenda_id_pk" PRIMARY KEY("agenda_item_id","agenda_id")
);
--> statement-breakpoint
ALTER TABLE "agenda_item_agendas" ADD CONSTRAINT "agenda_item_agendas_agenda_item_id_agenda_items_id_fk" FOREIGN KEY ("agenda_item_id") REFERENCES "public"."agenda_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_item_agendas" ADD CONSTRAINT "agenda_item_agendas_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agenda_item_agendas_agenda_id_idx" ON "agenda_item_agendas" USING btree ("agenda_id");