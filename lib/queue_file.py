# I didn't really like any of the existing file system stored queues for Python
# They were all either too heavy for this project or not abstracted away enough.
# Thus, this class.

# Represents a Queue of Objects stored in a file on disk at path. 
# If no file exists at path, it creates one.
# All changes made by this class are automatically represented on disk and this class automatically loads
# any outside changes from disk.
#
# QueueFromFile's should not contain many objects, operations are not written with runtime
# considerations in mind.

import os
import pickle
import threading

class QueueFromFile():
	# Rep Invariant: 
	# All methods using self.list must first call self.load_self_from_disk().
	# All methods mutating self.list must call self.write_self_to_file() when complete.

	def __init__(self, path):
		self.path = path
		self.list = self.load_self_from_disk()

	# Override a few native observers.

	def __str__(self):
		self.load_self_from_disk()
		return self.list.__str__() + " from " + os.path.abspath(self.path)

	def __len__(self):
		self.load_self_from_disk()
		return len(self.list)

	def write_self_to_file(self):
		with open(self.path, "w") as queue_file:
			pickle.dump(self.list, queue_file)

	def load_self_from_disk(self):
		if os.path.exists(self.path):
			with open(self.path, "r") as queue_file:
				self.list = pickle.load(queue_file)
		else:
			self.list = []
			with open(self.path, "w") as queue_file:
				pickle.dump(self.list, queue_file)

	def clear(self):
		self.list = []
		self.write_self_to_file()
	
	def insert(self, item):
		self.load_self_from_disk()
		self.list.append(item)
		self.write_self_to_file()

	def pop(self):
		self.load_self_from_disk()
		popped_item = self.list.pop(0)
		self.write_self_to_file()
		return popped_item

	def peek(self):
		self.load_self_from_disk()
		return self.list[0]

	def to_list(self):
		self.load_self_from_disk()
		return list(self.list)

	# Removes an element at the given index
	def remove(self, index_to_remove):
		self.load_self_from_disk()
		self.list.pop(index_to_remove)
		self.write_self_to_file()

	# Blocks until the QueueFromFile is modified.
	def wait_for_next_change(self):
		self.load_self_from_disk()
		initial_value = list(self.list)

		value_changed = threading.Event()

		POLLING_INTERVAL_SECONDS = 0.25

		def poll_for_changes():
			self.load_self_from_disk()
			if not self.list == initial_value:
				value_changed.set()
			else:
				threading.Timer(POLLING_INTERVAL_SECONDS, poll_for_changes).start()

		poll_for_changes()
		value_changed.wait()
		


