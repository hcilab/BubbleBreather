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

let collectableAnimation;
let collectablesTable;
let collectables;

let playerImage;
let playerInhaleAnimation;
let player;

let backgroundImage; // reyhan


function preload() {
	// @Reyhan - I've quickly made these assets as placeholders for now, but note that animations can be adjusted by editing the files specified in `loadAnimation()` below.
	// Note that if you add more / fewer animation frames, you may need to tweak the `frameDelay` field below, which specifies the speed of the animation (i.e., the number of game frames to delay before switching animation frames)
	collectableAnimation = loadAnimation('./assets/collectable-0.png', './assets/collectable-1.png');

	playerImage = loadImage('./assets/player_normal.png');
	playerInhaleAnimation = loadAnimation('./assets/player-inhale-0.png', './assets/player-inhale-1.png', './assets/player-inhale-2.png', './assets/player-inhale-3.png');

	backgroundImage = loadImage('./assets/background.png'); // reyhan

	// Note that `loadTable()` is asynchronous, so we have to divide level loading across preload() and setup() functions :(
	collectablesTable = loadTable('./assets/level-1.csv', 'csv', 'header');
}


function setup() {
	createCanvas(windowWidth, 600);

	// TODO: This binds the animation speed to the framerate of the game... is this how it's normally done, or is there a way to specify animation time in ms?
	collectableAnimation.frameDelay = 30;

	playerInhaleAnimation.frameDelay = 4;
	playerInhaleAnimation.looping = false;

	collectables = collectablesTable.getRows().map(r => new Collectable(r.getNum('ms'), r.getNum('lane'), r.getString('group')));
	player = new Player();
}


function draw() {
	clear();

	// A naive implementation of a continuous background with panning camera is to simply repeat the background image across the entire scene.
	// TODO: Only draw the visible images in each frame if this causes a performance hit.
	for (let x=0; x<sceneWidth; x+= backgroundImage.width) {
		image(backgroundImage, x, 0, backgroundImage.width, height);
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
			player.sprite.changeAnimation('inhale');
			setTimeout(function() { player.sprite.changeAnimation('normal') }.bind(this), 500);
			break;
		case 's':
			player.lane = 0;
			player.sprite.changeAnimation('normal');
			break;
	}
}



class Collectable {
	constructor(ms, lane, group) {
		this.ms = ms;
		this.lane = lane;
		this.group = group;

		this.sprite = createSprite(millisToXCoordinate(this.ms), laneToYCoordinate(this.lane));
		this.sprite.addAnimation('bubble', collectableAnimation);

		// TODO - might be better to just resize the actual images to desired size once we finalize the assets
		this.sprite.scale = 0.5;
	}
}


class Player {
	constructor() {
		this._lane = 0;
		this.sprite = (createSprite(millisToXCoordinate(millis()), laneToYCoordinate(this._lane)));
		this.sprite.addImage('normal', playerImage);
		this.sprite.addAnimation('inhale', playerInhaleAnimation);

		// TODO - might be better to just resize the actual image to desired size once we finalize the assets
		this.sprite.scale = 0.7;
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