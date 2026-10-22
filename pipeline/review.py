#!/usr/bin/env python3
"""제안(proposals.json)에 사람의 판정을 적용해 적재할 상호작용을 만든다.

추출 정밀도가 0.822 다. 그대로 적재하면 의료 정보의 약 18%가 틀린다.
자동 추출은 제안까지만 하고, eval/review.tsv 의 판정을 거친 것만 내보낸다.

판정 기준 두 가지를 모두 만족해야 ok 다.
  1. 그 (성분, 음식) 쌍이 실제 상호작용인가
  2. 대표 문장이 그것을 뒷받침하는가 — 사용자에게 이 문장이 그대로 보인다

2번만 틀린 경우(쌍은 맞는데 문장이 엉뚱한 경우)는 거부하지 않고 pick 으로
근거를 교체한다. 거부하면 알렌드로네이트-음식처럼 임상적으로 가장 중요한
상호작용을 잃는다.

판정이 없는 제안이 있으면 에러로 멈춘다. 새 데이터를 받았을 때 리뷰되지
않은 행이 조용히 적재되는 것을 막는다.

pick 은 ok 행에 필수다. 리뷰어가 "본 문장"을 고정하는 역할이다. (성분, 음식)
으로만 키를 잡으면 근거 선택 규칙을 고쳤을 때 승인이 조용히 다른 문장에
따라붙는다. 실제로 메트포르민-음식이 그렇게 "수술" 문장으로 바뀌었다.

pick 이 여러 문장에 걸리면, 그 문장들이 공백·구두점만 다른 같은 문장일 때만
통과시킨다. 제네릭은 같은 주의사항을 제조사별로 띄어쓰기와 괄호 표기만 바꿔
쓴다("투여시"/"투여 시", "(예, 우유"/"(예 : 우유"). 표본을 성분당 3품목에서
20품목으로 늘리자 승인 21건의 pick 이 이런 변형 때문에 중복으로 걸렸다.
내용이 다른 문장에 걸리면 그대로 멈춘다 — 그게 막으려던 사고다.

    python3 review.py          # curated/interactions.json 생성
    python3 review.py --demo   # 자체 점검
"""

import json
import re
import sys
from pathlib import Path

import normalize

HERE = Path(__file__).parent
PROPOSALS = HERE / "curated" / "proposals.json"
DECISIONS = HERE / "eval" / "review.tsv"
OUT = HERE / "curated" / "interactions.json"


# 공백과 구두점을 지운 비교용 형태. 제조사별 표기 차이만 지우고 글자는 남긴다.
_COSMETIC = re.compile(r"[\s·ㆍ:,()\[\]{}'\"‘’“”]+")


def same_text(a, b):
    return _COSMETIC.sub("", a) == _COSMETIC.sub("", b)


def load_decisions(path=DECISIONS):
    rows = {}
    for line in path.read_text(encoding="utf-8").splitlines()[1:]:
        if not line.strip():
            continue
        cols = (line.split("\t") + ["", "", "", "", ""])[:5]
        decision, ingredient, food, pick, note = (c.strip() for c in cols)
        rows[(ingredient, food)] = {"decision": decision, "pick": pick, "note": note}
    return rows


def apply(proposals, decisions):
    """(적재할 것, 거부한 것). 판정 누락이나 pick 불일치는 에러다."""
    missing = [(p["ingredient"], p["food"]) for p in proposals
               if (p["ingredient"], p["food"]) not in decisions]
    if missing:
        raise SystemExit(
            f"판정이 없는 제안 {len(missing)}건. eval/review.tsv 에 추가하세요:\n  "
            + "\n  ".join(f"{i}\t{f}" for i, f in missing)
        )

    keep, drop = [], []
    for p in proposals:
        d = decisions[(p["ingredient"], p["food"])]
        if d["decision"] != "ok":
            drop.append({**p, "note": d["note"]})
            continue
        if not d["pick"]:
            raise SystemExit(
                f"pick 이 비어 있다: {p['ingredient']}/{p['food']}. "
                "승인한 근거 문장의 접두어를 적어야 한다."
            )
        hit = [e for e in p["evidence"] if e[0].startswith(d["pick"])]
        if not hit:
            # 조용히 기본 문장을 쓰면 리뷰어가 승인한 근거가 사라진다.
            raise SystemExit(
                f"pick 이 0건 일치: {p['ingredient']}/{p['food']} <- {d['pick']!r}"
            )
        if not all(same_text(hit[0][0], h[0]) for h in hit[1:]):
            raise SystemExit(
                f"pick 이 내용이 다른 {len(hit)}개 문장에 걸렸다: "
                f"{p['ingredient']}/{p['food']} <- {d['pick']!r}\n  "
                + "\n  ".join(h[0][:120] for h in hit)
                + "\n접두어를 더 길게 적어 하나만 고르세요."
            )
        sentence, keyword = hit[0]
        row = dict(p)
        row["reasonKo"] = sentence
        row["keyword"] = keyword
        # 보여줄 문장에서 위험도를 다시 계산한다. 제안의 riskLevel 은 순위 1위
        # 문장 기준이라, pick 으로 다른 문장을 고르면 배지와 설명이 어긋난다.
        row["riskLevel"] = normalize.risk_level(sentence, keyword)
        row["note"] = d["note"]
        row.pop("evidence", None)
        keep.append(row)
    return keep, drop


