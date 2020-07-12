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
let levelStartMillis = -1;
let sceneWidth = 12000;
function millisToXCoordinate(ms) {
	return map(ms, 0, levelDurationMillis, 0, sceneWidth);
}


// A csv file that stores information about the unlockable system. Each row contains:
// 	level - the player level at which this unlockable is obtained
//	startExp - the amount of experience points needed to reach this level
//	endExp - the amount of experience points needed to reach this level
//  name - the plain text "name" of the color unlocked at this level
//	rgb - the RGB string for this color (can be passed to p5.createColor())
let unlockablesTable;
let unlockables;


let collectableAnimation;
let collectablesTable;
let collectables;

let playerImage;
let playerInhaleAnimation;
let player;

let experiencePointsBar;
let levelUpAnimation;

let backgroundImage; // reyhan


function preload() {
	// @Reyhan - I've quickly made these assets as placeholders for now, but note that animations can be adjusted by editing the files specified in `loadAnimation()` below.
	// Note that if you add more / fewer animation frames, you may need to tweak the `frameDelay` field below, which specifies the speed of the animation (i.e., the number of game frames to delay before switching animation frames)
	collectableAnimation = loadAnimation('./assets/collectable-0.png', './assets/collectable-1.png');

	playerImage = loadImage('./assets/player_normal.png');
	playerInhaleAnimation = loadAnimation('./assets/player-inhale-0.png', './assets/player-inhale-1.png', './assets/player-inhale-2.png', './assets/player-inhale-3.png');

	// TODO: I think might be a little bit hacky...
	// To make this animation appear only at specific times, I've put a completely empty png as the first and last frame of the animation. Whenever I want it to play, I simply rewind and play.
	// While animations do have a `visible` property, using this would be a little more complicated because I'd somehow have to asychronously turn off visibility after the animation finishes...
	levelUpAnimation = loadAnimation('./assets/empty.png', './assets/level-up-0.png','./assets/level-up-1.png','./assets/level-up-2.png','./assets/level-up-3.png', './assets/empty.png');
	levelUpAnimation.looping = false;
	levelUpAnimation.goToFrame(levelUpAnimation.getLastFrame());

	backgroundImage = loadImage('./assets/background.png'); // reyhan

	// Note that `loadTable()` is asynchronous, so we have to divide level loading across preload() and setup() functions :(
	collectablesTable = loadTable('./assets/level-1.csv', 'csv', 'header');
	unlockablesTable = loadTable('./assets/unlockables.csv', 'csv', 'header');
}


function setup() {
	createCanvas(windowWidth, 600);

	// TODO: This binds the animation speed to the framerate of the game... is this how it's normally done, or is there a way to specify animation time in ms?
	collectableAnimation.frameDelay = 30;

	playerInhaleAnimation.frameDelay = 4;
	playerInhaleAnimation.looping = false;

	collectables = collectablesTable.getRows().map(r => new Collectable(r.getNum('ms'), r.getNum('lane'), r.getString('group')));
	unlockables = unlockablesTable.getRows().map(function(r) {
		return {
			level: r.getNum('level'),
			startExp: r.getNum('startExp'),
			endExp: r.getNum('endExp'),
			color: {
				name: r.getString('name'),
				rgb: r.getString('rgb'),
			},
		}
	});

	player = new Player();
	experiencePointsBar = new ExperiencePointsBar(20, 20, 0.2 * width, 20);
	experiencePointsBar.configureForPlayer(player);
}


function draw() {
	clear();

	// A naive implementation of a continuous background with panning camera is to simply repeat the background image across the entire scene.
	// TODO: Only draw the visible images in each frame if this causes a performance hit.
	for (let x=-backgroundImage.width; x<sceneWidth; x+= backgroundImage.width) {
		image(backgroundImage, x, 0, backgroundImage.width, height);
	}

	if (levelStartMillis != -1 && millis()-levelStartMillis <= levelDurationMillis) {
		// Player moves at a uniform horizontal speed across the level with scrolling camera
		player.sprite.position.x = millisToXCoordinate(millis()-levelStartMillis);

		// Test for collisions with collectables
		// Note that sprite and collectable must be removed separately (p5.game maintains an internal list of sprites)
		collectables.forEach((collectable, index, array) => {
			if (collectable.sprite.overlap(player.sprite)) {
				addScore(100);
				checkForLevelUp();
				collectable.sprite.remove();
				array.splice(index, 1);
			}
		});
	}
	camera.position.x = player.sprite.position.x + 0.4*width;

	// Uncomment this line to display collision boxes for all sprites
	//getSprites().forEach(s => s.debug = true);

	drawSprites();

	// This disables the camera's virtual coordinate system for the remainder of the frame...
	// This allows score to be drawn relative to current `viewport`, as opposed to the scene
	camera.off();
	experiencePointsBar.draw();
	levelUpAnimation.draw(150, 50);

	if (levelStartMillis == -1) {
		drawTitleCard();
	}

	if (millis()-levelStartMillis > levelDurationMillis) {
		drawEndCard();
	}
}

