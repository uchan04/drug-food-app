-- 상호작용 행의 출처를 기록한다.
-- 기존 행은 seed.ts 에 손으로 적힌 것이므로 'seed:manual' 로 라벨링된다.
-- 파이프라인이 실데이터로 덮어쓰면 source 가 데이터셋 이름으로 바뀐다.
ALTER TABLE "interactions" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'seed:manual';
ALTER TABLE "interactions" ADD COLUMN "source_url" TEXT;
ALTER TABLE "interactions" ADD COLUMN "fetched_at" TIMESTAMP(3);
