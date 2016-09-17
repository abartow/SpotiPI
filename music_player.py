import spotify
import threading
import platform

LOGIN_TIMEOUT = 10

class SpotifyMusicPlayer():
	def __init__(self):
		self.is_logged_in = False

		 # We assume a spotify_appkey.key is in the current directory
		self.session = spotify.Session()
		# Process Spotify events automatically in the background
		loop = spotify.EventLoop(self.session)
		loop.start()

		# Connect to the AlsaAudio Sink, which works best for the Pi if you're on Linux,
		# but otherwise connect to the more versatile PortAudio sink
		if platform.system() == "Linux":
			audio = spotify.AlsaSink(self.session)
		else:
			audio = spotify.PortAudioSink(self.session)

	# Logs the user in with the credentials specified. 
	# This call blocks until either login is completed successfully or
	# for for LOGIN_TIMEOUT seconds, in which case the login times out.
	# Returns the login status on completion.
	def login(self, username=None, password=None):
		login_complete = threading.Event()

		def on_connection_state_updated(session):
			if session.connection.state is spotify.ConnectionState.LOGGED_IN:
				self.is_logged_in = True
				login_complete.set()

		def on_login_timeout():
			print "Login Timeout!"
			login_complete.set()

		# Register a connection state event listener so we can tell when the user is logged in.
		self.session.on(spotify.SessionEvent.CONNECTION_STATE_UPDATED, on_connection_state_updated)

		# Attempt to log the user in.		
		if username == None and password == None:
			self.session.relogin()
		else:
			self.session.login(username, password, True)

		# Create a watchdog timer so we can timeout if login fails.
		login_watchdog = threading.Timer(LOGIN_TIMEOUT, on_login_timeout)
		login_watchdog.start()

		login_complete.wait()

		# Cancel the watchdog.
		login_watchdog.cancel()

		return self.is_logged_in

	# Plays the tracks on the queue in order.
	# If no tracks are on the queue, waits until there are some.
	# You must be logged in before the server can be started.
	# Blocks forever.
	def start_playback_loop(self, music_queue): 
		if not self.is_logged_in:
			raise RuntimeError("start_playback() called without user logged in.")

		print "Starting playback loop with queue: " + music_queue.__str__()

		def playbackLoop():
			while True:
				self.play_track(music_queue.get_next_track(self.session))
				music_queue.current_track_complete()

		playbackThread = threading.Thread(target=playbackLoop)
		playbackThread.start()

	# Plays back a given Spotify track.
	# Blocks until track playback is complete.
	def play_track(self, track):
		playback_block = threading.Event()

		# Create and register an event listener so we know when track playback is complete.
		def on_end_of_track(session):
			playback_block.set()

		self.session.on(spotify.SessionEvent.END_OF_TRACK, on_end_of_track)

		self.session.player.load(track)
		self.session.player.play()

		playback_block.wait()


def test():
	player = SpotifyMusicPlayer()
	player.relogin()
	player.start_playback_loop()
