function setup() {
	noCanvas();
	populatePlayerStats();
	populateSavedPaintings();
}

function populatePlayerStats() {
	let p = select('#playerStatsP');
	if (p != null) {
		let playerStats = JSON.parse(getItem('stats'))
		let content = playerStats == null ? "You haven't collected any bubbles yet!" : JSON.stringify(playerStats);
		p.html(content);
	}
}

function populateSavedPaintings() {
	let paintingList = select('.thumbmenu');
	let savedPaintings = getItem('savedPaintings');

	if (paintingList == null || savedPaintings == null) {
		return;
	}

	JSON.parse(savedPaintings).forEach((paintingID, index) => {
		let url = './thumbnail.html?paintingid=' + paintingID;
		let thumb = createElement('iframe');
        thumb.setAttribute("src",url);
        thumb.setAttribute("class","thumbFrame");

		paintingList.child(thumb);
	});
}
