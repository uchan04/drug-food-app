-- pg_trgm 확장과 GIN 인덱스. 원래 seed.ts 에 있었다.
-- seed 는 개발용 샘플 데이터이므로, 운영에서 migrate deploy 만 돌리고 seed 를 건너뛰면
-- similarity() 함수가 없어 drug search/autocomplete 가 전부 500 이 됐다.
-- 스키마 객체는 마이그레이션에 둔다.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_drugs_name_ko_trgm ON drugs USING GIN (name_ko gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_drugs_name_en_trgm ON drugs USING GIN (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ingredients_name_ko_trgm ON drug_ingredients USING GIN (name_ko gin_trgm_ops);
-- seed 에는 없었다. autocomplete() 가 drug_ingredients.name_en 에도 similarity() 를 걸어서
-- 영문 성분명 검색만 인덱스 없이 풀스캔이었다.
CREATE INDEX IF NOT EXISTS idx_ingredients_name_en_trgm ON drug_ingredients USING GIN (name_en gin_trgm_ops);
