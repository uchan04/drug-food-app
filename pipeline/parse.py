#!/usr/bin/env python3
"""허가사항 문서 필드(EE/UD/NB_DOC_DATA)에서 본문 텍스트를 뽑는다.

구조가 두 겹이다.

    <DOC title="사용상의주의사항" type="NB">
      <SECTION><ARTICLE><PARAGRAPH><![CDATA[ <p>실제 본문 HTML</p> ]]>

CDATA 안이 HTML 이라서 두 단계로 벗겨야 한다. <[^>]*> 한 번으로 밀면
<![CDATA[ 가 본문의 첫 '>' 까지 삼켜서 내용이 통째로 사라진다.
심바스타틴 품목에서 raw 37,146자가 618자로 줄어드는 것으로 확인했다.

python3 parse.py 로 자체 점검이 돌아간다.
"""

import html
import re

_CDATA = re.compile(r"<!\[CDATA\[(.*?)\]\]>", re.S)
_TAG = re.compile(r"<[^>]*>")


def doc_text(raw):
    """DOC_DATA 원문 → 공백 정규화된 평문."""
    if not raw:
        return ""
    # CDATA 안쪽만 본문이다. 바깥의 DOC/SECTION/ARTICLE 태그는 구조라서 버린다.
    parts = _CDATA.findall(raw) or [raw]
    return re.sub(r"\s+", " ", " ".join(html.unescape(_TAG.sub(" ", p)) for p in parts)).strip()


def demo():
    # CDATA 안의 HTML 이 살아남아야 한다.
    raw = (
        '<DOC title="사용상의주의사항" type="NB"><SECTION><ARTICLE><PARAGRAPH>'
        "<![CDATA[ <p>자몽주스는 CYP3A4를 저해한다.</p> ]]>"
        "</PARAGRAPH></ARTICLE></SECTION></DOC>"
    )
    assert doc_text(raw) == "자몽주스는 CYP3A4를 저해한다."

    # 본문에 '>' 가 있어도 잘려 나가지 않아야 한다 (한 번에 태그 제거하면 여기서 깨진다).
    raw2 = "<PARAGRAPH><![CDATA[ <p>공복혈당 >5.6mmol/L 이상</p> ]]></PARAGRAPH>"
    assert "5.6mmol/L 이상" in doc_text(raw2), doc_text(raw2)

    # HTML 엔티티는 되돌린다.
    assert doc_text("<P><![CDATA[&nbsp;간장애&amp;신장애]]></P>") == "간장애&신장애"

    # CDATA 가 여러 개면 순서대로 이어 붙인다.
    assert doc_text("<A><![CDATA[첫째]]></A><A><![CDATA[둘째]]></A>") == "첫째 둘째"

    # CDATA 가 없는 문서도 태그만 벗겨서 반환한다.
    assert doc_text("<DOC><P>평문</P></DOC>") == "평문"

    assert doc_text(None) == "" and doc_text("") == ""
    print("ok parse.doc_text")


if __name__ == "__main__":
    demo()
