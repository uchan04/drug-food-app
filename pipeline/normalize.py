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

# ---------------------------------------------------------------------------
# 복합제 성분 귀속
#
# item_name 부분일치로 조회하면 복합제도 걸린다 (카듀엣 = 암로디핀 + 아토르바스타틴).
# 복합제 허가사항은 두 성분의 주의사항이 한 문서에 섞여 있는데, 문서를 통째로
# 조회어에 귀속시키면 다른 성분의 문장이 섞여 들어온다. 실제 1순위 근거였다.
#   아토르바스타틴 x 자몽   "따라서, 암로디핀은 자몽이나 자몽주스와 병용시..."
#   미노사이클린  x 알코올  "경구 메트로니다졸을 알코올과 병용시 antabuse 효과..."
#
# 문서를 버리지는 않는다. 알렌드로네이트는 국내 허가 품목이 복합제 1건뿐이라서
# (알렌드론산 + 콜레칼시페롤) 문서를 버리면 제안 7건이 전부 사라지고, 그중에는
# 임상적으로 가장 중요한 "공복에 물과 함께 복용"이 들어 있다. 문장 단위로 가른다.
# ---------------------------------------------------------------------------
# MAIN_ITEM_INGR 는 '[M095744]로수바스타틴칼슘|[M...]...' 형태다.
_INGR_CODE = re.compile(r"^\[[A-Z0-9]+\]")
# 대한민국약전의 수식어. 본문은 이걸 떼고 쓴다 (묽은클라불란산칼륨 -> 클라불란산).
_INGR_MODIFIER = re.compile(r"^(묽은|농축|건조|무수)")

# main_ingr 의 표준명이 조회어와 다른 성분. 조회어가 main_ingr 에 없으면 어느
# 쪽이 '이 약'인지 알 수 없어서 co_ingredients 가 멈춘다.
MAIN_INGR_ALIAS = {"알렌드로네이트": "알렌드론산"}

# 문장에서 성분을 알아보는 데 쓰는 이름 길이.
#
# main_ingr 은 염·수화물이 붙은 표준명('메트로니다졸벤조산염', '암로디핀베실산염')
# 이지만 문장은 기본명('메트로니다졸', '암로디핀')으로 쓴다. 접미어 사전
# (염산염/황산염/수화물/...)을 적는 대신 앞 네 글자만 본다. 접미어는 뒤에만
# 붙으므로 접두어는 그대로 남고, 사전처럼 새 복합제마다 늘릴 필요가 없다.
#
# 문서 전체에서 가장 긴 접두어를 찾는 방법을 먼저 썼는데 틀렸다. 허가사항
# 머리글에는 표준명 전체가 적혀 있어서 '메트로니다졸벤조산염'이 잡히고, 문장의
# '메트로니다졸'과 안 맞아 미노사이클린 x 알코올이 그대로 통과했다.
#
# ponytail: 네 글자가 우연히 겹치면 근거 문장 하나를 잘못 버린다. 전사된 INN
# 네 음절이 겹칠 일은 드물고, 이 코퍼스의 성분 5종에서는 겹치지 않는다.
_INGR_PREFIX = 4


def mentions(sentence, name):
    """문장이 그 성분을 이름으로 부르는가."""
    return _INGR_MODIFIER.sub("", name)[:_INGR_PREFIX] in sentence


def co_ingredients(doc):
    """복합제 문서에서 조회어가 아닌 성분의 표준명. 단일제면 빈 리스트."""
    names = []
    for part in (doc.get("main_ingr") or "").split("|"):
        part = _INGR_CODE.sub("", part).strip()
        # 같은 성분이 함량별로 여러 번 적힌다 (세티리진염산염 x 6). 복합제가 아니다.
        if part and part not in names:
            names.append(part)
    if len(names) < 2:
        return []
    own = MAIN_INGR_ALIAS.get(doc["query_ingredient"], doc["query_ingredient"])
    others = [n for n in names if not n.startswith(own)]
    if len(others) == len(names):
        raise SystemExit(
            f"복합제 {doc['item_seq']}({doc['item_name']}) 의 성분 {names} 에 "
            f"조회어 '{own}' 가 없다. MAIN_INGR_ALIAS 에 표준명을 추가하세요."
        )
    return others


def attributed(sentence, own, cos):
    """복합제 문장이 조회 성분에 대한 것인가.

    다른 성분을 이름으로 부르면서 조회 성분은 부르지 않는 문장만 버린다.
    둘 다 부르지 않는 문장("이 약은 물과 함께 공복에 복용한다")은 복합제
    전체에 대한 서술이라 그대로 둔다 — 알렌드로네이트의 공복 복용이 그 형태다.
    """
    return mentions(sentence, own) or not any(mentions(sentence, c) for c in cos)


