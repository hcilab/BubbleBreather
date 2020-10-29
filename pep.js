// Use Window.localStorage to save and retrieve paintings on a per-browser basis - p5.js provides wrapper functions for this
//// holds an array of all paintingID currently saved; a JSON representation of each painting will be saved its ID as a retrieval key
let savedPaintings = [];


let painting;
let bubbleWand;
let nextColor;
let isPainting = false;

let titleCard;
let titleCardDismissed = false;

let unlockedColors = [];

let sonar;

async function preload() {
  titleCard = loadImage('./assets/titlecard-paint.png');

  sonar = new BreathingSonarJS();
  await sonar.init();
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // retrieve the list of existing paintings
  savedPaintings = JSON.parse(getItem('savedPaintings'));
  if (savedPaintings == null) {
    savedPaintings = [];
    storeItem('savedPaintings', JSON.stringify(savedPaintings));
  }

  // retrieve the paintingID to load (assigned by gallery page)
  // if unset or value=0, create a new painting
  let id = getURLParams().paintingid;
  if (id == null || id == 0) {
    painting = Painting.create();
  } else {
    painting = Painting.load(id);
  }

  // Populate list of unlocked colors to use in painting from saved player `stats` object
  // ...if it isn't found, fallback to painting with grey.
  let stats = getItem('stats');
  if (stats != null) {
    unlockedColors = JSON.parse(stats).colors.map(c => color(c.rgb));
  } else {
    unlockedColors.push(color('rgb(128, 128, 128)'));
  }


  nextColor = random(unlockedColors);
  bubbleWand = new BubbleWand(color(nextColor.toString()));
}

function draw() {
  clear();
  background(255);

  if (!titleCardDismissed) {
    image(titleCard, 0, 0, width, height);
    return
  }
  noCursor();


  if (mouseIsPressed && mouseY > 0.9 * height && isForcefulBreathing()) {
    bubbleWand.absorb(deltaTime);
  } else if (mouseIsPressed && painting.bubbles.length > 0 && isForcefulBreathing()) {
    bubbleWand.emit(deltaTime);
    let heading = createVector((mouseX-pmouseX)/width, (mouseY-pmouseY)/height).div(5);
    if (heading.mag() > 0.001) {
      painting.blow(mouseX/width, mouseY/height, deltaTime, heading);
    } else {
      painting.blow(mouseX/width, mouseY/height, deltaTime);
    }
  }

  painting.update(deltaTime);
  painting.draw();

  push();
  stroke(0);
  fill(255, 150);
  rectMode(CORNER);
  rect(0, 0.9*height, width, 0.1*height);
  strokeWeight(0.1);
  fill(0);
  text('Recharge bubble wand here...', 5, 0.95*height);
  text('Press space bar to simulate inhale or exhale.\nUse the mouse to position wand and hold leftmouse button to interact once breathing.\nOn canvas exhale, over recharge bar inhale.', width - 500, 20);
  pop();

  bubbleWand.draw(mouseX, mouseY);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  if (mouseY < 0.9 * height && isForcefulBreathing()) {
    painting.addBubbleGroup(color(nextColor.toString()));
    isPainting = true;
  }
}

function mouseReleased() {
  // i.e., only when above bubble recharge zone
  if (mouseY < 0.9 * height && isPainting) {
    isPainting = false;
    nextColor = random(unlockedColors);
    bubbleWand.c = color(nextColor.toString());
    painting.save();

    // schedule another save 2.5 sec from now, to capture painting once all animations have finished...
    setTimeout(() => painting.save(), 2500);
  }
}

function keyPressed() {
  if (keyCode == ENTER || keyCode == RETURN) {
    titleCardDismissed = true;
  }
}

function isForcefulBreathing() {
  return sonar.isForcefulBreathing || (keyIsPressed && key == ' ');
}
