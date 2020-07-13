// Use Window.localStorage to save and retrieve paintings on a per-browser basis - p5.js provides wrapper functions for this
//// holds an array of all paintingID currently saved; a JSON representation of each painting will be saved its ID as a retrieval key
let savedPaintings = [];


let painting;
let bubbleWand;
let nextColor;

// The period of time between blown bubbles
let bubbleDelayMillis = 25;
let bubbleDelayTimer = 0;

async function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();

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

  bubbleWand = new BubbleWand();
  nextColor = color(random(255), random(255), random(255));
}

function draw() {
  clear();
  background(255);

  if (mouseIsPressed && mouseY > 0.9 * height) {
    bubbleWand.absorb(deltaTime);
  } else if (mouseIsPressed && painting.bubbles.length > 0) {
    bubbleWand.emit(deltaTime);
    bubbleDelayTimer += deltaTime;
    if (bubbleDelayTimer > bubbleDelayMillis) {
      let heading = createVector((mouseX-pmouseX)/width, (mouseY-pmouseY)/height).div(5);
      if (heading.mag() > 0.001) {
        painting.bubbles[painting.bubbles.length-1].addBubble(mouseX/width, mouseY/height, heading);
      } else {
        painting.bubbles[painting.bubbles.length-1].addBubble(mouseX/width, mouseY/height);
      }
      bubbleDelayTimer -= bubbleDelayMillis;
    }
  }

  painting.bubbles.forEach(s => s.animate(deltaTime));
  painting.bubbles.forEach(s => s.draw());

  push();
  stroke(0);
  fill(255, 150);
  rectMode(CORNER);
  rect(0, 0.9*height, width, 0.1*height);
  strokeWeight(0.1);
  fill(0);
  text('Recharge bubble wand here...', 5, 0.91*height);
  pop();

  bubbleWand.draw(mouseX, mouseY);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  if (mouseY < 0.9 * height) {
    painting.bubbles.push(new Bubbles(nextColor));
  }
}

function mouseReleased() {
  // i.e., only when above bubble recharge zone
  if (mouseY < 0.9 * height) {
    nextColor = color(random(255), random(255), random(255));
    painting.save();

    // schedule another save 2.5 sec from now, to capture painting once all animations have finished...
    setTimeout(() => painting.save(), 2500);
  }
}