# extract 의 정규화된 음식명 -> seed.ts 의 Food.nameKo
# 왼쪽에만 있는 것은 load 단계에서 Food 행을 새로 만든다.
# 표제어가 가리키는 Food 를 하나로 묶는다. 쪼개 두면 같은 상호작용이 여러
# 행으로 적재된다 — 아토르바스타틴에 거의 같은 문장이 자몽과 자몽주스로 두 번
# 들어갔고, 아세트아미노펜을 조회하면 알코올 항목이 위험도가 서로 다른 채로
# 4개 나왔다.
#
# extract.FOODS 가 아니라 여기서 묶는 이유는, extract 쪽을 바꾸면
# make_labelset 의 (문장, 음식) 중복 제거 키가 바뀌어 eval/labels.tsv 621행이
# 무효가 되기 때문이다. extract 는 키워드 단위, normalize 는 Food 어휘 단위다.
FOOD_ALIAS = {
    # 자몽주스는 자몽의 한 형태다. 허가사항 문장이 대부분 "자몽주스"지만
    # 통째 자몽도 같은 푸라노쿠마린을 가지므로 자몽이 더 넓은 쪽이다.
    "자몽주스": "자몽",
    # 종류별 알코올은 에탄올 상호작용에서 다르지 않다. 맥주의 푸린처럼
    # 종류 고유의 기전은 seed 의 맥주(f010) 행이 담당한다.
    "알코올 (맥주)": "알코올",
    "알코올 (와인)": "알코올",
}

# Food 메타데이터. seed.ts 가 Food 어휘의 주인이고 아래 음식들도 seed 에 있으므로
# 보통은 load 단계가 nameKo 로 찾아 쓰고 새로 만들지 않는다("새 Food 0개").
# 여기 남겨두는 이유는 seed 에 없는 음식이 새로 나올 때의 대비다. 그때
# "새 Food N개"가 찍히는 것이 사전에 없던 음식이 나왔다는 신호가 된다.
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
#
# eval/labels.tsv 의 risk 열로 측정한다 (python3 score.py --risk).
# 정확도 0.949, 격상 정밀도 0.875, 격상 재현율 0.778 (라벨 235건).
# 기본값이 caution 인 것은 보수적 선택이 아니라 측정된 약점이다 — 올려야 할
# 것을 못 올리는 쪽(과소 8건)이 잘못 올리는 쪽(과대 4건)보다 많다.
RISK_RULES = (
    # "병용투여를 피한다" 가 금기 쪽에 있었다. 측정해 보니 과대평가다 — 회피 권고와
    # 금지는 다르고, warning 의 "피한다" 가 이미 받는다. 지워서 고쳤다.
    ("contraindicated", ("투여하지 말 것", "투여해서는 안", "병용하지 않는다", "금기",
                         "함께 투여하지 않는다", "복용하지 않는다")),
    # "권장하지 않" 은 "권고되지 않" 과 같은 뜻인데 조사만 다르다. 암로디핀 자몽의
    # "병용투여를 권장하지 않는다" 4건이 전부 caution 으로 떨어져 있었다.
    ("warning", ("피해야", "피한다", "권고되지 않", "권장하지 않", "병용하지 않는 것이 바람직",
                 "투여하지 않는 것이 바람직", "섭취하지 않도록", "중지", "삼가")),
)


# 위험도를 판정할 때 보는 키워드 주변 범위.
# 문장 전체를 보면 음식과 무관한 경고어가 위험도를 올린다. 실제로 메트포르민
# 알코올이 "간질환 환자에게는 투여를 피해야 한다"의 "피해야" 때문에 warning
# 으로 올라갔다. 경고어가 그 음식에 대한 것인지는 거리로 거른다.
#
# 80 이었다. dev 를 쓸어 보니 100~140 이 평탄하고(정확도 0.946, 격상 재현율
# 0.875) 160 부터 과대평가가 3 -> 7 로 튄다. 두 절벽에서 가장 먼 값을 쓴다.
# 80 에서는 시프로플록사신 유제품의 "병용하지 않는 것이 바람직"이 키워드에서
# 약 90자 떨어져 있어 caution 으로 떨어졌다.
RISK_WINDOW = 120

# 교차참조는 이 문장이 내리는 지시가 아니다. "(…투여하지 말 것 항 참조)" 를
# 금기로 읽으면 기전만 설명하는 문장에 금기 배지가 붙는다. 실제로 세인트존스워트
# 세로토닌 문장과 자몽주스 문장이 그렇게 금기로 올라갔다.
# 괄호를 먼저 지우므로 참조 문구가 창을 잡아먹지도 않는다.
_XREF = re.compile(r"\([^()]*참조[^()]*\)")


