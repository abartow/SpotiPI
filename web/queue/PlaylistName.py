#!/usr/bin/env python
import urllib2
import re
import cgi

print "Content-Type: text/html"
print

request = cgi.FieldStorage()

playlist_uri = request["uri"].value
playlist_response = urllib2.urlopen("https://open.spotify.com/embed?uri=" + playlist_uri)
playlist_response_text = playlist_response.read()

first_match = playlist_response_text.split('name">\n')
second_match = first_match[1].split(" by")

print second_match[0]