#!/usr/bin/env python3
"""
Local dev server for Monthly Receipt.

Identical to `python3 -m http.server`, except every response gets
`Cache-Control: no-store` — plain http.server lets browsers cache
app.js/style.css/index.html, so an edit on disk can silently keep
showing the old version until a hard refresh. That's confusing enough
during development that it's worth a five-line wrapper.
"""
import http.server
import sys

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8791
    http.server.test(HandlerClass=NoCacheHandler, port=port)
