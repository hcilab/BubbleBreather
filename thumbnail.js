function setup() {
  createCanvas(windowWidth, windowHeight);

  // current painting is specified as a url parameter
  // ...die if unspecified
  let id = getURLParams().paintingid;
  if (id == null || id == 0) {
    console.log('Invalid or missing painting id...');
    text('Invalid or missing painting id specified...', 0, 0, width);
    return;
  }

  // Attempt to load corresponding painting from Window.localStorage
  // ...die if invalid or unfound
  let painting = Painting.load(id);
  if (painting == null) {
    console.log('Invalid painting id: ' + id);
    text('Invalid painting id specified (' + id + ')...', 0, 0, width);
    return;
  }

  // Otherwise draw painting
  painting.draw();

  textSize(12);
  textStyle(BOLD);
  text(painting.exhaleCount + ' Exhales' + ' (' + nf(painting.exhaleTime / 1000, -1, 1) + 'sec)', 5, 15);
}