def risk_level(sentence, keyword=None):
    """경고 어투로 위험도를 매긴다. keyword 를 주면 그 주변만 본다."""
    sentence = _XREF.sub(" ", sentence)
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
        cos = co_ingredients(d)
        own = MAIN_INGR_ALIAS.get(d["query_ingredient"], d["query_ingredient"])
        for field in ("nb", "ud"):
            for c in extract.candidates(d[field]):
                if not extract.judge(c["sentence"], c["keyword"]):
                    continue
                # 복합제면 다른 성분을 설명하는 문장을 버린다.
                if cos and not attributed(c["sentence"], own, cos):
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

    # 교차참조는 이 문장의 지시가 아니다. 플루옥세틴 세인트존스워트에서 실제로 났다.
    assert risk_level("세인트존스워트와 같은 약물과 병용투여하는 것이 임상적으로 유익성이 "
                      "있다면 위험성을 인식해야 한다(2. 다음 환자에는 투여하지 말 것 항 참조)",
                      "세인트존스워트") == "caution"
    # 지시어가 괄호 밖에 있으면 그대로 적용된다
    assert risk_level("자몽주스를 섭취하지 않도록 한다(5. 일반적 주의 참조)",
                      "자몽주스") == "warning"
    # 회피 권고와 금지는 다르다
    assert risk_level("이 약과 세인트존스워트의 병용투여를 피한다",
                      "세인트존스워트") == "warning"
    # "권장하지 않" 은 "권고되지 않" 과 같은 뜻이다 (암로디핀 자몽 4건)
    assert risk_level("암로디핀은 자몽과 병용시 병용투여를 권장하지 않는다",
                      "자몽") == "warning"

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

    # 복합제: 다른 성분을 부르는 문장은 그 성분 쪽이다. 카듀엣에서 실제로 났던 오류다.
    카듀엣 = {"query_ingredient": "아토르바스타틴", "item_seq": "4", "item_name": "카듀엣정",
            "cancel": "정상",
            "main_ingr": "[M1]아토르바스타틴칼슘삼수화물|[M2]암로디핀베실산염",
            "nb": "따라서, 암로디핀은 자몽주스와 병용시 생체이용률이 증가한다. "
                  "자몽주스는 아토르바스타틴의 혈중 농도를 증가시킬 수 있다.", "ud": ""}
    assert co_ingredients(카듀엣) == ["암로디핀베실산염"]
    kadu = normalize([카듀엣])
    assert len(kadu) == 1 and len(kadu[0]["evidence"]) == 1, kadu
    assert kadu[0]["reasonKo"].startswith("자몽주스는 아토르바스타틴"), kadu[0]["reasonKo"]

    # 표준명은 염·수화물이 붙어 있고 문장은 기본명을 쓴다. 앞 네 글자로 맞춘다.
    assert mentions("경구 메트로니다졸을 알코올과 병용시", "메트로니다졸벤조산염")
    assert mentions("클라불란산과 함께", "묽은클라불란산칼륨")  # 약전 수식어를 뗀다
    assert not mentions("이 약은 물과 함께 복용한다", "농축콜레칼시페롤분말")
    # 둘 다 부르지 않는 문장은 복합제 전체 서술이라 남긴다 (알렌드로네이트의 공복 복용).
    assert attributed("이 약은 물과 함께 공복에 복용한다", "알렌드론산", ["농축콜레칼시페롤분말"])

    # 같은 성분이 함량별로 여러 번 적힌 것은 복합제가 아니다 (세티리진).
    assert co_ingredients({"query_ingredient": "세티리진", "item_seq": "5", "item_name": "",
                           "main_ingr": "[M1]세티리진염산염|[M1]세티리진염산염",
                           "nb": "", "ud": ""}) == []
    # 조회어가 main_ingr 에 없으면 어느 쪽이 '이 약'인지 모른다. 조용히 넘기면 안 된다.
    try:
        co_ingredients({"query_ingredient": "알렌드로네이트수화물", "item_seq": "6",
                        "item_name": "대웅알렌드로네이트디정",
                        # 실제 표준명은 알렌드론산이고 MAIN_INGR_ALIAS 가 이어준다.
                        # 별칭이 없는 성분을 흉내 내려고 조회어만 바꿨다.
                        "main_ingr": "[M1]알렌드론산나트륨수화물|[M2]농축콜레칼시페롤분말",
                        "nb": "", "ud": ""})
    except SystemExit as e:
        assert "MAIN_INGR_ALIAS" in str(e), e
    else:
        raise AssertionError("복합제에 조회어가 없는데 멈추지 않았다")

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
