let unlockablesTable;
let playerStats;

function preload()
{
	unlockablesTable = loadTable('./assets/unlockables.csv', 'csv', 'header'); 
}
function setup() {
	noCanvas();
    playerStats = JSON.parse(getItem('stats'));
	populatePlayerStats();
	populateSavedPaintings();
    populateColors();
}

function populatePlayerStats() {
	let playerLevel = select('#playerLevel');
    let experiencePoints = select('#experiencePoints');
    let stackedBreathingCount = select ('#stackedBreathingCount');

    if (playerStats) {
        playerLevel.html('Level: ' + playerStats.level.level);
        experiencePoints.html(playerStats.experiencePoints + ' exp.');
        stackedBreathingCount.html(playerStats.stackCount + ' stacks');
    }
}

function populateSavedPaintings() {
	let paintingList = select('.thumbmenu');
	let savedPaintings = getItem('savedPaintings');

	if (paintingList == null || savedPaintings == null) {
		return;
	}

	JSON.parse(savedPaintings).forEach((paintingID, index) => {
        let paintingLink = document.createElement('a');
        paintingLink.setAttribute("href","./pep.html?paintingid="+paintingID);
        paintingLink.setAttribute("class","linkwrap");

        let iframeBlocker = document.createElement('div');
        iframeBlocker.setAttribute("class","blocker");

        paintingLink.appendChild(iframeBlocker);

		let url = './thumbnail.html?paintingid=' + paintingID;
		let thumb = document.createElement('iframe');
        thumb.setAttribute("src",url);
        thumb.setAttribute("class","thumbFrame");

        paintingLink.appendChild(thumb);
		paintingList.child(paintingLink);
	});
}

function parsePlayerStats(statsJSON)
{
    let statsDiv = document.createElement('div');
    let xpHead = document.createElement('h3');
    xpHead.innerText = "Experience: " + statsJSON.experiencePoints + " points";
    
    statsDiv.append(xpHead);
    return statsDiv.outerHTML;
}

function populateColors()
{
    if (playerStats) {
        let paintBubbles = selectAll('.paintBubble');
        playerStats.colors.forEach((c, index) => {
            paintBubbles[index].style('fill', c.rgb);
        });
    }
}