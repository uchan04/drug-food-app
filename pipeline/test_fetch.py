#!/usr/bin/env python3
"""python3 pipeline/test_fetch.py 로 실행. 프레임워크 없음.

page 1만 받고 끝나는 버그, 인증키가 디스크에 남는 버그를 잡는다.
둘 다 조용히 지나가면 나중에 데이터가 틀린 이유를 못 찾는다.
"""

import json
import os
import tempfile
import threading
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import fetch as F


def test_find():
    assert F._find({"response": {"body": {"totalCount": 7}}}, "totalCount") == 7
    assert F._find({"a": [{"b": {"resultCode": "00"}}]}, "resultCode") == "00"
    assert F._find({"a": 1}, "nope") is None
    # 0도 찾아야 한다. falsy 로 거르면 빈 데이터셋에서 무한 페이징한다.
    assert F._find({"response": {"body": {"totalCount": 0}}}, "totalCount") == 0


def test_redact():
    r = F._redact({"serviceKey": "secret", "pageNo": 1})
    assert r["serviceKey"] == "***"
    assert r["pageNo"] == 1


class _Handler(BaseHTTPRequestHandler):
    """totalCount=3 을 2행씩 → 2페이지로 돌려주는 가짜 포털."""

    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        page = int(q["pageNo"][0])
        items = [{"i": 1}, {"i": 2}] if page == 1 else [{"i": 3}]
        body = json.dumps(
            {
                "header": {"resultCode": "00", "resultMsg": "NORMAL SERVICE."},
                "body": {"pageNo": page, "totalCount": 3, "numOfRows": 2, "items": items},
            }
        ).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass


def test_pagination_and_manifest():
    srv = HTTPServer(("127.0.0.1", 0), _Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    os.environ[F.API_KEY_ENV] = "testkey"
    try:
        with tempfile.TemporaryDirectory() as tmp:
            run = F.fetch(
                "t", f"http://127.0.0.1:{srv.server_port}/x", rows=2, out_root=Path(tmp)
            )
            m = json.loads((run / "manifest.json").read_text(encoding="utf-8"))
            assert len(m["pages"]) == 2, m["pages"]
            assert m["total_count"] == 3
            assert m["params"]["serviceKey"] == "***", "인증키가 manifest 에 남았다"
            assert (run / "page_0001.json").exists()
            assert m["pages"][0]["sha256"] != m["pages"][1]["sha256"]
    finally:
        srv.shutdown()


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok {name}")
    print("all passed")
