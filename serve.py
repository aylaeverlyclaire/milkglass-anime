#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Milkglass Enterprise Media Services - Local Runtime Server
Initializes high-concurrency static delivery with CORS telemetry headers.
Access endpoint: http://localhost:8000
"""

import http.server
import socketserver
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def main():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print("=" * 60)
        print("    MILKGLASS MEDIA SERVICES - LOCAL GATEWAY SERVER        ")
        print("=" * 60)
        print(f" Endpoint Location  : http://localhost:{PORT}")
        print(f" Working Directory  : {DIRECTORY}")
        print(" Press Ctrl+C to terminate gateway execution.")
        print("=" * 60 + "\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nGateway server terminated.")

if __name__ == "__main__":
    main()
