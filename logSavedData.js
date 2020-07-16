// Debugging utility that dumps all player saved data to a json file.

let unlockablesTable;
let unlockables;
let playerStats;
let savedPaintingIDs;


function preload() {
  unlockablesTable = loadTable('./assets/unlockables.csv', 'csv', 'header'); 
}

function setup() {
  noCanvas();

  console.log('Retrieving player stats...');
  playerStats = getItem('stats');
  console.log('Complete...\n');


  console.log('Retrieving player paintings...');
  savedPaintingIDs = getItem('savedPaintings');
  let savedPaintings = [];
  if (savedPaintingIDs != null) {
    console.log('\tSuccessfully retrieved painting ids...');
    JSON.parse(savedPaintingIDs).forEach((paintingID, index) => {
      console.log('\t\tRetrieving painting: ' + paintingID + '...');
      let paintingJSON = getItem(paintingID);
      savedPaintings.push(paintingJSON);
      console.log('\t\tComplete...\n');
    });
    console.log('\tComplete...\n');
  }

  console.log('Saving Player Data...');
  let data = {
    'stats': playerStats,
    'paintingIDs': savedPaintingIDs,
    'paintings': savedPaintings,
  };
  let w = createWriter('playerData.txt');
  w.print(JSON.stringify(data));
  w.close();
  console.log('Complete...\n');


  console.log('Saving Unlockables Table...');
  saveTable(unlockablesTable, 'unlockables.csv');
  console.log('Complete...\n');
}