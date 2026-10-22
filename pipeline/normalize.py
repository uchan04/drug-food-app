#!/usr/bin/env python3
"""판정된 문장을 (성분, 음식) 상호작용 제안으로 정규화한다.

적재하지 않는다. 제안만 만든다. 추출 정밀도가 0.822 라서 그대로 넣으면
의료 정보의 약 18%가 틀린다. 사람이 확인한 것만 들어간다 (review.py).

DB 를 직접 건드리지 않는 이유는 두 가지다. pipeline 은 표준 라이브러리만
쓰므로 postgres 드라이버가 없고, Prisma 쪽에 이미 타입이 있으니 적재는
apps/api 에서 한다. 여기서는 JSON 까지만 만든다.

    python3 normalize.py          # data/docs.jsonl -> curated/proposals.json
    python3 normalize.py --demo   # 자체 점검
"""

import json
import re
import sys
from pathlib import Path

import extract

DOCS = Path(__file__).parent / "data" / "docs.jsonl"
OUT = Path(__file__).parent / "curated" / "proposals.json"
ENDPOINT = ("https://apis.data.go.kr/1471000/DrugPrdtPrmsnInfoService08"
            "/getDrugPrdtPrmsnDtlInq08")

# 조회에 쓴 검색어 -> seed.ts 의 DrugIngredient.nameKo
# 대부분 일치하지만 아스피린은 제품명이고 성분명은 아세틸살리실산이다.
# 와파린은 seed 에 "와파린"과 "와파린 나트륨" 두 성분으로 들어 있다.
INGREDIENT_ALIAS = {
    "아스피린": ["아세틸살리실산"],
    "와파린": ["와파린", "와파린 나트륨"],
}

# extract 의 정규화된 음식명 -> seed.ts 의 Food.nameKo
# 왼쪽에만 있는 것은 load 단계에서 Food 행을 새로 만든다.
FOOD_ALIAS = {
    "알코올 (맥주)": "알코올 (맥주)",
    "알코올 (와인)": "알코올 (와인)",
}

# seed 에 없어서 새로 만들어야 하는 Food 행. category 는 seed 의 분류를 따른다.
# load 단계가 nameKo 로 찾아보고 없으면 만든다 (Food.nameEn 이 필수라 함께 둔다).
NEW_FOODS = {
    "알코올": ("Alcohol", "음료", ["에탄올"]),
    "과일주스": ("Fruit Juice", "음료", ["당류", "비타민C"]),
    "설탕": ("Sugar", "기타", ["당류"]),
    "야채": ("Vegetables", "채소", ["비타민K", "식이섬유"]),
    "지방": ("Dietary Fat", "기타", ["지방"]),
    "음식(일반)": ("Food (general)", "기타", []),
    "칼슘": ("Calcium", "보충제", ["칼슘"]),
    "마그네슘": ("Magnesium", "보충제", ["마그네슘"]),
    "알루미늄": ("Aluminium", "보충제", ["알루미늄"]),
    "아연": ("Zinc", "보충제", ["아연"]),
    "철분": ("Iron", "보충제", ["철분"]),
    "비타민K": ("Vitamin K", "보충제", ["비타민K"]),
    "세인트존스워트": ("St. John\'s Wort", "건강기능식품", ["하이퍼리신"]),
}

# 위험도. 허가사항의 어투를 그대로 쓴다.
# 순서가 중요하다. 위에서부터 먼저 걸린 것이 이긴다.
# ponytail: 규칙 기반이고 정확도를 아직 측정하지 않았다. riskLevel 라벨을
# 평가셋에 추가하면 측정할 수 있다. 그때까지는 보수적으로 caution 이 기본이다.
RISK_RULES = (
    ("contraindicated", ("투여하지 말 것", "투여해서는 안", "병용하지 않는다", "금기",
                         "병용투여를 피한다", "함께 투여하지 않는다", "복용하지 않는다")),
    ("warning", ("피해야", "피한다", "권고되지 않", "병용하지 않는 것이 바람직",
                 "투여하지 않는 것이 바람직", "섭취하지 않도록", "중지", "삼가")),
)


# 위험도를 판정할 때 보는 키워드 주변 범위.
# 문장 전체를 보면 음식과 무관한 경고어가 위험도를 올린다. 실제로 메트포르민
# 알코올이 "간질환 환자에게는 투여를 피해야 한다"의 "피해야" 때문에 warning
# 으로 올라갔다. 경고어가 그 음식에 대한 것인지는 거리로 거른다.
RISK_WINDOW = 80


def risk_level(sentence, keyword=None):
    """경고 어투로 위험도를 매긴다. keyword 를 주면 그 주변만 본다."""
    scope = sentence
    if keyword:
        hits = [m for m in re.finditer(re.escape(keyword), sentence)]
        if hits:
            scope = " ".join(
                sentence[max(0, m.start() - RISK_WINDOW): m.end() + RISK_WINDOW] for m in hits
            )
    for level, markers in RISK_RULES:
        if any(m in scope for m in markers):
            return level
    return "caution"


