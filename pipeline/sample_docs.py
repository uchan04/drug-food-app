#!/usr/bin/env python3
"""평가셋용 허가사항 문서 표본을 모은다.

데이터셋 전체(42,713건)는 허가일 오름차순이라 앞 페이지가 1957년 주사액이다.
경구약 주의사항이 필요하므로 전체를 긁는 대신 seed.ts 의 성분명으로 조회한다.
국내 제네릭은 제품명에 성분명이 들어가서 item_name 부분일치로 잡힌다.

성분당 호출 1회. 26회면 개발계정 한도(1,000/일)에 거의 영향이 없다.

제네릭마다 주의사항 문구가 달라서 품목 수를 늘리면 새 문구가 나온다.
성분당 3품목으로는 출처를 붙이지 못한 상호작용이 많았다.

    python3 sample_docs.py          # 수집 + docs.jsonl 생성
    python3 sample_docs.py --build  # 수집 생략, 기존 원본으로 docs.jsonl 만 다시 생성
"""

import json
import sys
from pathlib import Path

import fetch
import parse

# seed.ts 의 DRUGS 성분명. 제품명 검색어로 쓴다.
# 브랜드명만 유통되는 것(리피토/크레스토/타이레놀 등)은 성분명 제네릭도 함께 있어서
# 성분명으로 검색해도 잡힌다.
INGREDIENTS = [
    "리시노프릴", "에날라프릴", "암로디핀",
    "아토르바스타틴", "로수바스타틴", "심바스타틴",
    "독시사이클린", "미노사이클린", "시프로플록사신", "아목시실린",
    # 아세틸살리실산으로 조회하면 0건이다. 국내 제품명이 "아스피린"이라 성분명이 제품명에 없다.
    "이부프로펜", "아스피린", "아세트아미노펜", "나프록센",
    "알로푸리놀", "와파린",
    "메트포르민", "글리메피리드",
    "서트랄린", "플루옥세틴", "모클로베마이드",
    "레보티록신", "에소메프라졸", "알렌드로네이트", "세티리진",
]

# 식약처 표기가 seed.ts 와 다른 성분. 조회어만 바꾸고 디렉토리는 seed 이름을
# 유지한다. query_ingredient 가 seed 이름이어야 적재 때 성분이 매칭된다.
SEARCH_NAME = {
    # 식약처 표준명은 '설트랄린'이다. '서트랄린'으로 조회하면 0건, '설트랄린'은 21건.
    "서트랄린": "설트랄린",
}

# 국내 허가 품목이 없어서 식약처로는 출처를 붙일 수 없는 성분.
# 모클로베마이드: 조회어 4개(모클로베마이드/모클로베미드/오로릭스/아우로릭스) 모두 0건.
#                국내 시장에서 철수했다. seed 의 5행은 손으로 적은 상태로 남는다.
NO_MFDS = {"모클로베마이드"}

ENDPOINT = "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService08/getDrugPrdtPrmsnDtlInq08"

RAW = fetch.RAW_ROOT / "permit-eval"
DOCS = Path(__file__).parent / "data" / "docs.jsonl"
# ponytail: 성분당 품목 수. 호출은 성분당 1회로 그대로니 올려도 할당량은 같다.
# 올리면 제네릭 문구 다양성이 늘지만 라벨링할 새 문장도 늘어난다.
ROWS_PER_INGREDIENT = 20


def done_reason(name, term):
    """건너뛸 이유를 돌려준다. 다시 받아야 하면 None.

    받은 것을 또 호출하면 일일 할당량(1,000회)을 그냥 태운다. 첫 실행이 25개 중
    18개에서 타임아웃으로 죽어서 재시도가 필요했다.

    그런데 "파일이 있으면 건너뛰기" 로는 ROWS_PER_INGREDIENT 를 올려도 아무것도
    다시 받지 않는다. 받은 항목 수, 조회 가능한 총 건수, 조회어를 함께 본다.
    """
    d = RAW / name
    if not d.exists():
        return None

    terms, total = set(), None
    for m in d.glob("*/manifest.json"):
        j = json.loads(m.read_text())
        terms.add(j["params"].get("item_name"))
        if j.get("total_count") is not None:
            total = j["total_count"] if total is None else max(total, j["total_count"])

    if term not in terms:
        return None  # 조회어를 바꿨다 (서트랄린 -> 설트랄린). 다시 받는다
    if total is None:
        return None  # 지난 실행이 응답을 받기 전에 죽었다

    seqs = set()
    for p in d.glob("*/page_*.json"):
        for item in json.loads(p.read_text())["body"].get("items", []):
            seqs.add(item["ITEM_SEQ"])
    # 품목이 요청 수보다 적으면 다시 호출해도 더 나오지 않는다 (리시노프릴 1건).
    if len(seqs) >= min(ROWS_PER_INGREDIENT, total):
        return f"{len(seqs)}/{total}건 이미 받음"
    return None


def collect():
    """성분별로 1회씩 호출한다. 성분마다 dataset 이름을 달리해 run 디렉토리를 분리한다."""
    for name in INGREDIENTS:
        if name in NO_MFDS:
            print(f"  skip {name}: 국내 허가 품목 없음")
            continue
        term = SEARCH_NAME.get(name, name)
        reason = done_reason(name, term)
        if reason:
            print(f"  skip {name}: {reason}")
            continue
        try:
            fetch.fetch(
                f"permit-eval/{name}",
                ENDPOINT,
                {"item_name": term},
                rows=ROWS_PER_INGREDIENT,
                pages=1,
            )
        # 네트워크 타임아웃 하나가 나머지 성분 수집을 막아선 안 된다.
        except (SystemExit, Exception) as e:
            print(f"  skip {name}: {type(e).__name__}: {e}", file=sys.stderr)


def build():
    """원본 → docs.jsonl. 원본은 읽기만 하고, 파생물은 data/ 아래 따로 쓴다."""
    seen, docs = set(), []
    for page in sorted(RAW.glob("*/*/page_*.json")):
        ingredient = page.parts[-3]
        # totalCount 가 0 이면 body 에 items 키가 아예 없다.
        for item in json.loads(page.read_text())["body"].get("items", []):
            seq = item["ITEM_SEQ"]
            if seq in seen:
                continue
            seen.add(seq)
            docs.append({
                "item_seq": seq,
                "item_name": item["ITEM_NAME"],
                "query_ingredient": ingredient,
                "main_ingr": item.get("MAIN_ITEM_INGR"),
                "atc": item.get("ATC_CODE"),
                "cancel": item.get("CANCEL_NAME"),
                "nb": parse.doc_text(item.get("NB_DOC_DATA")),
                "ud": parse.doc_text(item.get("UD_DOC_DATA")),
                "source_page": str(page.relative_to(fetch.RAW_ROOT)),
            })
    DOCS.write_text("".join(json.dumps(d, ensure_ascii=False) + "\n" for d in docs), encoding="utf-8")
    nb = sum(1 for d in docs if d["nb"])
    print(f"{len(docs)} docs ({nb} with 주의사항) -> {DOCS}")
    return docs


if __name__ == "__main__":
    if "--build" not in sys.argv:
        collect()
    build()
