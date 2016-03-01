#!/usr/bin/env python
from lib.music_queue import MusicQueue

import cgi
import json
print "Content-Type: text/html"
print 
# The webserver runs this file in the root directory of the project... 
music_queue = MusicQueue("queue.txt")

request = cgi.FieldStorage()
response = {}

try:
	if "action" in request:
		action = request["action"].value
		if action == "clear":
			music_queue.clear()
		elif action == "insert":
			item = request["item"].value
			music_queue.insert(item)
		elif action == "remove":
			index = int(request["index"].value)
			music_queue.remove(index)
		elif action == "clear_fallback_playlist":
			music_queue.clear_fallback_playlist()
		elif action == "set_fallback_playlist":
			playlist_uri = request["playlist_uri"].value
			music_queue.set_fallback_playlist(playlist_uri)

	response["fallback_playlist"] = music_queue.get_fallback_playlist()
	response["queue"] = music_queue.get_queue_list()
	response["success"] = True
except Exception as e:
	response["error"] = str(e)
	response["success"] = False

print json.dumps(response)