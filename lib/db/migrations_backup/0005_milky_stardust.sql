CREATE TABLE IF NOT EXISTS "Prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"userId" uuid NOT NULL,
	"prompt" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "promptId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Prompts" ADD CONSTRAINT "Prompts_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_promptId_Prompts_id_fk" FOREIGN KEY ("promptId") REFERENCES "public"."Prompts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
