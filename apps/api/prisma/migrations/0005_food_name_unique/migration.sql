-- Food.nameKo 에 유니크 제약을 건다.
--
-- 제약이 없어서 적재 스크립트가 nameKo 로 찾아본 뒤 없으면 만드는 구조였다.
-- seed 가 '알코올' 같은 음식을 안정적인 id(f037 등)로 만들기 시작하자,
-- 파이프라인이 과거에 uuid 로 만들어 둔 같은 이름의 행과 겹쳐 Food 가 두 행씩
-- 생겼다. 실제로 '알코올' 이 21행/19행으로 쪼개져 앱이 알코올을 두 번 보여줬다.
-- 이름이 Food 의 사실상 식별자이므로 DB 가 그것을 지켜야 한다.
--
-- 제약을 걸기 전에 기존 중복을 합친다. 순서가 중요하다.

-- 1) 같은 (성분, 음식이름) 에 행이 여러 개면 하나만 남긴다.
--    출처 있는 행을 손으로 적은 행보다 우선한다 — 출처를 붙이는 것이 이 작업의 목적이다.
--    먼저 지워야 2) 의 UPDATE 가 (ingredient_id, food_id) 유니크를 위반하지 않는다.
DELETE FROM "interactions" WHERE "id" IN (
  SELECT "id" FROM (
    SELECT i."id",
           ROW_NUMBER() OVER (
             PARTITION BY i."ingredient_id", f."name_ko"
             ORDER BY (i."source" <> 'seed:manual') DESC, i."created_at", i."id"
           ) AS rn
    FROM "interactions" i
    JOIN "foods" f ON f."id" = i."food_id"
  ) ranked WHERE rn > 1
);

-- 2) 남은 행을 이름별 대표 Food 로 옮긴다.
--    대표는 seed 가 쓰는 f0xx id 를 우선한다 (seed 가 Food 어휘의 주인이고
--    id 가 안정적이다). 그 다음은 먼저 만들어진 행.
UPDATE "interactions" i
SET "food_id" = c.keep_id
FROM "foods" f
JOIN (
  SELECT "name_ko",
         (ARRAY_AGG("id" ORDER BY ("id" ~ '^f[0-9]+$') DESC, "created_at", "id"))[1] AS keep_id
  FROM "foods" GROUP BY "name_ko"
) c ON c."name_ko" = f."name_ko"
WHERE i."food_id" = f."id" AND f."id" <> c.keep_id;

-- 3) 대표가 아닌 Food 를 지운다.
DELETE FROM "foods" f
USING (
  SELECT "name_ko",
         (ARRAY_AGG("id" ORDER BY ("id" ~ '^f[0-9]+$') DESC, "created_at", "id"))[1] AS keep_id
  FROM "foods" GROUP BY "name_ko"
) c
WHERE f."name_ko" = c."name_ko" AND f."id" <> c.keep_id;

CREATE UNIQUE INDEX "foods_name_ko_key" ON "foods"("name_ko");
