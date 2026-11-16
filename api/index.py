"""Vercel Serverless Function entrypoint for The Museum of Us API."""

from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import museum_store  # noqa: E402

MAX_BODY_BYTES = 4_400_000  # Keep safely under Vercel's 4.5 MB request cap


class handler(BaseHTTPRequestHandler):  # noqa: N801 - Vercel requires lowercase 'handler'
    """Dispatch /api/* routes on Vercel Serverless Functions."""

    def _send_json(self, status_code: int, payload: object) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)

    def _read_json_body(self) -> object:
        length_header = self.headers.get("Content-Length", "0")
        try:
            length = int(length_header)
        except ValueError as exc:
            raise ValueError("Invalid Content-Length header") from exc
        if length <= 0:
            raise ValueError("Empty request body")
        if length > MAX_BODY_BYTES:
            raise ValueError(
                "Upload payload is too large for cloud sync (max ~4 MB). "
                "Please use slightly smaller photos."
            )
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _dispatch(self, method: str, read_body: bool = False) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        qs = parse_qs(parsed.query)
        payload = None
        if read_body:
            try:
                payload = self._read_json_body()
            except (ValueError, json.JSONDecodeError) as exc:
                self._send_json(400, {"error": str(exc)})
                return
        status, result = museum_store.handle_api_request(method, path, qs, payload)
        self._send_json(status, result)

    def do_GET(self) -> None:  # noqa: N802
        self._dispatch("GET")

    def do_POST(self) -> None:  # noqa: N802
        self._dispatch("POST", read_body=True)

    def do_PUT(self) -> None:  # noqa: N802
        self._dispatch("PUT", read_body=True)

    def do_DELETE(self) -> None:  # noqa: N802
        self._dispatch("DELETE")
