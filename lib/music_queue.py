import spotify
import random
import os
import pickle
import threading

# Represents the SpotiPI Track Queue.
# The track queue contains all the manually queued tracks, but may also play
# tracks from a default playlist when there are no manually queued tracks.
# The music queue is loaded from a directory on disk.

# This class interfaces with the Spotify API to automatically manage track selection
# logic, but that decision may need to be reevaluated in the future if track selection logic
# becomes more complex, or the Spotify API changes.

class MusicQueue():
	# Rep Invariant: 
	# All methods using self.data must first call self.load_self_from_disk().
	# All methods mutating self.data must call self.write_self_to_file() when complete.

	# Argument path should point to a file where the MusicQueue can be stored.
	# A file will be created if one does not already exist.
	def __init__(self, path):
		# self.path contains the path to the file where this MusicQueue is stored.
		# self.data contains a dictionary with two elements:
		#     "queue" maps to a list containing Spotify URIs of that have been
		#        manually queued by users. The first item in the list is the URI
		#        of the currently playing item.
		#
		#      "fallback_playlist" maps to a URI of a playlist to play songs from when
		#        no manually songs have been manually queued, or empty string if no such
		#        playlist is set.
		self.path = path
		self.data = self.load_self_from_disk()

	# Override a few mative observors.
	def __str__(self):
		self.load_self_from_disk()
		return "[Queue: " + self.data["queue"].__str__() + ", Default Playlist: " + self.data["fallback_playlist"] + " @ " + self.path + "]"

	# Updates self.data with respect to disk data
	# Must be called before any logic using self.data
	def write_self_to_file(self):
		with open(self.path, "w") as queue_file:
			pickle.dump(self.data, queue_file)

	# Updates disk data with with contents of disk data
	# Must be called after any logic mutating self.data
	def load_self_from_disk(self):
		if os.path.exists(self.path):
			with open(self.path, "r") as queue_file:
				self.data = pickle.load(queue_file)
		else:
			self.data = {}
			self.data["queue"] = []
			self.data["fallback_playlist"] = ""
			with open(self.path, "w") as queue_file:
				pickle.dump(self.data, queue_file)


	# Removes an element at the given index
	# from the manual queue
	def remove(self, index_to_remove):
		self.load_self_from_disk()
		self.data["queue"].pop(index_to_remove)
		self.write_self_to_file()

	# Removes the currently playing track from the queue.
	def current_track_complete(self):
		self.load_self_from_disk()
		self.data["queue"].pop(0)
		self.write_self_to_file()
	
	# Clear the queue of manually queued songs, including the current song.
	def clear(self):
		self.load_self_from_disk()
		self.data["queue"] = []
		self.write_self_to_file()
	
	# Manually queues the track with the given URI
	def insert(self, track_uri):
		self.load_self_from_disk()
		self.data["queue"].append(track_uri)
		self.write_self_to_file()

	# Overwrite the playlist of songs to be chosen from when no songs are manually qued
	def set_fallback_playlist(self, playlist_uri):
		self.load_self_from_disk()
		self.data["fallback_playlist"] = playlist_uri
		self.write_self_to_file()

	# Unset the playlist of songs to be chosen when no songs are manually queued.
	def clear_fallback_playlist(self):
		self.load_self_from_disk()
		self.data["fallback_playlist"] = ""
		self.write_self_to_file()

	# Blocking call.
	#
	# Gets the next Track to be played.
	# Returns either the next manually queued song to be played,
	# of if there is none, a random song from the fallback playlist.
	# 
	# If a random song is selected from the fallback playlist, it is added
	# to the queue to maintain the invariant that the currently playing song
	# is always the first item in the queue. 
	#
	# If no fallback playlist is set, blocks until a song is manually queued.
	#
	# The returned track will always be loaded.

	def get_next_track(self, spotify_session):
		self.load_self_from_disk()
		if len(self.data["queue"]) > 0:
			return spotify_session.get_track(self.data["queue"][0]).load()
		elif not self.data["fallback_playlist"] == "":
			playlist = spotify_session.get_playlist(self.data["fallback_playlist"])
			playlist.load()
			random_track = random.choice(playlist.tracks)
			random_track.load()
			self.data["queue"].append(random_track.link.uri)
			return random_track.load()
		else:
			self.wait_for_next_change()
			return self.get_next_track(spotify_session)

	# Returns the list of URIs of manually queued songs with the currently playing
	# song as the first element.
	def get_queue_list(self):
		self.load_self_from_disk()
		return list(self.data["queue"])

	# Blocks until the QueueFromFile is modified.
	def wait_for_next_change(self):
		self.load_self_from_disk()
		initial_value = dict(self.data)

		value_changed = threading.Event()

		POLLING_INTERVAL_SECONDS = 0.25

		def poll_for_changes():
			self.load_self_from_disk()
			if not self.data == initial_value:
				value_changed.set()
			else:
				threading.Timer(POLLING_INTERVAL_SECONDS, poll_for_changes).start()

		poll_for_changes()
		value_changed.wait()

