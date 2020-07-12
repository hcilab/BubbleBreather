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


class Painting {
  constructor(paintingID, bubbles=[]) {
    this.paintingID = paintingID;
    this.bubbles = bubbles;
  }

  static create() {
    // Create a new painting w/ unique id
    let paintingID = Date.now().toString();
    let painting = new Painting(paintingID);

    // Add new id to list of saved paintings
    savedPaintings.push(paintingID);
    storeItem('savedPaintings', JSON.stringify(savedPaintings));

    // Save newly created painting under corresponding key
    storeItem(paintingID, JSON.stringify(painting.toJSON()));

    console.log('Created painting ' + this.paintingID + '...');
    return painting;
  }

  static load(paintingID) {
    console.log('Loading painting ' + paintingID + '...');
    return Painting.fromJSON(JSON.parse(getItem(paintingID)));
  }

  save() {
    console.log('Saving painting ' + this.paintingID + '...');
    storeItem(this.paintingID, JSON.stringify(this.toJSON()));
  }

  toJSON() {
    return {
      'paintingID': this.paintingID,
      'bubbles': this.bubbles.map(bs => bs.toJSON()),
    };
  }

  static fromJSON(json) {
    let bubbles = json.bubbles.map(bs => Bubbles.fromJSON(bs));
    return new Painting(json.paintingID, bubbles);
  }
}

class Bubbles {
  constructor(c) {
    this.c = c;
    this.bubbles = [];
  }

  addBubble(x, y, heading=p5.Vector.random2D().div(250)) {
    this.bubbles.push(new Bubble(x, y, this.c, heading));
  }

  animate(dt) {
    this.bubbles.forEach(b => b.animate(dt));
  }

  draw() {
    this.bubbles.forEach(b => b.draw());
  }

  toJSON() {
    return {
      'c': this.c.toString(),
      'bubbles': this.bubbles.map(b => b.toJSON()),
    };
  }

  static fromJSON(json) {
    let bubbles = new Bubbles(color(json.c));
    bubbles.bubbles = json.bubbles.map(b => Bubble.fromJSON(b));
    return bubbles;
  }
}



class Bubble {
  constructor(x, y, c, vel=p5.Vector.random2D().div(250)) {
    let alphaRange = [50, 100];
    let sizeRange = [0.01, 0.1];
    let animateMillisRange = [1000, 2500];

    this.pos = createVector(x, y);
    this.c = c;
    this.vel = vel;

    this.animateMillis = random(animateMillisRange[0], animateMillisRange[1]);
    this.animateMillisRemaining = this.animateMillis;

    this.alpha = random(alphaRange[0], alphaRange[1]);
    let endAlpha = random(alphaRange[0], alphaRange[1]);
    this.d_alpha = (this.alpha - endAlpha) / this.animateMillis;

    this.size = random(sizeRange[0], sizeRange[1]);
    let endSize = random(sizeRange[0], sizeRange[1]);
    this.d_size = (this.size - endSize) / this.animateMillis;
  }

  animate(dt) {
    if (this.animateMillisRemaining > 0) {
      this.animateMillisRemaining -= dt;
      this.alpha += dt * this.d_alpha;
      this.size += dt * this.d_size;

      this.vel.mult(this.animateMillisRemaining / this.animateMillis);
      this.pos.add(this.vel);
    }
  }

  draw() {
    push();
    translate(this.pos.x * width, this.pos.y * height);

    let scalingFactor = Math.min(width, height);
    scale(this.size * scalingFactor, this.size * scalingFactor);

    strokeWeight(0.01);
    this.c.setAlpha(this.alpha+50);
    stroke(this.c);
    this.c.setAlpha(this.alpha);
    fill(this.c);
    ellipseMode(CENTER);
    ellipse(0, 0, 1, 1);
    pop();
  }

  toJSON() {
    return {
      'x': this.pos.x,
      'y': this.pos.y,
      'c': this.c.toString(),
      'alpha': this.alpha,
      'size': this.size,
    };
  }

  static fromJSON(json) {
    let b = new Bubble(json.x, json.y, color(json.c), createVector(0, 0));
    b.alpha = json.alpha;
    b.size = json.size;
    b.animateMillis = 0;
    b.animateMillisRemaining = 0;
    b.d_alpha = 0;
    b.d_size = 0;
    return b;
  }
}


class BubbleWand {
  constructor() {
    this.remainingTime = 0;
  }

  absorb(dt) {
    this.remainingTime += dt;
  }

  emit(dt) {
    this.remainingTime = Math.max(0, this.remainingTime - dt);
  }

  draw(x, y) {
    push();
    translate(x, y);

    let size =  0.02 * Math.min(width, height);
    let sizeCompoundingFactor = 1.1;

    let c = color(nextColor.toString());
    c.setAlpha(200);
    fill(c);
    noStroke();

    ellipse(0, 0, size, size);
    for (let i=0; i<Math.floor(this.remainingTime / 100); i++) {
      scale(sizeCompoundingFactor, sizeCompoundingFactor);
      ellipse(0, 0, size, size);
    }

    let angle = map(this.remainingTime % 100, 0, 100, 0, 2*PI);
    arc(0, 0, size, size, 0, angle);
    pop();
  }
}
