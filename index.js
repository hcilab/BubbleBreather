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
        playerLevel.html('Level ' + playerStats.level.level);
        experiencePoints.html(playerStats.experiencePoints + ' exp.');
        stackedBreathingCount.html(playerStats.stackCount + ' stacks');
    }
}

function populateSavedPaintings() {
	let gallary = select('#paintingGallary');
    let firstPaintingDiv = select('#paintingFirst');
    let remainingPaintingsContainer = select('#remainingPaintings');

	let savedPaintings = getItem('savedPaintings');
    if (savedPaintings != null) {
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

            if (index == 0) {
                firstPaintingDiv.child(paintingLink);
            } else {
                remainingPaintingsContainer.child(paintingLink);
            }
    	});
    }
}

function populateColors()
{
    if (playerStats) {
        let paintBubbles = selectAll('.paintBubble');
        const paintBubbleNames = document.querySelectorAll(".paintName");
        const paintBubblePoints = document.querySelectorAll(".paintPoints");

        playerStats.colors.forEach((c, index) => {
            try {
                paintBubbles[index].style('fill', c.rgb);
                paintBubbleNames[index].innerText = c.name;
                // Autogenerating required points
                paintBubblePoints[index].innerText = `${2 * index}k points`;
            } catch(error) {}
        });
    }
}