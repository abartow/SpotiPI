
var lastLookupTimeMillis = 0
var numLookups = 0
var lookupRateLimitTimeout;

function onQueueChanged(newQueue){
	// Redraw the page when the Queue changes. 
	console.log("redrawing")
	nowPlayingItem = newQueue.shift()
	drawQueue(newQueue)
	drawNowPlaying(nowPlayingItem)
}

function onFallbackPlaylistChanged(playlistURI) {
	console.log("playlist changed")
	drawFallbackPlaylist(playlistURI)
}

function drawFallbackPlaylist(playlistURI) {
	$("#fallback-playlist-name").show()
	$("#fallback-playlist-search").hide()
	$("#fallback-playlist-icon").removeClass("glyphicon-remove");
	$("#fallback-playlist-icon").addClass("glyphicon-pencil");

	if (playlistURI == null){
		$("#fallback-playlist-name").text("None")
	} else {
		getNameOfPlaylist(playlistURI, function(playlistName) {
			$("#fallback-playlist-name").text(playlistName)
		})
	}
}

function drawNowPlaying(nowPlayingURI){
	if (nowPlayingURI == undefined) {
		$(".now-playing").hide()
		$("#not-playing-message").show()
	}else{
		getItemForUri(nowPlayingURI, function(nowPlayingItem){
			$("#not-playing-message").hide()
			$("#now-playing-title").html(titleForItem(nowPlayingItem))
			$("#now-playing-artist").html(artistsForItem(nowPlayingItem))
			$("#now-playing-album-art").attr("src", getAlbumArtURLForTrack(nowPlayingItem))
			$(".now-playing").show()
		});
	}
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
	insertItemIntoQueue(trackURI)
	$(".queue-button").remove()
	$("#search-text").val("")
	searchSpotifyForText()
}

function queueItemDeleteClick(event){
	removeItem($(event.currentTarget).data("item-position"));
}

function queueItemDeleteToggle(event){
	$(event.currentTarget).children(".position").toggle();
	$(event.currentTarget).children(".queue-delete").toggle();
}

function onSearchKeypress(){
	console.log("keypress")
	searchSpotifyForTextRateLimited()
}

function onSearchSubmit(event){
	searchSpotifyForText()
	event.preventDefault()
}

function onFallbackPlaylistClick(){
	$("#fallback-playlist-name").toggle()
	$("#fallback-playlist-search").toggle()

	if ($("#fallback-playlist-icon").hasClass("glyphicon-pencil")) {
		$("#fallback-playlist-icon").addClass("glyphicon-remove");
		$("#fallback-playlist-icon").removeClass("glyphicon-pencil");
	} else {
		$("#fallback-playlist-icon").removeClass("glyphicon-remove");
		$("#fallback-playlist-icon").addClass("glyphicon-pencil");
	}
}

function fallbackPlaylistAutocomplete(request, responseCallback){
	searchSpotifyForPlaylist(request.term, function(playlistArray) {
		playlistAutocompleteResult = [{label: "None", value: null}]
		$.each(playlistArray, function(index, playlistItem){
			playlistAutocompleteResult.push({label: titleForItem(playlistItem), value: getURIForItem(playlistItem)});
		})
		responseCallback(playlistAutocompleteResult)
	});
}

function onFallbackPlaylistSelect(event, ui) {
	event.preventDefault()

	if (ui.item.value == "None") {
		clearFallbackPlaylist();
	} else {
		setFallbackPlaylist(ui.item.value)
	}

	/* Revert the UI State to give some immediate feedback */

	$("#fallback-playlist-name").show()
	$("#fallback-playlist-search").hide()
	$("#fallback-playlist-icon").removeClass("glyphicon-remove");
	$("#fallback-playlist-icon").addClass("glyphicon-pencil");

}

function cancelEventPropigation(event){
	event.stopPropagation()
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


$().ready(function() {
	pollForUpdates();
	$("#clear-button").click(clearQueue)
	$("#pop-button").click(popItem)
	$("#search-form").submit(onSearchSubmit)
	$("#search-form").keyup(onSearchKeypress)
	$("#fallback-playlist-search").click(cancelEventPropigation)
	$("#fallback-playlist-tag").click(onFallbackPlaylistClick)
		$("#fallback-playlist-search").autocomplete({
		source: fallbackPlaylistAutocomplete,
		select: onFallbackPlaylistSelect
	})

	setInterval(pollForUpdates, 10000)
})