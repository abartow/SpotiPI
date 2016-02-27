#!/usr/bin/env python
# There's probably a better way to do this.
from lib.queue_file import QueueFromFile

import cgi
import json
print "Content-Type: text/html"
print 
# The webserver runs this file in the root directory of the project... 
track_uri_queue = QueueFromFile("queue.txt")

request = cgi.FieldStorage()
response = {}

try:
	if "action" in request:
		action = request["action"].value
		if action == "pop":
			response["result"] = track_uri_queue.pop()
		elif action == "clear":
			track_uri_queue.clear()
		elif action == "insert":
			item = request["item"].value
			track_uri_queue.insert(item)
		elif action == "remove":
			index = int(request["index"].value)
			track_uri_queue.remove(index)

	response["queue"] = track_uri_queue.to_list()
	response["success"] = True
except Exception as e:
	response["error"] = str(e)
	response["success"] = False

print json.dumps(response)