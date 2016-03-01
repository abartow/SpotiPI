function searchSpotifyForTrack(query) {
	$.ajax({
		url: "https://api.spotify.com/v1/search",
		method: "GET",
		data: {q: query, type: "track"},
		success: handleTrackSearchResults
	})
}

/* Searches Spotify for playlists that match the given query.
   Calls the callback with an array of playlist objects in order of relevance
   by Spotify */
function searchSpotifyForPlaylist(query, callback){
	$.ajax({
		url: "https://api.spotify.com/v1/search",
		method: "GET",
		data: {q: query, type: "playlist"},
		success: function(data) {
			callback(data["playlists"]["items"])
		}
	})
}

function handleTrackSearchResults(data) {
	results = data["tracks"]["items"]
	drawSearchResults(results)
}

function titleForItem(item) {
	switch (item["type"]) {
		case "track":
			return  item["name"]
		case "artist":
			return item["name"];
		case "playlist":
			return item["name"];
	}
}

function artistsForItem(item){
	switch(item["type"]){
		case "track":
			var artistsNames = []
			$.each(item["artists"], function(index, artist) {
				artistsNames.push(titleForItem(artist))
			});
			return artistsNames.join(", ");
		case "artist":
			return titleForItem(item)
	}
}

function getURIForItem(item) {
	return item["uri"]
}

function getAlbumArtURLForTrack(track){
	return track["album"]["images"][1]["url"];
}


function getItemForUri(uri, callback) {
	uriComponents = uri.split(":")
	apiRequestPath = "https://api.spotify.com/v1/"
	for (var i = 1; i < uriComponents.length; i = i + 2){
		apiRequestPath += uriComponents[i] + "s/"
		apiRequestPath += uriComponents[i+1] + "/"
	}

	$.ajax({
		url: apiRequestPath,
		success: callback
	})
}

/* This request has to go through our servers because the Spotify Web API
 * doesn't have an easy way to do this */
function getNameOfPlaylist(playlist_uri, callback){
	$.ajax({
		url: "queue/PlaylistName.py",
		data: {uri: playlist_uri},
		success: callback,
	})
}