function addScore(n) {
	experiencePointsBar.val += 100;
	player.stats.experiencePoints += 100;
	player.save();
}

function checkForLevelUp() {
	if (player.stats.experiencePoints >= player.stats.level.endExp) {
		levelUpAnimation.rewind();
		levelUpAnimation.play();
		let nextLevel = unlockables.find(element => element.level == player.stats.level.level + 1);
		player.stats.level = nextLevel;
		player.stats.colors.push(nextLevel.color);
		player.save();
		experiencePointsBar.configureForPlayer(player);
	}
}

function drawTitleCard() {
	push();

	rectMode(CORNER);
	noStroke();
	fill(color(0, 0, 0, 200));
	rect(0, 0, width, height);

	textAlign(CENTER, CENTER);
	textSize(50);
	stroke(255);
	strokeWeight(1);
	fill(255)
	text('-- Bubble Breather --', width/2, height/3);

	textAlign(LEFT, TOP);
	textSize(24);
	text('Bubbles jumps whenever you stack your breath - Collect the bubbles by stacking your breaths at the right time!\n\nPress Spacebar to start...', width/3, (height/3) + 50, width/3);

	pop();
}

function drawEndCard() {
	push();

	rectMode(CORNER);
	noStroke();
	fill(color(0, 0, 0, 200));
	rect(0, 0, width, height);

	textAlign(CENTER, CENTER);
	textSize(50);
	stroke(255);
	strokeWeight(1);
	fill(255)
	text('Great Work!', width/2, height/2);

	textSize(24);
	text('Summary metrics here...', width/2, (height/2) + 100);

	pop();
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
		case ' ':
			levelStartMillis = millis();
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
		this._loadStats();
		this._lane = 0;
		this.sprite = (createSprite(millisToXCoordinate(millis()), laneToYCoordinate(this._lane)));
		this.sprite.addImage('normal', playerImage);
		this.sprite.addAnimation('inhale', playerInhaleAnimation);

		// TODO - might be better to just resize the actual image to desired size once we finalize the assets
		this.sprite.scale = 0.7;
	}

	_loadStats() {
		this.stats = JSON.parse(getItem('stats'));
		if (this.stats == null) {
			this.stats = {
				experiencePoints: 0,
				level: unlockables.find(element => element.level == 1),
				colors: [unlockables.find(element => element.level == 1).color],
			};
			this.save();
		}
	}

	save() {
		storeItem('stats', JSON.stringify(this.stats));
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

class ExperiencePointsBar {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.padding = 5;
  }

  configureForPlayer(player) {
		this.text = 'lv. ' + player.stats.level.level;
		this.minVal = player.stats.level.startExp;
		this.maxVal = player.stats.level.endExp;
		this._val = player.stats.experiencePoints;
	}

  set val(v) {
    v = Math.max(this.minVal, v);
    v = Math.min(this.maxVal, v);
    this._val = v;
  }

  get val() {
    return this._val;
  }

  draw() {
    push();
    rectMode(CORNERS);
    rect

    // border
    stroke(color(0, 0, 255, 200));
    strokeWeight(2);
    noFill();
    translate(this.x, this.y);
    rect(0, 0, this.w, this.h, this.h/2);

    // status bar
    let w = map(this._val, this.minVal, this.maxVal, 0, this.w - (2*this.padding));
    noStroke();
    fill(color(0, 0, 255, 100));
    translate(this.padding, this.padding);
    rect(0, 0, w, this.h - (2*this.padding), this.h/2);

    textAlign(LEFT, BOTTOM);
    textSize(16);
    text(this.text, 0, this.y + this.h);
    pop();
  }
}