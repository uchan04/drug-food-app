#!/usr/bin/env python3
"""docs.jsonl -> eval/candidates.tsv (라벨 칸이 빈 평가셋 틀).

라벨을 채운 결과는 eval/labels.tsv 로 저장하고 커밋한다. labels.tsv 는
문장을 그대로 담고 있어서 원본 데이터(gitignore 대상)나 API 키 없이도
score.py 가 돌아간다. 평가가 재현 가능해야 지표를 믿을 수 있다.
"""

import json
from pathlib import Path

import extract

DOCS = Path(__file__).parent / "data" / "docs.jsonl"
OUT = Path(__file__).parent / "eval" / "candidates.tsv"


def rows():
    """(문장, 음식) 중복을 제거한 후보.

    단위가 (문장, 키워드)가 아니라 (문장, 음식)인 이유는 Interaction 이
    (성분, 음식) 쌍이기 때문이다. "에탄올(알코올)"처럼 한 문장이 같은 음식을
    두 표제어로 가리키면 한 건으로 센다. 표제어는 더 구체적인(긴) 쪽을 남긴다.
    같은 주의사항 문구를 쓰는 제네릭이 많아서 중복 제거로 크게 줄어든다.
    """
    seen = {}
    for line in DOCS.read_text(encoding="utf-8").splitlines():
        d = json.loads(line)
        for field in ("nb", "ud"):
            for c in extract.candidates(d[field]):
                k = (c["sentence"], c["food"])
                if k not in seen or len(c["keyword"]) > len(seen[k]["keyword"]):
                    seen[k] = {**c, "ingredient": d["query_ingredient"]}
    return sorted(seen.values(), key=lambda r: (r["food"], r["sentence"]))


if __name__ == "__main__":
    # labels.tsv 와 같은 열 순서로 낸다. round 는 수집 회차, risk 는 위험도
    # 라벨이고 둘 다 사람이 채운다 (risk 는 label=1 행에만).
    out = ["label\tround\trisk\tkeyword\tfood\tingredient\tsentence"]
    for r in rows():
        out.append("\t".join(["", "", "", r["keyword"], r["food"], r["ingredient"],
                              r["sentence"].replace("\t", " ")]))
    OUT.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"{len(out)-1} rows -> {OUT}")
