import {
  initializeSorter,
  getSortingGenerator,
  renderFinalImage,
  pseudocodeMap,
  complexityMap,
} from "./main.js";

const upload = document.getElementById("uploadCompare");
const gridSizeRange = document.getElementById("gridSizeRangeCompare");
const gridSizeLabel = document.getElementById("gridSizeLabelCompare");
const speedRange = document.getElementById("speedRangeCompare");
const speedLabel = document.getElementById("speedLabelCompare");
const algorithmLeft = document.getElementById("algorithmLeft");
const algorithmRight = document.getElementById("algorithmRight");
const startBtn = document.getElementById("startCompareBtn");
const pauseBtn = document.getElementById("pauseCompareBtn");
const stepBackBtn = document.getElementById("stepBackCompareBtn");
const stepForwardBtn = document.getElementById("stepForwardCompareBtn");
const resetBtn = document.getElementById("resetCompareBtn");

const canvasLeft = document.getElementById("canvasLeft");
const canvasRight = document.getElementById("canvasRight");

const titleLeft = document.getElementById("titleLeft");
const titleRight = document.getElementById("titleRight");

const explanation1 = document.getElementById("explanation1");
const explanation2 = document.getElementById("explanation2");
const pseudocode1 = document.getElementById("pseudocode1");
const pseudocode2 = document.getElementById("pseudocode2");
const steps1 = document.getElementById("steps1");
const steps2 = document.getElementById("steps2");
const comparisons1 = document.getElementById("comparisons1");
const comparisons2 = document.getElementById("comparisons2");
const swaps1 = document.getElementById("swaps1");
const swaps2 = document.getElementById("swaps2");
const time1 = document.getElementById("time1");
const time2 = document.getElementById("time2");

let img = null;
let gridSize = parseInt(gridSizeRange.value);
let speed = parseInt(speedRange.value);
let originalTiles = [],
  tiles1 = [],
  tiles2 = [];
let gen1 = null,
  gen2 = null;
let running = false;

let stepCount1 = 0,
  comparisons1Count = 0,
  swaps1Count = 0;
let stepCount2 = 0,
  comparisons2Count = 0,
  swaps2Count = 0;
let startTime1 = null,
  startTime2 = null;

speedRange.addEventListener("input", () => {
  speed = parseInt(speedRange.value);
  speedLabel.textContent = speed;
});

gridSizeRange.addEventListener("input", () => {
  gridSize = parseInt(gridSizeRange.value);
  gridSizeLabel.textContent = `${gridSize}x${gridSize}`;
});

