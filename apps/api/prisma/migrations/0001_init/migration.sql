-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('email', 'google', 'kakao');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ko', 'en');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('caution', 'warning', 'contraindicated');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT,
    "provider" "AuthProvider" NOT NULL DEFAULT 'email',
    "provider_id" TEXT,
    "language" "Language" NOT NULL DEFAULT 'ko',
    "refresh_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drugs" (
    "id" TEXT NOT NULL,
    "name_ko" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description_ko" TEXT,
    "description_en" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_ingredients" (
    "id" TEXT NOT NULL,
    "drug_id" TEXT NOT NULL,
    "name_ko" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "drug_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "name_ko" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "nutrients" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "reason_ko" TEXT NOT NULL,
    "reason_en" TEXT NOT NULL,
    "side_effects_ko" TEXT NOT NULL,
    "side_effects_en" TEXT NOT NULL,
    "time_gap_hours" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_box_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "drug_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_box_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_provider_id_key" ON "users"("provider", "provider_id");

-- CreateIndex
CREATE INDEX "drug_ingredients_drug_id_idx" ON "drug_ingredients"("drug_id");

-- CreateIndex
CREATE INDEX "interactions_ingredient_id_idx" ON "interactions"("ingredient_id");

-- CreateIndex
CREATE INDEX "interactions_food_id_idx" ON "interactions"("food_id");

-- CreateIndex
CREATE UNIQUE INDEX "interactions_ingredient_id_food_id_key" ON "interactions"("ingredient_id", "food_id");

-- CreateIndex
CREATE INDEX "medicine_box_items_user_id_idx" ON "medicine_box_items"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_box_items_user_id_drug_id_key" ON "medicine_box_items"("user_id", "drug_id");

-- AddForeignKey
ALTER TABLE "drug_ingredients" ADD CONSTRAINT "drug_ingredients_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "drug_ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_box_items" ADD CONSTRAINT "medicine_box_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_box_items" ADD CONSTRAINT "medicine_box_items_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.9.0 -> 7.9.1                        │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