_ORDER = {"contraindicated": 0, "warning": 1, "caution": 2}

# 상호작용의 기전·결과를 서술하는 표현. 사용자에게 보여줄 문장은 "무슨 일이
# 일어나는지"를 말해야 한다. 길이나 키워드 위치로는 이걸 못 고른다. 실제로
# 길이 기준은 약물 나열 문장을, 위치 기준은 "9) 알코올을 복용한 사람" 같은
# 토막 항목을 뽑았다.
EFFECT_TERMS = (
    "흡수", "혈중 농도", "혈장 농도", "혈청 농도", "AUC", "Cmax", "대사", "반감기",
    "청소율", "생체이용률", "저해", "억제", "증가", "감소", "저하", "상승", "연장",
    "지연", "작용", "독성", "위험", "악화", "방해", "결합",
)


# 밀도를 계산할 때의 길이 하한. 이보다 짧아도 이 길이로 센다.
# 없으면 "흡수가 감소한다" 같은 짧은 토막이 밀도를 독차지한다.
_MIN_LEN = 60


def informativeness(sentence):
    """기전·결과 표현의 밀도.

    개수가 아니라 밀도인 이유는, 약물을 수백 자 나열한 문장도 개수로는
    높게 나오기 때문이다(로수바스타틴 제산제에서 실제로 그랬다).
    밀도로 보면 짧고 초점 있는 문장이 이긴다.
    """
    hits = sum(1 for t in EFFECT_TERMS if t in sentence)
    return hits / max(len(sentence), _MIN_LEN)


def _sort_key(pair):
    """근거 문장의 우선순위.

    1. 위험도가 높은 것. 약한 문구를 골라 위험을 낮춰 보여주면 안 된다.
    2. 기전·결과 표현의 밀도가 높은 것. 이 문장이 사용자에게 보이는 설명이다.
    3. 긴 것. 밀도가 같으면(특히 둘 다 0이면) 맥락이 더 있는 쪽.
       "9) 알코올을 복용한 사람" 같은 토막이 뽑히는 것을 막는다.
    """
    sent, kw = pair
    return (_ORDER[risk_level(sent, kw)], -informativeness(sent), -len(sent), sent)


def best(pairs):
    """한 (성분, 음식) 쌍의 대표 (문장, 키워드)."""
    return sorted(pairs, key=_sort_key)[0]


def normalize(docs):
    """docs.jsonl 레코드들 -> 제안 리스트."""
    acc = {}
    for d in docs:
        # 취하·유효기간만료 품목은 근거로 쓰지 않는다.
        if d.get("cancel") and d["cancel"] != "정상":
            continue
        for field in ("nb", "ud"):
            for c in extract.candidates(d[field]):
                if not extract.judge(c["sentence"], c["keyword"]):
                    continue
                for ingredient in INGREDIENT_ALIAS.get(
                    d["query_ingredient"], [d["query_ingredient"]]
                ):
                    key = (ingredient, FOOD_ALIAS.get(c["food"], c["food"]))
                    e = acc.setdefault(key, {"pairs": [], "item_seqs": set()})
                    e["pairs"].append((c["sentence"], c["keyword"]))
                    e["item_seqs"].add(d["item_seq"])

    out = []
    for (ingredient, food), e in sorted(acc.items()):
        ranked = sorted(set(e["pairs"]), key=_sort_key)
        sentence, keyword = ranked[0]
        seqs = sorted(e["item_seqs"])
        out.append({
            "ingredient": ingredient,
            "food": food,
            "riskLevel": risk_level(sentence, keyword),
            "keyword": keyword,
            "reasonKo": sentence,
            # 품목기준코드를 넣어야 "어느 허가사항의 어느 문장인지"를 되짚을 수 있다.
            "source": f"mfds:permit:{seqs[0]}",
            "sourceUrl": ENDPOINT,
            "itemSeqs": seqs,
            "evidenceCount": len(e["pairs"]),
            # 후보 전체를 (문장, 키워드)로 남긴다. 대표 문장이 그 쌍을 제대로
            # 설명하지 못할 때 리뷰에서 다른 근거로 교체할 수 있어야 한다
            # (review.py 의 pick). 키워드를 함께 남기는 이유는, 교체한 문장에서
            # riskLevel 을 다시 계산해야 하기 때문이다. 위의 riskLevel 은
            # ranked[0] 기준이라 pick 으로 다른 문장을 고르면 어긋난다
            # (실제로 77행 중 9행이 어긋나 있었다. caution 문장에 warning 배지).
            # 문장 단위로 중복을 제거한다. "우유"와 "유제품"처럼 서로 다른
            # 표제어가 같은 음식·같은 문장을 가리키면 근거가 중복으로 들어온다.
            # 중복일 때는 순위가 높은 쪽의 키워드를 남긴다.
            "evidence": list({snt: [snt, kw] for snt, kw in reversed(ranked)}.values()),
        })
    return out


