CREATE TABLE "tentativas" (
	"chave" text PRIMARY KEY NOT NULL,
	"n" integer NOT NULL,
	"ate" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tentativas_ate_idx" ON "tentativas" USING btree ("ate");