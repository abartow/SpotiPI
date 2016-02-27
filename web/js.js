var currentQueue = []
var lastLookupTimeMillis = 0
var numLookups = 0
var lookupRateLimitTimeout;

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

function insertItem(item){
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

function handleQueueAPIResponse(data){
	response = $.parseJSON(data)
	if (response["success"]) {
		if (response["queue"].toString() !== currentQueue) {
			console.log("redrawing")
			currentQueue = response["queue"].toString()
			nowPlayingItem = response["queue"].shift()
			drawQueue(response["queue"])
			drawNowPlaying(nowPlayingItem)
		}
	}
}

function drawNowPlaying(now_playing_data){
	if (now_playing_data == undefined) {
		$(".now-playing").hide()
		$("#not-playing-message").show()
	}else{
		getItemForUri(now_playing_data, function(nowPlayingItem){
			$("#not-playing-message").hide()
			$("#now-playing-title").html(titleForItem(nowPlayingItem))
			$("#now-playing-artist").html(artistsForItem(nowPlayingItem))
			$("#now-playing-album-art").attr("src", getAlbumArtURLForTrack(nowPlayingItem))
			$(".now-playing").show()
		});
	}
}


function handleSearchResultClick(event){
	$(".queue-button").remove()
	resultData = $(event.currentTarget).data("result-data")

	albumArtURL = getAlbumArtURLForTrack(resultData)
	queueButtonRow = $("<tr class='queue-button'><td colspan='2'><img class='album-art' src='" + albumArtURL + "' /></td></tr>")

	queueButton = $("<input type='button' class='btn btn-large btn-primary queue-button' value='Queue'>")
	queueButton.data("target-uri", getURIForItem(resultData))
	queueButton.click(queueButtonClick)

	queueButtonRow.children("td").append(queueButton)
	$(event.currentTarget).after(queueButtonRow);
}


function queueButtonClick(event){
	trackURI = $(event.currentTarget).data("target-uri")
	insertItem(trackURI)
	$(".queue-button").remove()
	$("#search-text").val("")
	searchSpotifyForText()
}

function drawQueue(queueList){
	$("#queue").empty()
	$("#queue").append("<tr class='header'><th>#</th><th>Title</th><th>Artist</th></tr>")
	if (queueList.length == 0) {
		$("#queue-empty-message").show()
		$("#queue").hide()
	}else{
		$("#queue-empty-message").hide()
		$("#queue").show()
	}

	$.each(queueList, function(position, queueURI){
		getItemForUri(queueURI, function(queueItem) {
			queueElement = $("<tr class='queue-item'></tr>");
			deleteButtonElement = $("<input type='button' class='queue-delete btn btn-sm btn-danger' value='X'/>")
			deleteButtonElement.data("item-position", position + 1)
			deleteButtonElement.click(queueItemDeleteClick)
			deleteButtonElement.hide()
			queueElement.append(deleteButtonElement)
			queueElement.append("<td class='position'>" + (position + 1) + "</td>");
			queueElement.append("<td>" + titleForItem(queueItem) + "</td><td>" + artistsForItem(queueItem) + "</td>");
			queueElement.click(queueItemDeleteToggle);
			$("#queue").append(queueElement);
		});
	})
}

function queueItemDeleteClick(event){
	removeItem($(event.currentTarget).data("item-position"));
}

function queueItemDeleteToggle(event){
	$(event.currentTarget).children(".position").toggle();
	$(event.currentTarget).children(".queue-delete").toggle();
}

function drawSearchResults(results){
	$("#search-results").empty()
	$("#search-results").append("<tr class='header'><th>Title</th><th>Artist</th></tr>")

	$.each(results, function(index, result){
		var searchResult = $("<tr class='search-result'><td>" + titleForItem(result) + "</td><td>" + artistsForItem(result) + "</td></tr>");
		searchResult.data("result-data", result)

		$("#search-results").append(searchResult);
	})

	$(".search-result").click(handleSearchResultClick)
}

function searchSpotifyForText(){
	numLookups++

	console.log("making request " + numLookups)
	textValue = $("#search-text").val()

	if (textValue === ""){
		$("#search-results").hide()
	} else {
		$("#search-results").show()
		searchSpotifyForTrack(textValue)
	}
}

function onSearchSubmit(event){
	searchSpotifyForText()
	event.preventDefault()
}

function searchSpotifyForTextRateLimited(){
	var millisSinceLastLookup = new Date().getTime() - lastLookupTimeMillis;
	if (millisSinceLastLookup > 1500){
		searchSpotifyForText()
		lastLookupTimeMillis = new Date().getTime()
	} else {
		clearTimeout(lookupRateLimitTimeout)
		lookupRateLimitTimeout = setTimeout(searchSpotifyForTextRateLimited, 1600 - millisSinceLastLookup)
	}
}

function onSearchKeypress(){
	console.log("keypress")
	searchSpotifyForTextRateLimited()
}

$().ready(function() {
	pollForUpdates();
	$("#clear-button").click(clearQueue)
	$("#pop-button").click(popItem)
	$("#search-form").submit(onSearchSubmit)
	$("#search-form").keyup(onSearchKeypress)

	setInterval(pollForUpdates, 10000)
})