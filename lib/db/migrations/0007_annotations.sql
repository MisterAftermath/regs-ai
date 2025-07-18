CREATE TABLE IF NOT EXISTS "Annotation" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" varchar(100),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Annotation_pkey" PRIMARY KEY("id")
);
DO $$ BEGIN
 ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
CREATE INDEX IF NOT EXISTS "idx_annotation_user" ON "Annotation" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "idx_annotation_active" ON "Annotation" USING btree ("userId","isActive"); 