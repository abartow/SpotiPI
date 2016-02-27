import CGIHTTPServer
import BaseHTTPServer
import threading
import os

directory = "web/"

# Represents a CGI Capable Web Server listening on port, serving files from directory, with a cgi bin in
# the queue folder of that directory
class CGIWebServer():
	def __init__(self, port):
		self.port = port

	def start(self):
		httpd = BaseHTTPServer.HTTPServer(("", self.port), RequestHandler)
		print "Starting Web Server at Port: ", self.port
		# This should be thread safe because we get rid of our reference to httpd and the only thing
		# httpd has a reference to on this thread is self.port and self.port is immutable
		self.thread = threading.Thread(None, httpd.serve_forever, "Web Server Thread", ())
		self.thread.start()

class RequestHandler(CGIHTTPServer.CGIHTTPRequestHandler):
    cgi_directories = ["/queue"]

    def translate_path(self, path):
    	# This is a dirty hack.
    	# It causes the HTTP server to look for files in the web/ directory instead of the current one.
    	# I am only okay with it because I think the CGIBin will eventually go away.
    	return CGIHTTPServer.CGIHTTPRequestHandler.translate_path(self, directory + path)
