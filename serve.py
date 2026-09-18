import http.server, socketserver, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
print("serving", os.getcwd(), flush=True)
print("has index.html:", os.path.exists("index.html"), flush=True)
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", 8777), http.server.SimpleHTTPRequestHandler) as httpd:
    httpd.serve_forever()
