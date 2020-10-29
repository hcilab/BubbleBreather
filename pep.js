// Use Window.localStorage to save and retrieve paintings on a per-browser basis - p5.js provides wrapper functions for this
//// holds an array of all paintingID currently saved; a JSON representation of each painting will be saved its ID as a retrieval key
let savedPaintings = [];


let painting;
let bubbleWand;
let nextColor;
let isPainting = false;

let titleCard;
let titleCardDismissed = false;

let paintCan;
let paintCanImage;

let unlockedColors = [];

let sonar;

async function preload() {
  titleCard = loadImage('./assets/titlecard-paint.png');
  paintCanImage = loadImage('./assets/paint-can.png');

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
  paintCan = new PaintCan(w=0.05*width, h=0.9*height, d=Math.min(0.25*width, 0.25*height), img=paintCanImage, c=color(nextColor.toString()));
}

function draw() {
  clear();
  background(255);

  if (!titleCardDismissed) {
    image(titleCard, 0, 0, width, height);
    return
  }
  noCursor();

  if (mouseIsPressed && isForcefulBreathing()) {
    if (paintCan.contains(mouseX, mouseY)) {
      bubbleWand.absorb(deltaTime);
    } else if (painting.bubbles.length > 0) {
      bubbleWand.emit(deltaTime);
      let heading = createVector((mouseX-pmouseX)/width, (mouseY-pmouseY)/height).div(5);
      if (heading.mag() > 0.001) {
        painting.blow(mouseX/width, mouseY/height, deltaTime, heading);
      } else {
        painting.blow(mouseX/width, mouseY/height, deltaTime);
      }
    }
  }

  painting.update(deltaTime);
  painting.draw();

  paintCan.draw();
  bubbleWand.draw(mouseX, mouseY);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  if (!paintCan.contains(mouseX, mouseY) && isForcefulBreathing()) {
    painting.addBubbleGroup(color(nextColor.toString()));
    isPainting = true;
  }
}

function mouseReleased() {
  // i.e., only when above bubble recharge zone
  if (isPainting) {
    isPainting = false;
    nextColor = random(unlockedColors);
    bubbleWand.c = color(nextColor.toString());
    paintCan.c = color(nextColor.toString());
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
