#!/usr/bin/env python3
"""손으로 적은 상호작용이 왜 출처를 못 얻었는지 분류한다.

"표본을 늘리면 출처 없는 행이 줄어드나"를 round 2, round 3 에서 두 번 손으로
따져 봤다. 매번 같은 계산을 다시 하지 않도록 스크립트로 고정한다. 새 표본을
받은 뒤 다시 돌려서 분류가 어떻게 움직이는지 보면 된다.

분류:
  A 문서 없음      그 성분의 국내 허가 품목이 0건이다. 표본의 문제가 아니다.
  B1 사전에 없음   그 음식을 추출 사전이 모른다. 사전에 넣으면 잡힐 수도 있다.
  B2 별칭으로 접힘  파이프라인이 그 음식을 다른 이름으로 센다 (맥주 -> 알코올).
                  일부러 그렇게 정한 것이라 이 행은 원래 출처를 못 얻는다.
  C 글자는 있음    원문에 그 말이 있는데 후보가 되지 못했다. 문장 분할·길이 문제다.
  D 말이 없음      그 성분 문서에 그 음식 얘기가 없다. 허가사항이 말하지 않는다.
  E 규칙이 음성    후보는 있는데 판정이 전부 음성이다.
  F 리뷰 거부      사람이 보고 거부했다. 판정이 끝난 행이다.

D 는 다시 둘로 나눈다. 그 말이 **코퍼스 전체에** 몇 번 나오는지가 다르다.
  D1 코퍼스 0회   허가사항이 아예 안 쓰는 말이다 (개별 식품명 대부분).
  D2 다른 약엔 있음  허가사항이 쓰는 말인데 이 약 문서에는 없다.

    python3 coverage.py        # 분류표 + 행별 사유
    python3 coverage.py --csv  # 행별 사유만 탭 구분으로
"""

import collections
import csv
import json
import re
import sys
from pathlib import Path

import extract
import normalize

HERE = Path(__file__).parent
DOCS = HERE / "data" / "docs.jsonl"
SEED = HERE.parent / "apps" / "api" / "prisma" / "seed.ts"
CURATED = HERE / "curated" / "interactions.json"
REVIEW = HERE / "eval" / "review.tsv"


def seed_rows():
    """seed.ts 의 (성분명, 음식명). 손으로 적은 행이 TS 안에만 있어서 읽어 온다.

    형식이 바뀌면 조용히 0건이 되지 않도록 센 개수를 함께 낸다.
    """
    s = SEED.read_text(encoding="utf-8")
    ing = dict(re.findall(r"id: '(i\d+)', nameKo: '([^']+)'", s))
    foods = dict(re.findall(r"id: '(f\d+)', nameKo: '([^']+)'", s))
    block = s[s.index("const INTERACTIONS"):s.index("async function main")]
    pairs = re.findall(r"ingredientId: '(i\d+)', foodId: '(f\d+)'", block)
    if not (ing and foods and pairs):
        raise SystemExit("seed.ts 를 읽지 못했다. 형식이 바뀌었는지 확인하세요.")
    return [(ing[i], foods[f]) for i, f in pairs]


def classify():
    sourced = {(r["ingredient"], r["food"])
               for r in json.loads(CURATED.read_text(encoding="utf-8"))["interactions"]}
    unsourced = [p for p in seed_rows() if p not in sourced]

    docs = collections.defaultdict(str)
    for line in DOCS.read_text(encoding="utf-8").splitlines():
        d = json.loads(line)
        docs[d["query_ingredient"]] += (d["nb"] or "") + "\n" + (d["ud"] or "")
    corpus = "\n".join(docs.values())

    with REVIEW.open(encoding="utf-8") as f:
        review = {(r["ingredient"], r["food"]): r.get("note", "")
                  for r in csv.DictReader(f, delimiter="\t")}

    # 음식명 -> 그 음식을 가리키는 표제어들. FOOD_ALIAS 로 접히는 이름까지 따라간다.
    surface = collections.defaultdict(list)
    for kw, food in extract.FOODS.items():
        surface[normalize.FOOD_ALIAS.get(food, food)].append(kw)

    out = []
    for ingredient, food in unsourced:
        text = docs.get(ingredient, "")
        kws = surface.get(food, [])
        if not text:
            out.append((ingredient, food, "A 문서 없음", "국내 허가 품목 0건"))
            continue
        if not kws:
            # 표제어는 있는데 다른 이름으로 접히는 경우와, 아예 모르는 음식을
            # 가른다. 앞은 우리가 정한 것이고 뒤는 사전을 더하면 될 수도 있다.
            folded = normalize.FOOD_ALIAS.get(extract.FOODS.get(food, ""), "")
            if folded and folded != food:
                out.append((ingredient, food, "B2 별칭으로 접힘",
                            f"파이프라인은 '{folded}' 로 센다"))
            else:
                out.append((ingredient, food, "B1 사전에 없음", "추출 사전에 없는 음식"))
            continue
        cands = [c for field in (text,) for c in extract.candidates(field)
                 if normalize.FOOD_ALIAS.get(c["food"], c["food"]) == food]
        if not cands:
            if any(k in text for k in kws):
                out.append((ingredient, food, "C 글자는 있음", "후보가 되지 못했다"))
            elif any(k in corpus for k in kws):
                hits = sum(corpus.count(k) for k in kws)
                out.append((ingredient, food, "D2 다른 약엔 있음", f"코퍼스 {hits}회"))
            else:
                out.append((ingredient, food, "D1 코퍼스 0회", "허가사항이 안 쓰는 말"))
            continue
        if not any(extract.judge(c["sentence"], c["keyword"]) for c in cands):
            out.append((ingredient, food, "E 규칙이 음성", f"후보 {len(cands)}건"))
        elif (ingredient, food) in review:
            out.append((ingredient, food, "F 리뷰 거부", review[(ingredient, food)][:60]))
        else:
            out.append((ingredient, food, "G 제안 누락", f"양성 {len(cands)}건인데 제안에 없다"))
    return out


if __name__ == "__main__":
    rows = classify()
    if "--csv" in sys.argv:
        for r in rows:
            print("\t".join(r))
    else:
        for ingredient, food, bucket, why in sorted(rows, key=lambda r: (r[2], r[0])):
            print(f"  [{bucket:14s}] {ingredient:12s} × {food:12s} {why}")
    print()
    counts = collections.Counter(r[2] for r in rows)
    for bucket, n in sorted(counts.items()):
        print(f"{bucket:16s} {n:3d}")
    print(f"{'합계':16s} {len(rows):3d}")
