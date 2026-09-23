CREATE TABLE "categorias" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"nome" text NOT NULL,
	"ordem" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categorias_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "contas" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"sub" text DEFAULT '' NOT NULL,
	"banco" text,
	"saldo" numeric(14, 2),
	"ultimo_extrato" text,
	"limite" numeric(14, 2),
	"fatura_atual" numeric(14, 2),
	"fechamento" date,
	"vencimento" date,
	"ordem" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "contas_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "importacoes" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"arquivo" text NOT NULL,
	"conta_id" text NOT NULL,
	"data" date NOT NULL,
	"total" integer NOT NULL,
	"ignorados" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "importacoes_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "lancamentos" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"data" date NOT NULL,
	"descricao_original" text DEFAULT '' NOT NULL,
	"descricao" text NOT NULL,
	"estabelecimento" text DEFAULT '' NOT NULL,
	"valor" numeric(14, 2) NOT NULL,
	"conta_id" text NOT NULL,
	"categoria_id" text,
	"tipo" text,
	"pix_pessoa_fisica" boolean,
	"parcela_atual" integer,
	"parcela_total" integer,
	"compartilhado" boolean DEFAULT false NOT NULL,
	"importacao_id" text,
	"origem" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lancamentos_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "orcamentos" (
	"user_id" uuid NOT NULL,
	"categoria_id" text NOT NULL,
	"limite" numeric(14, 2) NOT NULL,
	CONSTRAINT "orcamentos_user_id_categoria_id_pk" PRIMARY KEY("user_id","categoria_id")
);
--> statement-breakpoint
CREATE TABLE "perfis" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"prefs" jsonb NOT NULL,
	"grupo" jsonb,
	"resumo_ia" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regras" (
	"user_id" uuid NOT NULL,
	"id" text NOT NULL,
	"estabelecimento" text NOT NULL,
	"categoria_id" text NOT NULL,
	"origem" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regras_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contas" ADD CONSTRAINT "contas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importacoes" ADD CONSTRAINT "importacoes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lancamentos" ADD CONSTRAINT "lancamentos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "perfis" ADD CONSTRAINT "perfis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regras" ADD CONSTRAINT "regras_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lancamentos_user_data_idx" ON "lancamentos" USING btree ("user_id","data");--> statement-breakpoint
CREATE INDEX "lancamentos_user_conta_idx" ON "lancamentos" USING btree ("user_id","conta_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");