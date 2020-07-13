// This file contains the classes that are shared between pep.js and thumbnail.js
// In general, these classes are intended to be re-usable in other contexts, but a tightly coupled to p5.js


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
