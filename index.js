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
	let p = select('#playerStatsP');
	if (p != null) {
		let content = playerStats == null ? "You haven't collected any bubbles yet!" : parsePlayerStats(playerStats);
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
    unlockablesTable.getRows().forEach(r => {
        let color =  {
                level: r.getNum('level'),
                startExp: r.getNum('startExp'),
                endExp: r.getNum('endExp'),
                color: {
                    name: r.getString('name'),
                    rgb: r.getString('rgb')
                }
            }
        addColorCollectable(color);
    });
}

function addColorCollectable(collectable)
{
    let colorContainer = document.createElement('div');
    colorContainer.setAttribute('class','colorContainer');
    let color = document.createElement('div');
    color.setAttribute('class','colorCollectable');
    if (playerStats == null || playerStats.level.level < collectable.level) {
        color.setAttribute('style','background: rgb(128, 128, 128)');
    } else {
        color.setAttribute('style','background: ' + collectable.color.rgb);
    }
    colorContainer.appendChild(color);

    let breakTag1 = document.createElement('br');
    colorContainer.appendChild(breakTag1);

    let colorText = document.createTextNode(collectable.color.name);
    colorContainer.appendChild(colorText);

    let breakTag2 = document.createElement('br');
    colorContainer.appendChild(breakTag2);

    let xpText = document.createTextNode(collectable.startExp + " points");
    colorContainer.appendChild(xpText);

	let colorMenu = select('.colorMenu');
    colorMenu.child(colorContainer);
}
