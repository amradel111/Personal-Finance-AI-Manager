-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM "users"
)
UPDATE "users"
SET "phone" = CONCAT('+199900000', LPAD(numbered.rn::text, 3, '0'))
FROM numbered
WHERE "users"."id" = numbered.id AND "users"."phone" IS NULL;

ALTER TABLE "users"
ALTER COLUMN "phone" SET NOT NULL;

ALTER TABLE "users"
ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");
