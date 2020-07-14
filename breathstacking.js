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
let laneCoordinates;
function laneToYCoordinate(lane) {
	return laneCoordinates[lane];
}

// Similarly, input coordinates are specified as time offsets (ms), making it easier to design levels that align with breath stacking timing requiremets (e.g., hold for 2 seconds...)
// These parameters can be tweaked to adjust the speed of the game
let levelDurationMillis = 100000;
let levelRunningTime = 0;
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

// Maintain a tally of the remaining collectables in each group, so that we can provide a bonus when all collectables from one group are collected (i.e., when one of the tallys reaches 0)
let stackGroupCounts;
let stackBonusAnimation;

let playerImage;
let playerInhaleAnimation;
let player;

let experiencePointsBar;
let levelUpAnimation;

let backgroundImage; // reyhan
let titleCard;
let titleCardDismissed = false;

// Maintain some simple statistics about the players performance in this session
// (Note that similar "all time" statistics are logged in the player.stats object)
let sessionInhaleCount = 0;
let sessionStackCount = 0;
let sessionLevelUpCount = 0;


let sonar;

async function preload() {
	// @Reyhan - I've quickly made these assets as placeholders for now, but note that animations can be adjusted by editing the files specified in `loadAnimation()` below.
	// Note that if you add more / fewer animation frames, you may need to tweak the `frameDelay` field below, which specifies the speed of the animation (i.e., the number of game frames to delay before switching animation frames)
	collectableAnimation = loadAnimation('./assets/collectables/level-0.png', './assets/collectables/level-0-big.png');

	playerImage = loadImage('./assets/player_normal.png');
	playerInhaleAnimation = loadAnimation('./assets/player-inhale-0.png', './assets/player-inhale-1.png', './assets/player-inhale-2.png', './assets/player-inhale-3.png');

	// TODO: I think might be a little bit hacky...
	// To make this animation appear only at specific times, I've put a completely empty png as the first and last frame of the animation. Whenever I want it to play, I simply rewind and play.
	// While animations do have a `visible` property, using this would be a little more complicated because I'd somehow have to asychronously turn off visibility after the animation finishes...
	levelUpAnimation = loadAnimation('./assets/empty.png', './assets/level-up-0.png','./assets/level-up-1.png','./assets/level-up-2.png','./assets/level-up-3.png', './assets/empty.png');
	levelUpAnimation.looping = false;
	levelUpAnimation.goToFrame(levelUpAnimation.getLastFrame());

	stackBonusAnimation = loadAnimation('./assets/empty.png', './assets/inhale-bonus-0.png','./assets/inhale-bonus-1.png','./assets/inhale-bonus-2.png','./assets/inhale-bonus-3.png', './assets/empty.png');
	stackBonusAnimation.looping = false;
	stackBonusAnimation.goToFrame(stackBonusAnimation.getLastFrame());

	backgroundImage = loadImage('./assets/background.png'); // reyhan
	titleCard = loadImage('./assets/titlecard.png');

	// Note that `loadTable()` is asynchronous, so we have to divide level loading across preload() and setup() functions :(
	collectablesTable = loadTable('./assets/level-1.csv', 'csv', 'header');
	unlockablesTable = loadTable('./assets/unlockables.csv', 'csv', 'header');

  sonar = new BreathingSonarJS();
  await sonar.init();
  sonar.forcefulBreathingThreshold = 0.5;
}