def demo():
    props = [
        {"ingredient": "심바스타틴", "food": "자몽주스", "reasonKo": "자몽주스를 섭취하지 않도록 한다",
         "riskLevel": "warning",
         "evidence": [["자몽주스를 섭취하지 않도록 한다", "자몽주스"]]},
        {"ingredient": "글리메피리드", "food": "설탕", "reasonKo": "저혈당에 설탕을 섭취한다",
         "riskLevel": "caution",
         "evidence": [["저혈당에 설탕을 섭취한다", "설탕"]]},
        {"ingredient": "알렌드로네이트", "food": "음식(일반)", "reasonKo": "식도질환 증상이 나타나면",
         "riskLevel": "caution",
         "evidence": [["식도질환 증상이 나타나면", "음식물"],
                      ["30분 이내 음식물을 섭취하면 흡수가 저하된다", "음식물"]]},
    ]
    dec = {
        ("심바스타틴", "자몽주스"): {"decision": "ok", "pick": "자몽주스를", "note": ""},
        ("글리메피리드", "설탕"): {"decision": "no", "pick": "", "note": "저혈당 처치"},
        ("알렌드로네이트", "음식(일반)"): {"decision": "ok", "pick": "30분 이내", "note": "근거 교체"},
    }
    keep, drop = apply(props, dec)
    assert [k["ingredient"] for k in keep] == ["심바스타틴", "알렌드로네이트"]
    assert [d["ingredient"] for d in drop] == ["글리메피리드"]
    # pick 이 적용되어야 한다
    assert keep[1]["reasonKo"] == "30분 이내 음식물을 섭취하면 흡수가 저하된다"
    # 위험도는 교체한 문장에서 다시 계산한다 (제안의 riskLevel 을 그대로 쓰면 안 된다)
    assert keep[0]["riskLevel"] == normalize.risk_level(
        "자몽주스를 섭취하지 않도록 한다", "자몽주스") == "warning"
    # evidence 는 적재물에 남기지 않는다
    assert "evidence" not in keep[0]

    # pick 이 비면 멈춘다. 근거를 고정하지 않으면 승인이 다른 문장에 따라붙는다.
    try:
        apply(props[:1], {("심바스타틴", "자몽주스"): {"decision": "ok", "pick": "", "note": ""}})
        raise AssertionError("빈 pick 이 통과했다")
    except SystemExit as e:
        assert "pick 이 비어 있다" in str(e), e

    # 판정 누락은 조용히 넘어가면 안 된다
    try:
        apply(props, {k: v for k, v in dec.items() if k[0] != "심바스타틴"})
        raise AssertionError("판정 누락이 통과했다")
    except SystemExit as e:
        assert "판정이 없는 제안 1건" in str(e), e

    # pick 이 안 맞으면 조용히 기본값을 쓰지 않고 멈춘다
    try:
        apply(props[2:], {("알렌드로네이트", "음식(일반)"):
                          {"decision": "ok", "pick": "없는문장", "note": ""}})
        raise AssertionError("pick 불일치가 통과했다")
    except SystemExit as e:
        assert "pick 이 0건 일치" in str(e), e

    # 공백·구두점만 다른 제조사 변형은 통과한다 (첫 번째를 쓴다)
    var = [{"ingredient": "로수바스타틴", "food": "알코올", "reasonKo": "", "riskLevel": "caution",
            "evidence": [["이 약은 알코올 과다 섭취 시 주의해야 한다.", "알코올"],
                         ["이 약은 알코올 과다 섭취 시 주의 해야 한다.", "알코올"]]}]
    keep, _ = apply(var, {("로수바스타틴", "알코올"):
                          {"decision": "ok", "pick": "이 약은 알코올", "note": ""}})
    assert keep[0]["reasonKo"] == var[0]["evidence"][0][0], keep

    # 내용이 다른 문장에 걸리면 멈춘다
    two = [{"ingredient": "심바스타틴", "food": "자몽주스", "reasonKo": "", "riskLevel": "caution",
            "evidence": [["이 약과 자몽주스를 병용하면 혈장 농도가 증가한다.", "자몽주스"],
                         ["이 약과 자몽주스를 병용하면 혈중 농도가 증가한다.", "자몽주스"]]}]
    try:
        apply(two, {("심바스타틴", "자몽주스"):
                    {"decision": "ok", "pick": "이 약과 자몽주스를", "note": ""}})
        raise AssertionError("내용이 다른 중복이 통과했다")
    except SystemExit as e:
        assert "내용이 다른 2개 문장" in str(e), e
    print("ok review")


if __name__ == "__main__":
    if "--demo" in sys.argv:
        demo()
    else:
        props = json.loads(PROPOSALS.read_text(encoding="utf-8"))
        keep, drop = apply(props, load_decisions())
        # seed 에 없는 음식은 load 단계가 만들어야 한다. 실제로 쓰인 것만 내보낸다.
        used = {k["food"] for k in keep}
        foods = [
            {"nameKo": n, "nameEn": en, "category": cat, "nutrients": nut}
            for n, (en, cat, nut) in normalize.NEW_FOODS.items() if n in used
        ]
        OUT.write_text(
            json.dumps({"foods": foods, "interactions": keep}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        from collections import Counter
        print(f"제안 {len(props)} -> 적재 {len(keep)} / 거부 {len(drop)} "
              f"(승인율 {len(keep)/len(props)*100:.0f}%)")
        print("  위험도:", dict(Counter(k["riskLevel"] for k in keep)))
        print(f"  새 Food {len(foods)}개:", ", ".join(f["nameKo"] for f in foods))
        print(f"  -> {OUT}")
        if drop:
            print("\n거부:")
            for d in drop:
                print(f"  {d['ingredient']}/{d['food']}: {d['note']}")
