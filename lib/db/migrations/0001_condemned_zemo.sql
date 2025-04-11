CREATE TABLE IF NOT EXISTS "Benchmark" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"officialName" text NOT NULL,
	"inputPriceMillionToken" text NOT NULL,
	"provider" text NOT NULL,
	"outputPriceMillionToken" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserModels" (
	"user_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"api_key" varchar(255),
	CONSTRAINT "UserModels_user_id_model_id_pk" PRIMARY KEY("user_id","model_id")
);
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "benchmarkId" uuid;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN "modelId" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserModels" ADD CONSTRAINT "UserModels_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserModels" ADD CONSTRAINT "UserModels_model_id_Models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."Models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_benchmarkId_Benchmark_id_fk" FOREIGN KEY ("benchmarkId") REFERENCES "public"."Benchmark"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_modelId_Models_id_fk" FOREIGN KEY ("modelId") REFERENCES "public"."Models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
