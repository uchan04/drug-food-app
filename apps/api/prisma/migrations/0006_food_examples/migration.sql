-- 범주 음식(비타민K, 야채)에 대표 식품을 붙인다. 개별 음식은 빈 배열이다.
ALTER TABLE "foods" ADD COLUMN "examples" TEXT[] NOT NULL DEFAULT '{}';
