import metrics from '@metrics';

/**
 * 추출·위험도·검색 측정값. 이 프로젝트의 결과물은 112행이 아니라 이 숫자들이다.
 *
 * 숫자는 `pipeline/eval/metrics.json` 에서 온다. score.py --check 와
 * eval:search --check 가 쓰고, CI 가 둘 다 돌린다. 화면에 손으로 적지 않는
 * 이유는 규칙을 고쳤을 때 조용히 틀린 값이 남기 때문이다.
 */
const { extraction, risk, search } = metrics;

const f3 = (x: number) => x.toFixed(3);

const tiles = [
  {
    label: '상호작용 문장 추출',
    value: f3(extraction.precision),
    unit: '정밀도',
    sub: `baseline ${f3(extraction.baseline_precision)}`,
    accent: true,
  },
  {
    label: '추출 재현율',
    value: f3(extraction.recall),
    unit: '',
    sub: `양성 ${extraction.positives}건`,
  },
  {
    label: '위험도 배지 판정',
    value: f3(risk.acc),
    unit: '정확도',
    sub: `과대평가 ${risk.over} · 과소평가 ${risk.under}`,
  },
  {
    label: '약품 검색 랭킹',
    value: f3(search.r1),
    unit: 'R@1',
    sub: `${search.queries}쿼리 ${search.types}유형`,
  },
];

export function Measurements() {
  return (
    <div data-testid="measurements">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-[11px] font-semibold tracking-[0.15em] text-white/40">MEASURED</span>
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-medium text-white/30">
          라벨 {extraction.labels.toLocaleString('ko-KR')}건
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/5 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-surface px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
              {t.label}
            </p>
            <p className="mt-1.5">
              <span className={`font-mono text-2xl font-bold ${t.accent ? 'text-accent' : 'text-white'}`}>
                {t.value}
              </span>
              {t.unit && <span className="ml-1 text-[11px] text-white/30">{t.unit}</span>}
            </p>
            <p className="mt-1 text-[11px] text-white/30">{t.sub}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-white/25">
        커밋된 평가셋으로 재현된다 — <span className="font-mono text-white/40">python3 pipeline/score.py --check</span>{' '}
        · <span className="font-mono text-white/40">pnpm --filter api eval:search</span>. 추출은 제안까지만 하고,
        사람이 승인한 행만 적재한다.
      </p>
    </div>
  );
}
