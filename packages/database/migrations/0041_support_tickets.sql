CREATE TABLE "support_tickets" (
  "id" uuid PRIMARY KEY NOT NULL,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "account_type" text NOT NULL,
  "subject" text NOT NULL,
  "category" text NOT NULL,
  "status" text NOT NULL DEFAULT 'open',
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);
CREATE INDEX "support_tickets_owner_updated_idx" ON "support_tickets" ("owner_user_id", "updated_at");
CREATE INDEX "support_tickets_status_updated_idx" ON "support_tickets" ("status", "updated_at");
CREATE TABLE "support_messages" (
  "id" uuid PRIMARY KEY NOT NULL,
  "ticket_id" uuid NOT NULL REFERENCES "support_tickets"("id") ON DELETE cascade,
  "author_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "author_role" text NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);
CREATE INDEX "support_messages_ticket_created_idx" ON "support_messages" ("ticket_id", "created_at");
