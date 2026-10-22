-- 식약처 허가사항에서 추출한 상호작용은 한국어 원문만 있다.
-- 영문 번역과 부작용을 지어내는 것보다 비어 있는 것이 낫다.
ALTER TABLE "interactions" ALTER COLUMN "reason_en" DROP NOT NULL;
ALTER TABLE "interactions" ALTER COLUMN "side_effects_ko" DROP NOT NULL;
ALTER TABLE "interactions" ALTER COLUMN "side_effects_en" DROP NOT NULL;