upload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    img = new Image();
    img.onload = () => {
      canvasLeft.width = canvasRight.width = img.width;
      canvasLeft.height = canvasRight.height = img.height;
      const ctx1 = canvasLeft.getContext("2d", { willReadFrequently: true });
      const ctx2 = canvasRight.getContext("2d", { willReadFrequently: true });

      ctx1.drawImage(img, 0, 0);
      ctx2.drawImage(img, 0, 0);

      originalTiles = initializeSorter(ctx1, img.width, img.height, gridSize);
      shuffleTiles(originalTiles);

      tiles1 = [...originalTiles];
      tiles2 = [...originalTiles];

      const highlight = result.value.highlight || [];
      renderFinalImage(ctx1, tiles1, gridSize, true, highlight);
      renderFinalImage(ctx2, tiles2, gridSize, true, highlight);


      resetStats();
      resetBtn.disabled = false;
      stepForwardBtn.disabled = false;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

function shuffleTiles(tiles) {
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
}
function resetStats() {
  stepCount1 = comparisons1Count = swaps1Count = 0;
  stepCount2 = comparisons2Count = swaps2Count = 0;
  endTime1 = endTime2 = null;
  steps1.textContent = `Steps: 0`;
  steps2.textContent = `Steps: 0`;
  comparisons1.textContent = `Comparisons: 0`;
  comparisons2.textContent = `Comparisons: 0`;
  swaps1.textContent = `Swaps: 0`;
  swaps2.textContent = `Swaps: 0`;
  time1.textContent = `Time: 0.00s`;
  time2.textContent = `Time: 0.00s`;
  explanation1.textContent = "Explanation will appear here...";
  explanation2.textContent = "Explanation will appear here...";
}


startBtn.addEventListener("click", () => {
  if (!tiles1.length || !tiles2.length) return;

  const ctx1 = canvasLeft.getContext("2d", { willReadFrequently: true });
  const ctx2 = canvasRight.getContext("2d", { willReadFrequently: true });

  gen1 = getSortingGenerator(algorithmLeft.value, tiles1);
  gen2 = getSortingGenerator(algorithmRight.value, tiles2);

  titleLeft.textContent = algorithmLeft.value;
  titleRight.textContent = algorithmRight.value;

  pseudocode1.textContent = pseudocodeMap[algorithmLeft.value];
  pseudocode2.textContent = pseudocodeMap[algorithmRight.value];

  startTime1 = startTime2 = performance.now();
  running = true;
  pauseBtn.disabled = false;

  runStepLoop();
});

pauseBtn.addEventListener("click", () => {
  running = !running;
  if (running) runStepLoop();
});

stepForwardBtn.addEventListener("click", () => {
  if (!running) stepOnce();
});

resetBtn.addEventListener("click", () => {
  const ctx1 = canvasLeft.getContext("2d", { willReadFrequently: true });
  const ctx2 = canvasRight.getContext("2d", { willReadFrequently: true });

  tiles1 = [...originalTiles];
  tiles2 = [...originalTiles];

  const highlight = result.value.highlight || [];
  renderFinalImage(ctx1, tiles1, gridSize, true, highlight);
  renderFinalImage(ctx2, tiles2, gridSize, true, highlight);
  resetStats();
  running = false;
});

let endTime1 = null;
let endTime2 = null;

function stepOnce() {
  const ctx1 = canvasLeft.getContext("2d", { willReadFrequently: true });
  const ctx2 = canvasRight.getContext("2d", { willReadFrequently: true });

  const r1 = gen1.next();
  const r2 = gen2.next();

  const highlight1 = r1.value?.highlight || [];
  const highlight2 = r2.value?.highlight || [];

  renderFinalImage(ctx1, tiles1, gridSize, true, highlight1);
  renderFinalImage(ctx2, tiles2, gridSize, true, highlight2);

  if (!r1.done) {
    const val = r1.value;
    stepCount1++;
    if (val.comparison) comparisons1Count++;
    if (val.swap) swaps1Count++;
    explanation1.textContent = val.explanation;
    steps1.textContent = `Steps: ${stepCount1}`;
    comparisons1.textContent = `Comparisons: ${comparisons1Count}`;
    swaps1.textContent = `Swaps: ${swaps1Count}`;
  } else if (!endTime1) {
    endTime1 = performance.now();
    time1.textContent = `Time: ${((endTime1 - startTime1) / 1000).toFixed(2)}s`;
  }

  if (!r2.done) {
    const val = r2.value;
    stepCount2++;
    if (val.comparison) comparisons2Count++;
    if (val.swap) swaps2Count++;
    explanation2.textContent = val.explanation;
    steps2.textContent = `Steps: ${stepCount2}`;
    comparisons2.textContent = `Comparisons: ${comparisons2Count}`;
    swaps2.textContent = `Swaps: ${swaps2Count}`;
  } else if (!endTime2) {
    endTime2 = performance.now();
    time2.textContent = `Time: ${((endTime2 - startTime2) / 1000).toFixed(2)}s`;
  }

  if (r1.done && r2.done) {
    running = false;
    pauseBtn.disabled = true;
  }
}

function runStepLoop() {
  if (!running) return;
  stepOnce();
  setTimeout(runStepLoop, 1000 / speed);
}
import gsap from "https://cdn.skypack.dev/gsap";

// Animate entrance
window.addEventListener("DOMContentLoaded", () => {
  gsap.from(".navbar", { duration: 0.7, y: -30, opacity: 0 });
  gsap.from(".controls", { duration: 1, y: 20, opacity: 0, delay: 0.2 });
  gsap.from(".algorithm-column", {
    duration: 1,
    opacity: 0,
    stagger: 0.2,
    y: 20,
    delay: 0.3,
  });
});
