#!/usr/bin/env python3
"""Máy chủ tĩnh cho prototype Lá chắn số.
Thêm hai tiêu đề COOP/COEP để trình duyệt bật "cross-origin isolated": bộ khớp miệng của avatar
(ONNX wasm) nhờ đó chạy đa luồng, miệng nhép mượt. Dùng: python3 may-chu.py [cổng] [thư mục]"""
import sys, os, functools
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class H(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def log_message(self, *a): pass

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8018
    root = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(__file__))
    ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=root)).serve_forever()
