// Bubble Breather - A Breath Stacking Game
//
// Levels:
// 	Levels are loaded from a .csv file (found in assets dir)
// 	Spreadsheet used to create these is available here: https://docs.google.com/spreadsheets/d/1EMdsuHLxHxM107lujpxUd5WzHg9HWskol0aKs4jyVtQ/edit#gid=968389484
//
// Controls:
// 	W - Jump up one level
//  S - Return to bottom level
//
// Running Locally:
//	When run locally, this game must be hosted through a web-server...
//	I've been using: `http-server-ssl -S -c-1`



// The level input file specifies y-positions in `lane` units (0 -> no stack; [1-4] -> stacked breaths)
let laneCoordinates = [500, 400, 300, 200, 100];
function laneToYCoordinate(lane) {
	return laneCoordinates[lane];
}

// Similarly, input coordinates are specified as time offsets (ms), making it easier to design levels that align with breath stacking timing requiremets (e.g., hold for 2 seconds...)
// These parameters can be tweaked to adjust the speed of the game
let levelDurationMillis = 120000;
let sceneWidth = 12000;
function millisToXCoordinate(ms) {
	return map(ms, 0, levelDurationMillis, 0, sceneWidth);
}


// Keep all of progress statistics in a single JSON object... this will make it easy to save / load from window.localstorage
let stats = {
	score: 0,
	stacks: 0,
}

let collectableImage;
let collectablesTable;
let collectables;

let playerImage;
let playerImageInhale; // reyhan
let player;

let backgroundImage; // reyhan
let x1 = 0; // reyhan
let x2; // reyhan

let scrollSpeed = 1; // reyhan


function preload() {
	collectableImage = loadImage('./assets/collectable.png');
	playerImage = loadImage('./assets/player_normal.png');
	playerImageInhale = loadImage('./assets/player_inhale.png'); // reyhan
	backgroundImage = loadImage('./assets/background.png'); // reyhan

	// Note that `loadTable()` is asynchronous, so we have to divide level loading across preload() and setup() functions :(
	collectablesTable = loadTable('./assets/level-1.csv', 'csv', 'header');
}


function setup() {
	createCanvas(windowWidth, 600);
	collectables = collectablesTable.getRows().map(r => new Collectable(r.getNum('ms'), r.getNum('lane'), r.getString('group')));
	player = new Player();
	x2 = width; // reyhan
}


function draw() {
	clear();

	// continous scrolling background, still buggy: does not repeat the background image
	image(backgroundImage, x1, 0, width, height); // reyhan
	image(backgroundImage, x2, 0, width, height); // reyhan

	x1 -= scrollSpeed; // reyhan
	x2 -= scrollSpeed; // reyhan

	if (x1 < -width) { // reyhan
		x1 = width;
	}
	if (x2 < -width) { // reyhan
		x2 = width;
	}

	// Player moves at a uniform horizontal speed across the level with scrolling camera
	player.sprite.position.x = millisToXCoordinate(millis());
	camera.position.x = player.sprite.position.x + 0.4*width;


	// Test for collisions with collectables
	// Note that sprite and collectable must be removed separately (p5.game maintains an internal list of sprites)
	collectables.forEach((collectable, index, array) => {
		if (collectable.sprite.overlap(player.sprite)) {
			stats.score += 100;
			collectable.sprite.remove();
			array.splice(index, 1);
		}
	});

	// Uncomment this line to display collision boxes for all sprites
	//getSprites().forEach(s => s.debug = true);

	drawSprites();

	// This disables the camera's virtual coordinate system for the remainder of the frame...
	// This allows score to be drawn relative to current `viewport`, as opposed to the scene
	camera.off();
	drawScore();
}

function drawScore() {
	push();
	stroke(255);
	fill(255);
	textSize(32);
	text(stats.score, 50, 50);
}

// Stubbed keyboard controls for now...
function keyPressed() {
	switch (key) {
		case 'w':
			player.lane = Math.min(player.lane + 1, 4);
			player.sprite.addImage(playerImageInhale); // reyhan - inhale sprite
			// @Reyhan - animation sequences can be fired here: http://molleindustria.github.io/p5.play/docs/classes/Sprite.html#method-changeAnimation
			// You may even want to "jump" play the animation for a set amount of time, then switch back to regular one using a timeout:
					// player.setAnimation('jump');
					// setTimeout(() => player.setAnimation('normal'), 1000);
			break;
		case 's':
			player.lane = 0;
			player.sprite.addImage(playerImage); // reyhan - exhale sprite
			// @Reyhan - similar idea here... maybe we want some kind of ground-pound animation when they exhale or something...
			break;
	}
}



class Collectable {
	constructor(ms, lane, group) {
		this.ms = ms;
		this.lane = lane;
		this.group = group;

		this.sprite = createSprite(millisToXCoordinate(this.ms), laneToYCoordinate(this.lane));
		this.sprite.addImage(collectableImage);
		this.sprite.scale = 0.5; // reyhan - rescaled sprite

		// @Reyhan - animation sequences can be defined here: http://molleindustria.github.io/p5.play/docs/classes/Sprite.html#method-addAnimation
	}
}


class Player {
	constructor() {
		this._lane = 0;
		this.sprite = (createSprite(millisToXCoordinate(millis()), laneToYCoordinate(this._lane)));
		this.sprite.addImage(playerImage); 
		this.sprite.scale = 0.7; // reyhan - rescaled sprite
		// @Reyhan - animation sequences can be defined here: http://molleindustria.github.io/p5.play/docs/classes/Sprite.html#method-addAnimation
	}

	get lane() {
		return this._lane;
	}

	set lane(lane) {
		this._lane = lane;
		this.sprite.position.y = laneToYCoordinate(this._lane);
		this.sprite.scale = 0.7 + (this._lane * 0.1); // reyhan - rescaled sprite
	}
}