def demo():
    assert risk_level("이 환자에게는 투여하지 말 것") == "contraindicated"
    assert risk_level("이 약 투여시 자몽주스를 섭취하지 않도록 한다") == "warning"
    assert risk_level("병용투여시 흡수가 감소할 수 있다") == "caution"
    # 금기가 주의보다 먼저 걸려야 한다 (한 문장에 둘 다 있을 수 있다)
    assert risk_level("섭취를 피해야 하며 신장애 환자에게는 투여하지 말 것") == "contraindicated"

    # 키워드를 주면 먼 경고어는 무시한다. 메트포르민에서 실제로 났던 오류다.
    far = ("알코올 섭취자 " + "그 밖에 여러 환자군이 길게 나열되어 있고 " * 6
           + "간질환 환자에게는 이 약의 투여를 피해야 한다")
    assert risk_level(far) == "warning"              # 문장 전체를 보면 틀린다
    assert risk_level(far, "알코올") == "caution"     # 키워드 주변만 보면 맞다
    # 가까이 있는 경고어는 그대로 적용된다
    assert risk_level("자몽주스를 섭취하지 않도록 한다", "자몽주스") == "warning"

    # 대표 문장은 더 강한 경고를 택한다. 약한 문구를 고르면 위험이 낮게 보인다.
    assert best([("자몽을 병용시 흡수가 조금 감소할 수 있다는 보고가 있다", "자몽"),
                 ("자몽을 섭취하지 않도록 한다", "자몽")])[0] == "자몽을 섭취하지 않도록 한다"
    # 위험도가 같으면 기전을 설명하는 쪽. 토막 항목이 아니라 설명을 골라야 한다.
    assert best([("9) 알코올을 복용한 사람", "알코올"),
                 ("알코올은 이 약의 간독성을 증가시킬 수 있다", "알코올")])[0] == \
        "알코올은 이 약의 간독성을 증가시킬 수 있다"
    # 밀도로 보므로 약물을 길게 나열한 문장이 개수로 이기지 못한다.
    blob = ("약물 A 0.3 mg; 약물 B 67 mg; 약물 C 200 mg; " * 6
            + "제산제와 병용시 흡수가 감소하고 혈장 농도가 저하된다")
    assert best([(blob, "제산제"),
                 ("제산제와 병용시 이 약의 흡수가 감소한다", "제산제")])[0] == \
        "제산제와 병용시 이 약의 흡수가 감소한다"
    # 둘 다 기전 표현이 없으면 맥락이 더 있는 쪽. 토막이 뽑히면 안 된다.
    assert best([("9) 알코올을 복용한 사람", "알코올"),
                 ("매일 세잔 이상 정기적으로 술을 마시는 사람은 의사와 상의해야 한다", "술")])[0] == \
        "매일 세잔 이상 정기적으로 술을 마시는 사람은 의사와 상의해야 한다"

    # 취하 품목은 근거에서 빠진다
    doc = {"query_ingredient": "심바스타틴", "item_seq": "1", "cancel": "취하",
           "nb": "자몽주스를 섭취하지 않도록 한다.", "ud": ""}
    assert normalize([doc]) == []

    # 아스피린은 성분명으로 바뀌고, 와파린은 두 성분으로 퍼진다
    asp = normalize([{"query_ingredient": "아스피린", "item_seq": "2", "cancel": "정상",
                      "nb": "알코올과 병용 투여시 출혈시간이 연장된다.", "ud": ""}])
    assert [p["ingredient"] for p in asp] == ["아세틸살리실산"], asp
    war = normalize([{"query_ingredient": "와파린", "item_seq": "3", "cancel": "정상",
                      "nb": "알코올 중독은 이 약의 감수성을 증가시킨다.", "ud": ""}])
    assert sorted(p["ingredient"] for p in war) == ["와파린", "와파린 나트륨"], war
    assert war[0]["source"] == "mfds:permit:3"
    assert war[0]["keyword"] == "알코올"
    print("ok normalize")


if __name__ == "__main__":
    if "--demo" in sys.argv:
        demo()
    else:
        docs = [json.loads(l) for l in DOCS.read_text(encoding="utf-8").splitlines()]
        props = normalize(docs)
        OUT.parent.mkdir(exist_ok=True)
        OUT.write_text(json.dumps(props, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        from collections import Counter
        print(f"{len(props)} 제안 -> {OUT}")
        print("  위험도:", dict(Counter(p["riskLevel"] for p in props)))
        print("  성분:", len({p["ingredient"] for p in props}),
              "음식:", len({p["food"] for p in props}))
