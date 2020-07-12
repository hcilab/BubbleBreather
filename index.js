let stats;

function preload() {
	stats = JSON.parse(getItem('stats'));
}

function setup() {
	noCanvas();
	let p = select('#playerStatsP');
	if (p != null) {
		let content = stats == null ? "You haven't collected any bubbles yet!" : JSON.stringify(stats);
		p.html(content);
	}
}