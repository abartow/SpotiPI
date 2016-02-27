function searchSpotifyForTrack(query) {
	$.ajax({
		url: "https://api.spotify.com/v1/search",
		method: "GET",
		data: {q: query, type: "track"},
		success: handleTrackSearchResults
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
	type = uriComponents[1]
	id = uriComponents[2]
	apiRequestPath = "https://api.spotify.com/v1/" + type + "s/" + id

	$.ajax({
		url: apiRequestPath,
		success: callback
	})
}