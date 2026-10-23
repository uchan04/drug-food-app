/**
 * 초성·영타 표기 변환. 검색이 이 변환 위에 서 있어서, 틀리면 질의가 조용히
 * 아무것도 못 찾는다 (예외가 아니라 빈 결과로 나온다).
 */
import { describe, it, expect } from 'vitest';

import { choseong, qwerty, queryKind } from '../src/drug/hangul';

describe('hangul', () => {
  it('초성을 뽑는다', () => {
    expect(choseong('타이레놀')).toBe('ㅌㅇㄹㄴ');
    expect(choseong('씬지로이드')).toBe('ㅆㅈㄹㅇㄷ');
    // 음절이 아닌 글자는 버린다. 공백·숫자·영문은 초성이 없다.
    expect(choseong('와파린 나트륨')).toBe('ㅇㅍㄹㄴㅌㄹ');
    expect(choseong('타이레놀500')).toBe('ㅌㅇㄹㄴ');
    expect(choseong('Tylenol')).toBe('');
  });

  it('두벌식 자판으로 친 영문 키를 만든다', () => {
    expect(qwerty('타이레놀')).toBe('xkdlfpshf');
    expect(qwerty('리피토')).toBe('flvlxh');
    // 겹모음(ㅘ = h+k)과 겹받침이 키 두 개로 풀린다
    expect(qwerty('와파린')).toBe('dhkvkfls');
    expect(qwerty('값')).toBe('rkqt');
    // 쌍자음은 Shift 키지만 소문자로 낸다 — 영타는 Shift 를 안 누른 입력이 흔하다
    expect(qwerty('씬지로이드')).toBe('tlswlfhdlem');
  });

  it('질의 표기를 가린다', () => {
    expect(queryKind('ㅌㅇㄹㄴ')).toBe('cho');
    expect(queryKind('xkdlfpshf')).toBe('qwerty');
    // 보통 질의는 둘 다 아니다 — trigram 이 맡는다
    expect(queryKind('타이레놀')).toBeNull();
    expect(queryKind('타이레놀500')).toBeNull();
    expect(queryKind('')).toBeNull();
    // 모음이 섞이면 초성 질의가 아니다 (영타를 한영 전환 후 다시 친 경우)
    expect(queryKind('ㅌㅏㅇ')).toBeNull();
    // 영문 약품명과 구분이 안 된다. 맞는 이름이 없으면 빈 결과가 되는 쪽으로 둔다.
    expect(queryKind('Tylenol')).toBe('qwerty');
  });
});
