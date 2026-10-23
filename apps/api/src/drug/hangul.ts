/**
 * 초성("ㅌㅇㄹㄴ")·영타("xkdlfpsnf") 질의를 약품명에 맞추기 위한 표기 변환.
 *
 * trigram 은 이 둘을 못 잡는다. 질의와 이름이 글자를 하나도 공유하지 않아서
 * similarity 가 0 이다. 그래서 **이름 쪽을 질의와 같은 표기로 바꿔서** 맞춘다.
 *
 * 반대 방향(영문 -> 한글 조합)으로 가면 두벌식 오토마타(초성/중성/종성 상태,
 * 겹받침 분해, 받침이 다음 글자 초성으로 넘어가는 규칙)가 필요하다. 이름을
 * 분해하는 쪽은 산술 세 줄이면 끝난다. 같은 결과를 얻는 더 작은 길이다.
 */

const SYLLABLE_BASE = 0xac00;
const JUNG_COUNT = 21;
const JONG_COUNT = 28;

/** 유니코드 초성 순서. 호환 자모(ㄱ U+3131 ...)로 적는다 — 사용자가 치는 글자다. */
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

// 두벌식 자판. 겹모음·겹받침은 실제로 누르는 키 두 개로 적는다 (ㅘ = h + k).
const CHO_KEY = 'r R s e E f a q Q t T d w W c z x v g'.split(' ');
const JUNG_KEY = 'k o i O j p u P h hk ho hl y n nj np nl b m ml l'.split(' ');
const JONG_KEY = (
  ' r R rt s sw sg e f fr fa fq ft fx fv fg a q qt t T d w c z x v g'
).split(' ');

function isSyllable(code: number) {
  return code >= SYLLABLE_BASE && code < SYLLABLE_BASE + 11172;
}

/** 한글 음절의 초성만 이어 붙인다. 음절이 아닌 글자(공백, 숫자, 영문)는 버린다. */
export function choseong(name: string): string {
  let out = '';
  for (const ch of name) {
    const code = ch.codePointAt(0)!;
    if (!isSyllable(code)) continue;
    out += CHO[Math.floor((code - SYLLABLE_BASE) / (JUNG_COUNT * JONG_COUNT))];
  }
  return out;
}

/**
 * 이름을 두벌식 자판으로 쳤을 때의 영문 키 문자열. "타이레놀" -> "xkdlfpsnf".
 *
 * 전부 소문자로 낸다. 쌍자음(ㅆ = T)과 단자음(ㅅ = t)이 한 칸으로 합쳐지지만,
 * 영타는 한영 전환을 깜빡하고 친 입력이라 Shift 를 안 누른 쪽이 훨씬 흔하다.
 * 틀리는 방향이 "더 많이 찾는" 쪽이어야 한다.
 */
export function qwerty(name: string): string {
  let out = '';
  for (const ch of name) {
    const code = ch.codePointAt(0)!;
    if (isSyllable(code)) {
      const n = code - SYLLABLE_BASE;
      out += CHO_KEY[Math.floor(n / (JUNG_COUNT * JONG_COUNT))];
      out += JUNG_KEY[Math.floor(n / JONG_COUNT) % JUNG_COUNT];
      out += JONG_KEY[n % JONG_COUNT];
    } else if (/[a-z0-9]/i.test(ch)) {
      out += ch;
    }
    // 공백·괄호는 버린다. 질의에 그대로 들어올 리 없다.
  }
  return out.toLowerCase();
}

/**
 * 질의가 어느 표기인지. trigram 으로 잡히는 보통 질의는 null 이다.
 *
 * 'cho'    전부 초성 자모 ("ㅌㅇㄹㄴ")
 * 'qwerty' 전부 영문자 ("xkdlfpsnf"). 영문 약품명과 구분이 안 되므로,
 *          부르는 쪽에서 trigram 결과가 없을 때만 쓰도록 하는 게 아니라
 *          **맞는 이름이 없으면 빈 결과**가 되게 한다 ("tylenol" 은 아무것도
 *          안 걸린다 — 영문명 검색은 lang='en' 으로 들어온다).
 */
export function queryKind(q: string): 'cho' | 'qwerty' | null {
  const s = q.replace(/\s/g, '');
  if (!s) return null;
  if ([...s].every((c) => CHO.includes(c))) return 'cho';
  if (/^[a-z]+$/i.test(s)) return 'qwerty';
  return null;
}

/** 질의 표기에 맞춰 이름을 변환한다. */
export function transcribe(name: string, kind: 'cho' | 'qwerty'): string {
  return kind === 'cho' ? choseong(name) : qwerty(name);
}
