/**
* This API interacts with the remote Queue server. It calls a handler method in
* the js.js file which we currently use to draw the page. */

var currentQueue = []
var currentFallbackPlaylist = "NONE"

function popItem(){
	$.ajax({
		url: "queue/QueueAPI.py",
		method: "POST",
		data: {action: "pop"},
		success: handleQueueAPIResponse
	});
}

function clearQueue(){
	$.ajax({
		url: "queue/QueueAPI.py",
		method: "POST",
		data: {action: "clear"},
		success: handleQueueAPIResponse
	});
}

function insertItemIntoQueue(item){
	$.ajax({
		url: "queue/QueueAPI.py",
		method: "POST",
		data: {action: "insert", item: item},
		success: handleQueueAPIResponse
	});
}

function removeItem(index){
	$.ajax({
		url: "queue/QueueAPI.py",
		method: "POST",
		data: {action: "remove", index: index},
		success: handleQueueAPIResponse
	});
}

function pollForUpdates(){
	$.ajax({
		url: "queue/QueueAPI.py",
		method: "GET",
		success: handleQueueAPIResponse
	});
}

function setFallbackPlaylist(playlistURI) {
	$.ajax({
		url: "queue/QueueAPI.py",
		method: "POST",
		data: {action: "set_fallback_playlist", playlist_uri: playlistURI},
		success: handleQueueAPIResponse
	});
}

function clearFallbackPlaylist() {
	$.ajax({
		url: "queue/QueueAPI.py",
		method: "POST",
		data: {action: "clear_fallback_playlist"},
		success: handleQueueAPIResponse
	});
}

function handleQueueAPIResponse(data){
	response = $.parseJSON(data)
	if (response["success"]) {
		if (response["queue"].toString() !== currentQueue) {
			currentQueue = response["queue"].toString()
			onQueueChanged(response["queue"].slice());
		}

		if (response["fallback_playlist"] !== currentFallbackPlaylist) {
			currentFallbackPlaylist = response["fallback_playlist"]
			onFallbackPlaylistChanged(currentFallbackPlaylist)
		}
	}
}