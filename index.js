function setup() {
	noCanvas();
	populatePlayerStats();
}

function populatePlayerStats() {
	let p = select('#playerStatsP');
	if (p != null) {
		let playerStats = JSON.parse(getItem('stats'))
		let content = playerStats == null ? "You haven't collected any bubbles yet!" : JSON.stringify(playerStats);
		p.html(content);
	}
}