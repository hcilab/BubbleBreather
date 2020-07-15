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
        experiencePoints.html(playerStats.experiencePoints + ' points');
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
            thumb.setAttribute("scrolling","no");

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
    let colorData = [];
    for (let j = 0; j < unlockablesTable.getRowCount(); j++){
        let r = unlockablesTable.rows[j];

        let color =  {
                level: r.getNum('level'),
                startExp: r.getNum('startExp'),
                endExp: r.getNum('endExp'),
                color: {
                    name: r.getString('name'),
                    rgb: r.getString('rgb')
                }
            }
        colorData.push(color);
    }
    let paints = selectAll('.paint');
    paints.forEach((c, index)=> {
        if (index < colorData.length)
        {
            let colorText = document.createTextNode(colorData[index].color.name);
            c.child(colorText);
            let breakTag1 = document.createElement('br');
            c.child(breakTag1);
            let xpText = document.createTextNode(colorData[index].startExp + " points");
            c.child(xpText);
        }
    });
    if (playerStats) {
        let paintBubbles = selectAll('.paintBubble');
        const paintBubbleNames = document.querySelectorAll(".paintName");
        const paintBubblePoints = document.querySelectorAll(".paintPoints");

        playerStats.colors.forEach((c, index) => {
            try {
                paintBubbles[index].style('fill', c.rgb);
            } catch(error) {}
        });
    }
}