function setup() {
	createCanvas(windowWidth, windowHeight);

	laneCoordinates = [0.9*height, 0.7*height, 0.5*height, 0.3*height, 0.1*height];


	// TODO: This binds the animation speed to the framerate of the game... is this how it's normally done, or is there a way to specify animation time in ms?
	collectableAnimation.frameDelay = 30;

	playerInhaleAnimation.frameDelay = 4;
	playerInhaleAnimation.looping = false;

	stackBonusAnimation.frameDelay = 8;
	levelUpAnimation.frameDelay = 8;

	collectables = collectablesTable.getRows().map(r => new Collectable(r.getNum('ms'), r.getNum('lane'), r.getString('group')));

	stackGroupCounts = new Map();
	collectables.forEach(collectable => {
		let group = collectable.group;
		if (group != '') {
			if (!stackGroupCounts.has(group)) {
				stackGroupCounts.set(group, 0);
			}
			stackGroupCounts.set(group, stackGroupCounts.get(group) + 1);
		}
	});

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

	if (!titleCardDismissed) {
		image(titleCard, 0, 0, width, height);
		return;
	}

	levelRunningTime += deltaTime;

	// A naive implementation of a continuous background with panning camera is to simply repeat the background image across the entire scene.
	// TODO: Only draw the visible images in each frame if this causes a performance hit.
	for (let x=-backgroundImage.width; x<sceneWidth + backgroundImage.width; x+= backgroundImage.width) {
		image(backgroundImage, x, 0, backgroundImage.width, height);
	}

	if (levelRunningTime <= levelDurationMillis) {
		// Player moves at a uniform horizontal speed across the level with scrolling camera
		player.sprite.position.x = millisToXCoordinate(levelRunningTime);
		player.update(deltaTime);
		if (isForcefulBreathing()) {
			player.jump();
		}

		// Test for collisions with collectables
		// Note that sprite and collectable must be removed separately (p5.game maintains an internal list of sprites)
		collectables.forEach((collectable, index, array) => {
			if (collectable.sprite.overlap(player.sprite)) {
				addScore(100);
				checkForLevelUp();
				checkForStackBonus(collectable);
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
	stackBonusAnimation.draw(width/2, height/2);

	if (levelRunningTime > levelDurationMillis) {
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
		sessionLevelUpCount += 1;
		levelUpAnimation.rewind();
		levelUpAnimation.play();
		let nextLevel = unlockables.find(element => element.level == player.stats.level.level + 1);
		player.stats.level = nextLevel;
		player.stats.colors.push(nextLevel.color);
		player.save();
		experiencePointsBar.configureForPlayer(player);
	}
}

function checkForStackBonus(collectable) {
	let group = collectable.group;
	if (group == '') {
		return;
	}

	stackGroupCounts.set(group, stackGroupCounts.get(group) - 1);
	if (stackGroupCounts.get(group) <= 0) {
		sessionStackCount += 1;
		player.stats.stackCount += 1;
		addScore(1000);
		stackBonusAnimation.rewind();
		stackBonusAnimation.play();
		stackGroupCounts.delete(group);
	}
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
	text('Great Work!', width/2, height/3);

	textSize(24);
	text('   Today: ' + sessionInhaleCount + " Inhales & " + sessionStackCount + " Breath Stacks!", width/2, (height/3) + 100);
	text('All Time: ' + player.stats.inhaleCount + " Inhales & " + player.stats.stackCount + " Breath Stacks!", width/2, (height/3) + 150);

	if (sessionLevelUpCount > 0) {
		textStyle(BOLD);
		text("You've unlocked " + sessionLevelUpCount + " new colors! Awesome!", width/2, (height/3) + 200);
	}

	pop();
}

// Stubbed keyboard controls for now...
function keyPressed() {
	switch (keyCode) {
		case UP_ARROW:
			player.jump();
			break;
		case ENTER:
		case RETURN:
			titleCardDismissed = true;
			break;
	}
}

function isForcefulBreathing() {
	return millis() > 10000 && sonar.isForcefulBreathing;
}



class Collectable {
	constructor(ms, lane, group) {
		this.ms = ms;
		this.lane = lane;
		this.group = group;

		this.sprite = createSprite(millisToXCoordinate(this.ms), laneToYCoordinate(this.lane));
		this.sprite.addAnimation('bubble', collectableAnimation);

		if (this.group == '') {
			this.sprite.scale = 0.7;
		}
	}
}


class Player {
	constructor() {
		this._loadStats();
		this._lane = 0;
		this._jumpTimeout = 0;
		this._jumpDecay = 0;
		this.sprite = (createSprite(millisToXCoordinate(millis()), laneToYCoordinate(this._lane)));
		this.sprite.addImage('normal', playerImage);
		this.sprite.addAnimation('inhale', playerInhaleAnimation);
		this.sprite.scale = 1.5;
	}

	_loadStats() {
		this.stats = JSON.parse(getItem('stats'));
		if (this.stats == null) {
			this.stats = {
				experiencePoints: 0,
				inhaleCount: 0,
				stackCount: 0,
				level: unlockables.find(element => element.level == 1),
				colors: [unlockables.find(element => element.level == 1).color],
			};
			this.save();
		}
	}

	save() {
		storeItem('stats', JSON.stringify(this.stats));
	}

	update(dt) {
		this._jumpTimeout -= dt;
		this._jumpDecay -= dt;
		if (this._jumpDecay <= 0) {
			this.lane = 0;
		}
	}

	jump() {
		if (this._jumpTimeout <= 0) {
			this.lane += 1;
			this._jumpTimeout = 1500;
			this._jumpDecay = 3000;
			this.sprite.changeAnimation('inhale');
			setTimeout(function() { this.sprite.changeAnimation('normal') }.bind(this), 500);
			this.stats.inhaleCount += 1;
			sessionInhaleCount += 1;
		}
	}

	get lane() {
		return this._lane;
	}

	set lane(lane) {
		this._lane = lane;
		this._lane = Math.max(0, this._lane);
		this._lane = Math.min(this.lane, laneCoordinates.length - 1);

		this.sprite.position.y = laneToYCoordinate(this._lane);
		this.sprite.scale = 1.5 + (this._lane * 0.2); // reyhan - rescaled sprite
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