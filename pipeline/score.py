#!/usr/bin/env python3
"""eval/labels.tsv 로 상호작용 문장 판정 성능을 측정한다.

측정 대상은 두 가지다.

  baseline  음식 키워드가 들어 있으면 상호작용으로 본다 (extract.candidates 그대로)
  rules     거기에 extract.judge 의 차단 사전을 적용한 것

labels.tsv 가 문장을 그대로 담고 있어서 원본 데이터나 API 키 없이 돌아간다.

dev/test 를 **성분 단위**로 나눈다. 문장 단위로 나누면 같은 주의사항 문구를
쓰는 제네릭들 때문에 거의 동일한 문장이 양쪽에 섞여 들어가 test 가 오염된다.
차단 사전은 dev 만 보고 고치고, test 숫자는 손대지 않는다.

round 열은 표본 수집 회차다. round 1 은 성분당 3품목(63문서), round 2 는
20품목으로 늘렸을 때 새로 나온 문장(375문서)이다. round 2 는 규칙을 고정한
상태로 라벨했으므로 **처음 보는 제조사 문구에서의 성능**을 나타낸다.
성분 그룹은 양쪽에 공통이라 성분 홀드아웃이 아니라 문구 홀드아웃이다.

risk 열은 위험도 라벨이다. 양성 행에만 있다. 재는 것은 임상적 진실이 아니라
**그 문장이 그 음식에 대해 지시하는 행동 수준**이다 — 사용자에게 이 문장이 그대로
보이고 배지가 그 위에 붙기 때문이다. 판정 기준은 eval/RISK_RUBRIC.md 에 있고,
문장을 읽기 전에 고정했다.

    python3 score.py           # dev/test 지표
    python3 score.py --fp      # 규칙이 놓친 오탐 출력 (dev 만)
    python3 score.py --fn      # 규칙이 잘못 막은 양성 출력 (dev 만)
    python3 score.py --risk    # 위험도 규칙 측정
    python3 score.py --risk-e  # 위험도 오류 출력 (dev 만)
    python3 score.py --check   # 하한 미달이면 0 이 아닌 코드로 종료 (CI)
"""

import csv
import hashlib
import sys
from pathlib import Path

import extract
import normalize

LABELS = Path(__file__).parent / "eval" / "labels.tsv"


def split_of(ingredient):
    h = int(hashlib.sha256(ingredient.encode()).hexdigest(), 16)
    return "dev" if h % 2 == 0 else "test"


def load():
    with LABELS.open(encoding="utf-8") as f:
        rows = list(csv.DictReader(f, delimiter="\t"))
    for r in rows:
        r["y"] = int(r["label"])
        r["risk"] = r.get("risk") or ""
        r["split"] = split_of(r["ingredient"])
    return rows


# 표에 찍을 행. (이름, 필터)
GROUPS = (
    ("dev", lambda r: r["split"] == "dev"),
    ("test", lambda r: r["split"] == "test"),
    ("all", lambda r: True),
    ("round1", lambda r: r["round"] == "1"),
    ("round2", lambda r: r["round"] == "2"),
    ("r2 dev", lambda r: r["round"] == "2" and r["split"] == "dev"),
    ("r2 test", lambda r: r["round"] == "2" and r["split"] == "test"),
)


def prf(rows, predict):
    tp = sum(1 for r in rows if r["y"] == 1 and predict(r))
    fp = sum(1 for r in rows if r["y"] == 0 and predict(r))
    fn = sum(1 for r in rows if r["y"] == 1 and not predict(r))
    p = tp / (tp + fp) if tp + fp else 0.0
    rc = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * p * rc / (p + rc) if p + rc else 0.0
    return {"tp": tp, "fp": fp, "fn": fn, "precision": p, "recall": rc, "f1": f1}


# 위험도는 순서가 있는 세 등급이다. 정확도 하나로는 "어느 방향으로 틀리는지"가
# 사라진다. 과대평가(금기가 아닌데 금기)와 과소평가(금기인데 주의)는 성질이 다르다.
RISK_ORDER = {"caution": 0, "warning": 1, "contraindicated": 2}


def risk_rows(rows):
    """위험도 라벨이 있는 행. 양성에만 라벨했다 — 음성 문장의 위험도는 뜻이 없다."""
    return [r for r in rows if r["y"] == 1 and r["risk"]]


def risk_metrics(rows):
    got = [(normalize.risk_level(r["sentence"], r["keyword"]), r["risk"]) for r in rows]
    over = sum(1 for p, y in got if RISK_ORDER[p] > RISK_ORDER[y])
    under = sum(1 for p, y in got if RISK_ORDER[p] < RISK_ORDER[y])
    hit = len(got) - over - under
    m = {"n": len(got), "acc": hit / len(got) if got else 0.0,
         "over": over, "under": under}
    # 격상 정밀도/재현율: caution 위로 올린 것이 맞았는가, 올려야 할 것을 올렸는가.
    # 배지가 사용자 행동을 바꾸는 지점이 여기다.
    tp = sum(1 for p, y in got if p != "caution" and y != "caution")
    fp = sum(1 for p, y in got if p != "caution" and y == "caution")
    fn = sum(1 for p, y in got if p == "caution" and y != "caution")
    m["esc_p"] = tp / (tp + fp) if tp + fp else 0.0
    m["esc_r"] = tp / (tp + fn) if tp + fn else 0.0
    m["esc_tp"], m["esc_fp"], m["esc_fn"] = tp, fp, fn
    return m