# For the test to work, there must be a remembered Spotify credential.
def test():
	print "Running tests..."
	import time
	session = spotify.Session()
	spotify.EventLoop(session).start()
	session.relogin()
	time.sleep(3)

	if os.path.exists("test_queue.txt"): os.remove("test_queue.txt")

	queue = MusicQueue("test_queue.txt")
	# Ensure we created a fresh queue.
	assert queue.get_queue_list() == []

	print "Queue Creation Test Passed"

	# Test basic queue operations
	queue.insert("spotify:track:4hTt1HfFo0l5VuCOxhSFup")
	assert queue.get_queue_list() == ["spotify:track:4hTt1HfFo0l5VuCOxhSFup"]
	queue.insert("spotify:track:7HzCxalzzYQOFb9a7Xs3j6")
	assert queue.get_queue_list() == ["spotify:track:4hTt1HfFo0l5VuCOxhSFup", "spotify:track:7HzCxalzzYQOFb9a7Xs3j6"]
	queue.remove(1)
	assert queue.get_queue_list() == ["spotify:track:4hTt1HfFo0l5VuCOxhSFup"]
	queue.clear()
	assert queue.get_queue_list() == []

	print "Basic Queue Operations Passed"

	# Test track selection/playlist management operations
	queue.set_fallback_playlist("spotify:user:abartow123:playlist:0x0YazVnty6kO5U2l5OD5E")
	assert queue.get_next_track(session).link.uri == "spotify:track:3ezkJgagRPZ39KCTrKcSI7"
	queue.insert("spotify:track:4hTt1HfFo0l5VuCOxhSFup")
	assert queue.get_next_track(session).link.uri == "spotify:track:4hTt1HfFo0l5VuCOxhSFup"
	queue.current_track_complete()
	queue.clear_fallback_playlist()
	assert queue.get_queue_list() == []

	print "Track selection tasks passed"

	# Test a handful of synchronous operations.
	def insertFromOtherThread():
		other_queue = MusicQueue("test_queue.txt")
		other_queue.insert("spotify:track:7HzCxalzzYQOFb9a7Xs3j6")

	testComplete = threading.Event()

	def onTestFailure():
		assert False
		testComplete.set()

	threading.Timer(0.25, insertFromOtherThread).start()
	failureWatchdog = threading.Timer(1, onTestFailure)
	failureWatchdog.start()

	def testNextTrack():
		assert queue.get_next_track(session).link.uri == "spotify:track:7HzCxalzzYQOFb9a7Xs3j6"
		print "-- Testing get_next_track() Passed -- "
		failureWatchdog.cancel()
		testComplete.set()

	threading.Thread(None, testNextTrack).start()
	
	testComplete.wait()

	print "Synchronous Operations Passed"

	# Clean up.
	os.remove("test_queue.txt")

	print "All Tests Pass. :D"

# Run our tests automatically when we're in main
if __name__ == "__main__":
	test()

