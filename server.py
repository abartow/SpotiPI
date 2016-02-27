import sys
from web_server import CGIWebServer
from music_player import SpotifyMusicPlayer
from lib.queue_file import QueueFromFile

track_uri_queue = QueueFromFile("queue.txt")

music_player = SpotifyMusicPlayer()

# If the user has specified a username and password as command line arguments,
# attempt to login with those. Otherwise, attempt to use our remembered credentials.
if len(sys.argv) >= 3:
	print "Attempting to login as " + sys.argv[1]
	login_attempt = music_player.login(sys.argv[1], sys.argv[2])
else:
	print "Attempting to login with remembered credentials."
	login_attempt = music_player.login()

if not login_attempt:
	print "Could not log in"
	exit()

web_server = CGIWebServer(8000)
web_server.start()

music_player.start_playback_loop(track_uri_queue)