def risk_report(rows):
    sub = risk_rows(rows)
    print(f"{'split':7s} {'n':>4s} {'정확도':>7s} {'과대':>4s} {'과소':>4s}  "
          f"{'격상정밀도':>9s} {'격상재현율':>9s}  TP/FP/FN")
    for name, keep in GROUPS:
        m = risk_metrics([r for r in sub if keep(r)])
        if not m["n"]:
            continue
        print(f"{name:7s} {m['n']:4d} {m['acc']:7.3f} {m['over']:4d} {m['under']:4d}  "
              f"{m['esc_p']:9.3f} {m['esc_r']:9.3f}  "
              f"{m['esc_tp']}/{m['esc_fp']}/{m['esc_fn']}")

    print("\n혼동행렬 (행=라벨, 열=예측)")
    order = ["contraindicated", "warning", "caution"]
    print(f"{'':16s}" + "".join(f"{c[:7]:>9s}" for c in order) + f"{'합':>6s}")
    for y in order:
        r_ = [sum(1 for x in sub if x["risk"] == y
                  and normalize.risk_level(x["sentence"], x["keyword"]) == p) for p in order]
        print(f"{y:16s}" + "".join(f"{n:9d}" for n in r_) + f"{sum(r_):6d}")


def risk_errors(rows):
    """dev 만 본다. test 오류를 보고 규칙을 고치면 test 숫자가 거짓이 된다."""
    bad = [(normalize.risk_level(r["sentence"], r["keyword"]), r)
           for r in risk_rows(rows) if r["split"] == "dev"]
    bad = [(p, r) for p, r in bad if p != r["risk"]]
    print(f"dev 위험도 오류 {len(bad)}건")
    for p, r in sorted(bad, key=lambda x: (x[1]["risk"], x[0])):
        d = "과대" if RISK_ORDER[p] > RISK_ORDER[r["risk"]] else "과소"
        print(f"  {d} 라벨={r['risk']:16s} 예측={p:16s} [{r['keyword']}]")
        print(f"       {r['sentence'][:160]}")


BASELINE = lambda r: True
RULES = lambda r: extract.judge(r["sentence"], r["keyword"])


def report(rows):
    print(f"{'split':7s} {'n':>4s} {'양성':>4s}  {'모델':9s} {'정밀도':>7s} {'재현율':>7s} {'F1':>6s}  TP/FP/FN")
    for name, keep in GROUPS:
        sub = [r for r in rows if keep(r)]
        pos = sum(r["y"] for r in sub)
        for label, fn_ in (("baseline", BASELINE), ("rules", RULES)):
            m = prf(sub, fn_)
            print(f"{name:7s} {len(sub):4d} {pos:4d}  {label:9s} "
                  f"{m['precision']:7.3f} {m['recall']:7.3f} {m['f1']:6.3f}  "
                  f"{m['tp']}/{m['fp']}/{m['fn']}")


def errors(rows, kind):
    """dev 만 본다. test 오류를 보고 규칙을 고치면 test 숫자가 거짓이 된다."""
    dev = [r for r in rows if r["split"] == "dev"]
    want = (0, True) if kind == "fp" else (1, False)
    bad = [r for r in dev if r["y"] == want[0] and RULES(r) == want[1]]
    print(f"dev {kind.upper()} {len(bad)}건")
    for r in sorted(bad, key=lambda r: (r["keyword"], r["round"])):
        print(f"  r{r['round']} [{r['keyword']}] {r['sentence'][:120]}")


# CI 하한. 측정값(전체 정밀도 0.836 / 재현율 1.000)보다 낮게 잡아서, 규칙을
# 고쳤을 때 통계적 요동이 아니라 실제 퇴행만 걸리게 한다. 올릴 때는 측정값과 함께 올린다.
MIN_PRECISION = 0.80
MIN_RECALL = 0.98


def check(rows):
    m = prf(rows, RULES)
    print(f"rules: precision={m['precision']:.3f} recall={m['recall']:.3f} f1={m['f1']:.3f} "
          f"(하한 {MIN_PRECISION}/{MIN_RECALL})")
    bad = []
    if m["precision"] < MIN_PRECISION:
        bad.append(f"정밀도 {m['precision']:.3f} < {MIN_PRECISION}")
    if m["recall"] < MIN_RECALL:
        bad.append(f"재현율 {m['recall']:.3f} < {MIN_RECALL}")

    if bad:
        sys.exit("추출 규칙 퇴행: " + ", ".join(bad))
    print("ok score")


if __name__ == "__main__":
    rows = load()
    if "--check" in sys.argv:
        check(rows)
    elif "--fp" in sys.argv:
        errors(rows, "fp")
    elif "--fn" in sys.argv:
        errors(rows, "fn")
    elif "--risk" in sys.argv:
        risk_report(rows)
    elif "--risk-e" in sys.argv:
        risk_errors(rows)
    else:
        report(rows)
