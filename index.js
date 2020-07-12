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
	let paintingList = select('#savedpaintings');
	let savedPaintings = getItem('savedPaintings');

	if (paintingList == null || savedPaintings == null) {
		return;
	}

	JSON.parse(savedPaintings).forEach((paintingID, index) => {
		let url = './pep.html?paintingid=' + paintingID;
		let linkText = (index+1) + ': ' + paintingID;
		let a = createA(url, linkText);

		let li = createElement('li');
		li.child(a);
		paintingList.child(li);
	});
}