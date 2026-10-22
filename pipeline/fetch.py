#!/usr/bin/env python3
"""공공데이터포털 원본 수집기.

받은 바이트를 손대지 않고 그대로 저장하고, manifest.json 에 출처·시각·해시를 남긴다.
정규화는 여기서 하지 않는다. 다음 단계가 이 원본을 다시 읽는다.
원본을 남기는 이유는 재현성이다. 전처리를 고칠 때마다 API를 다시 때릴 수 없다.
"""

import hashlib
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API_KEY_ENV = "DATA_GO_KR_KEY"
RAW_ROOT = Path(__file__).parent / "data" / "raw"
# ponytail: 페이지 상한. 폭주 방지용이고, 더 큰 데이터셋을 받으면 올린다.
MAX_PAGES = 500


def _find(obj, key):
    """중첩 JSON에서 key의 첫 값을 찾는다.

    공공데이터포털은 데이터셋마다 response.body 아래 구조가 조금씩 달라서
    경로를 하드코딩하면 데이터셋을 바꿀 때 깨진다.
    """
    if isinstance(obj, dict):
        if key in obj:
            return obj[key]
        for v in obj.values():
            found = _find(v, key)
            if found is not None:
                return found
    elif isinstance(obj, list):
        for v in obj:
            found = _find(v, key)
            if found is not None:
                return found
    return None


def _redact(params):
    """인증키는 manifest 에 남기지 않는다."""
    return {k: ("***" if k == "serviceKey" else v) for k, v in params.items()}


def fetch(dataset, url, params=None, rows=100, out_root=RAW_ROOT):
    key = os.environ.get(API_KEY_ENV)
    if not key:
        sys.exit(f"{API_KEY_ENV} 가 비어 있습니다. 공공데이터포털 일반 인증키(Decoding)를 넣으세요.")

    started = datetime.now(timezone.utc)
    run_dir = out_root / dataset / started.strftime("%Y%m%dT%H%M%SZ")
    run_dir.mkdir(parents=True, exist_ok=True)

    base = {"serviceKey": key, "_type": "json", "numOfRows": rows, **(params or {})}
    pages, total = [], None

    for page in range(1, MAX_PAGES + 1):
        query = urllib.parse.urlencode({**base, "pageNo": page})
        with urllib.request.urlopen(f"{url}?{query}", timeout=30) as resp:
            body = resp.read()

        # 포털은 오류도 HTTP 200 + XML 로 돌려준다. 원본을 남기고 멈춘다.
        try:
            parsed = json.loads(body)
        except json.JSONDecodeError:
            (run_dir / f"page_{page:04d}.error").write_bytes(body)
            sys.exit(f"JSON 이 아닌 응답 (page {page}). {run_dir} 를 확인하세요.")

        code = _find(parsed, "resultCode")
        if code is not None and str(code) not in ("0", "00"):
            sys.exit(f"API 오류 resultCode={code} resultMsg={_find(parsed, 'resultMsg')}")

        name = f"page_{page:04d}.json"
        (run_dir / name).write_bytes(body)
        pages.append(
            {"file": name, "sha256": hashlib.sha256(body).hexdigest(), "bytes": len(body)}
        )

        if total is None:
            found = _find(parsed, "totalCount")
            total = int(found) if found is not None else None
        if total is not None and page * rows >= total:
            break
        if not _find(parsed, "item"):
            break

    manifest = {
        "dataset": dataset,
        "url": url,
        "params": _redact(base),
        "fetched_at": started.isoformat(),
        "total_count": total,
        "pages": pages,
    }
    (run_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"{len(pages)} pages, total_count={total} -> {run_dir}")
    return run_dir


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("usage: fetch.py <dataset> <url> [key=value ...]")
    dataset, url, *rest = sys.argv[1:]
    fetch(dataset, url, dict(p.split("=", 1) for p in rest))
