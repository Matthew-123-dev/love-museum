"""Local HTTP and JSON persistence server for The Museum of Us."""

from __future__ import annotations

import json
import mimetypes
import socket
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

import museum_store

BASE_DIR = Path(__file__).resolve().parent
MAX_BODY_BYTES = 25 * 1024 * 1024  # 25 MB for local high-resolution uploads

CLEAN_HTML_ROUTES = {
    "": "index.html",
    "private": "index.html",
    "public": "index.html",
    "setup": "setup.html",
    "login": "setup.html",
    "proposal": "proposal.html",
}


class MuseumRequestHandler(BaseHTTPRequestHandler):
    """Serve static assets and unified REST endpoints for local testing."""

    server_version = "LoveMuseumHTTP/2.0"

    def log_message(self, format: str, *args) -> None:  # noqa: A002
        sys.stdout.write(f"[museum] {self.address_string()} - {format % args}\n")
        sys.stdout.flush()

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
            raise ValueError("Payload exceeds 25 MB limit")
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _dispatch_api(self, method: str, read_body: bool = False) -> None:
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
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/"):
            self._dispatch_api("GET")
            return

        rel_path = unquote(parsed.path).strip("/")
        if rel_path in CLEAN_HTML_ROUTES:
            rel_path = CLEAN_HTML_ROUTES[rel_path]

        target = (BASE_DIR / rel_path).resolve()
        try:
            target.relative_to(BASE_DIR)
        except ValueError:
            self.send_error(403, "Forbidden")
            return

        if target.is_dir():
            target = target / "index.html"

        if not target.exists() or not target.is_file():
            self.send_error(404, "Not Found")
            return

        mime_type, _ = mimetypes.guess_type(str(target))
        if target.suffix == ".css":
            mime_type = "text/css; charset=utf-8"
        elif target.suffix == ".js":
            mime_type = "application/javascript; charset=utf-8"
        elif target.suffix == ".html":
            mime_type = "text/html; charset=utf-8"
        elif not mime_type:
            mime_type = "application/octet-stream"

        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self) -> None:  # noqa: N802
        if not urlparse(self.path).path.startswith("/api/"):
            self._send_json(404, {"error": "Endpoint not found"})
            return
        self._dispatch_api("POST", read_body=True)

    def do_PUT(self) -> None:  # noqa: N802
        if not urlparse(self.path).path.startswith("/api/"):
            self._send_json(404, {"error": "Endpoint not found"})
            return
        self._dispatch_api("PUT", read_body=True)

    def do_DELETE(self) -> None:  # noqa: N802
        if not urlparse(self.path).path.startswith("/api/"):
            self._send_json(404, {"error": "Endpoint not found"})
            return
        self._dispatch_api("DELETE")


class StrictIPv4HTTPServer(ThreadingHTTPServer):
    address_family = socket.AF_INET
    allow_reuse_address = False


class StrictIPv6HTTPServer(ThreadingHTTPServer):
    address_family = socket.AF_INET6
    allow_reuse_address = False

    def server_bind(self) -> None:
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 1)
        super().server_bind()


def _try_start_pair(port: int) -> list[ThreadingHTTPServer]:
    started: list[ThreadingHTTPServer] = []
    for cls, host in ((StrictIPv4HTTPServer, "127.0.0.1"), (StrictIPv6HTTPServer, "::1")):
        try:
            srv = cls((host, port), MuseumRequestHandler)
            thread = threading.Thread(target=srv.serve_forever, daemon=True)
            thread.start()
            started.append(srv)
        except OSError as exc:
            print(f"[museum] Could not bind {host}:{port} ({exc})", file=sys.stderr)
    return started


def main() -> None:
    requested_ports = [int(sys.argv[1])] if len(sys.argv) > 1 else [3000, 8080]
    servers: list[ThreadingHTTPServer] = []
    bound_ports: list[int] = []

    for port in requested_ports:
        pair = _try_start_pair(port)
        if pair:
            servers.extend(pair)
            bound_ports.append(port)

    if not servers:
        print("Error: Could not bind any requested port.", file=sys.stderr)
        sys.exit(1)

    for port in bound_ports:
        print(f"The Museum of Us server listening on http://localhost:{port} (and http://127.0.0.1:{port})")
    sys.stdout.flush()

    stop_event = threading.Event()
    try:
        stop_event.wait()
    except KeyboardInterrupt:
        pass
    finally:
        for srv in servers:
            srv.shutdown()
            srv.server_close()


if __name__ == "__main__":
    main()
