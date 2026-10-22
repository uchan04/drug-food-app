#!/usr/bin/env python3
"""평가셋용 허가사항 문서 표본을 모은다.

데이터셋 전체(42,713건)는 허가일 오름차순이라 앞 페이지가 1957년 주사액이다.
경구약 주의사항이 필요하므로 전체를 긁는 대신 seed.ts 의 성분명으로 조회한다.
국내 제네릭은 제품명에 성분명이 들어가서 item_name 부분일치로 잡힌다.

성분당 호출 1회. 26회면 개발계정 한도(1,000/일)에 거의 영향이 없다.

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

RAW = fetch.RAW_ROOT / "permit-eval"
DOCS = Path(__file__).parent / "data" / "docs.jsonl"
ROWS_PER_INGREDIENT = 3


def collect():
    """성분별로 1회씩 호출한다. 성분마다 dataset 이름을 달리해 run 디렉토리를 분리한다.

    이미 받은 성분은 건너뛴다. 재시도할 때 받은 것을 또 호출하면 일일 할당량을
    그냥 태운다 (첫 실행이 25개 중 18개에서 타임아웃으로 죽었다).
    """
    for name in INGREDIENTS:
        if any((RAW / name).glob("*/page_*.json")):
            continue
        try:
            fetch.fetch(
                f"permit-eval/{name}",
                "https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService08/getDrugPrdtPrmsnDtlInq08",
                {"item_name": name},
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
