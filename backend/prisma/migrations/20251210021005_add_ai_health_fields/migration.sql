-- AlterTable
ALTER TABLE "monthly_expenses" ADD COLUMN     "ai_forecast_next_month" DOUBLE PRECISION,
ADD COLUMN     "ai_forecast_trend" TEXT,
ADD COLUMN     "ai_health_category" TEXT,
ADD COLUMN     "ai_health_score" INTEGER,
ADD COLUMN     "ai_processed_at" TIMESTAMP(3);
