# 약-음식 상호작용 체커

복용 중인 약과 음식의 상호작용을 조회하는 웹 애플리케이션. **식약처 의약품
허가정보에서 상호작용 문장을 추출해 출처와 함께 적재하고, 그 추출 품질을
평가셋으로 측정한다.**

처음에는 손으로 적은 출처 없는 상호작용 72행을 조회하는 CRUD 앱이었다. 지금은
118행 중 76행에 품목기준코드가 붙어 있고, 화면에서 식약처 원문 페이지로 넘어갈 수 있다.

## 측정값

숫자가 이 프로젝트의 결과물이다. 전부 커밋된 평가셋으로 재현된다.

| 대상 | 베이스라인 | 규칙 | 평가셋 |
|---|---|---|---|
| 상호작용 문장 추출 | 정밀도 0.342 | **0.869** / 재현율 0.998 | 라벨 1,204건 (3회차) |
| 위험도(배지) 판정 | — | 정확도 **0.966**, 격상 정밀도 1.000 / 재현율 0.745 | 양성 412건 |
| 약품 검색 랭킹 | R@1 0.782 | **R@1 1.000** | 110쿼리 6유형 |
| 자동완성 | R@1 0.936 | **R@1 1.000** | 같은 평가셋 |

- 추출은 **제안까지만** 한다. 사람 판정(`pipeline/eval/review.tsv`)을 거친 것만 적재한다.
  제안 96건 중 76건 승인(79%).
- 회차별로 **규칙을 고정한 뒤 라벨**해서 처음 보는 제조사 문구에서의 성능을 쟀다.
  round 3 고정 상태 정밀도는 0.768 이었다 — 표본을 키우면 떨어진다.
- 측정 방법과 한계는 [`pipeline/README.md`](pipeline/README.md) 에 전부 적어 뒀다.

## 구성

| | |
|---|---|
| `apps/api` | NestJS 10 · Prisma 5 · PostgreSQL 15 + `pg_trgm` (포트 4000) |
| `apps/web` | Next.js 14 App Router · Tailwind · TanStack Query (포트 3000) |
| `packages/shared-types` | 두 앱이 공유하는 타입 |
| `pipeline` | 식약처 수집·추출·평가. 표준 라이브러리만 쓰는 Python |
| 빌드 | pnpm workspaces + Turborepo |

## 로컬 실행

```sh
pnpm install
docker compose up -d                        # PostgreSQL 15 (컨테이너 drug-food-checker-db)
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy # 0001~0005
pnpm --filter api exec prisma db seed        # 약 26 / 음식 41 / 손으로 적은 상호작용 53
pnpm --filter api load:interactions          # 식약처 추출분 76행 적재
pnpm dev                                    # http://localhost:3000
```

`apps/api/.env` 에 `DATABASE_URL` 과 `JWT_SECRET` 이 필요하다. 웹은
`NEXT_PUBLIC_API_URL` 이 없으면 `http://localhost:4000` 을 쓴다.

적재까지 하면 상호작용 **118행**(출처 있음 76 / 손으로 적음 42)이 된다.
`load:interactions` 는 커밋된 `pipeline/curated/interactions.json` 만 읽으므로
**API 키도 원본 데이터도 필요 없다.** CI 에서도 같은 경로로 돈다.

## 측정 돌려보기

```sh
cd pipeline
python3 score.py           # 추출 정밀도/재현율 (분할·회차별)
python3 score.py --risk    # 위험도 정확도 / 격상 정밀도·재현율 + 혼동행렬
python3 score.py --check   # 하한 미달이면 0 이 아닌 코드로 종료 (CI 가 이걸 돌린다)

cd ../ && pnpm --filter api eval:search -- --check   # 검색 랭킹 (DB 필요)
```

`eval/*.tsv` 가 문장을 그대로 담고 있어서 **원본 데이터도 API 키도 없이** 재현된다.

## 새 표본을 받으려면 (round 4 이상)

원본 데이터(`pipeline/data/`)는 gitignore 대상이라 저장소에 없다. 다시 받아야 한다.

```sh
# pipeline/.env.local 에 공공데이터포털 일반 인증키(Decoding)를 넣는다
#   export DATA_GO_KR_KEY='...'
cd pipeline
set -a; . ./.env.local; set +a
python3 sample_docs.py     # 성분당 1회 호출(24회). 받은 양을 세서 건너뛴다
```

- 인증키는 **대화·커밋·로그에 남기지 않는다.** 저장소가 public 이다.
- 개발계정 한도는 1,000회/일. `ROWS_PER_INGREDIENT` 를 올려도 호출 수는 그대로다.
- 받은 뒤 `make_labelset.py` → 라벨링 → `normalize.py` → `review.py` 순서다.
  자세한 절차는 `pipeline/README.md` 의 "평가셋" 절.

## 다음에 할 일

| 항목 | 상태 |
|---|---|
| **`"피하는 것이 바람직"` 표지 누락** | 위험도 과소평가 14건 중 **13건이 이것 하나**. 그런데 13건 전부 test 분할이고 round 3 을 받아도 dev 에 안 나왔다. 표지를 더하면 test 숫자가 거짓이 된다 → **성분 단위 분할 방식 자체를 다시 볼 문제** |
| **범주 ↔ 개별 식품 매핑** | "비타민 K 함유 식품" → 시금치·케일. 출처 없는 42행 중 34행이 여기 걸려 있다. 표본을 4배로 늘려도 안 줄어든다는 것이 두 회차에서 측정됐다 |
| 불릿 목록 문장 분할 | `extract.sentences` 가 `- ` 목록을 끊지 못한다. 고치면 라벨 1,204건 재작업이 따라온다 |
| 초성·영타 검색 | `ㅌㅇㄹㄴ`, `xkdlfpsnf`. trigram 으로 안 잡힌다 |
| `develop` → `main` 병합 | `develop` 이 25커밋 앞서 있다 |

## 한계

의료 정보 보조 도구다. 복용 판단은 의사·약사와 상의해야 한다.

- 적재 118행 중 **42행은 출처가 없다**(손으로 적은 행). 화면에 "출처 미확인"으로 표시한다.
- 출처를 붙이면서 **17쌍의 위험도가 내려갔다**(예: 아세트아미노펜 × 알코올 `금기`→`주의`).
  허가사항 원문이 그렇게 쓰여 있고, 배지를 원문보다 높이면 **보여주는 문장과 어긋난다.**
  문장에 맞추는 쪽을 택했다. 자세한 사정은 `pipeline/README.md` 의 "한계" 절.
- 영문 번역과 부작용은 식약처 허가사항에 없어서 추출 행에는 비어 있다. 지어내지 않는다.
