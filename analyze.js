// analyze.js
import {
  initializeSorter,
  getSortingGenerator,
  renderFinalImage,
  pseudocodeMap,
  complexityMap,
} from "./main.js";

const upload = document.getElementById("upload");
const gridSizeRange = document.getElementById("gridSizeRange");
const gridSizeLabel = document.getElementById("gridSizeLabel");
const speedRange = document.getElementById("speedRange");
const speedLabel = document.getElementById("speedLabel");
const algorithmSelect = document.getElementById("algorithmSelect");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stepBackBtn = document.getElementById("stepBackBtn");
const stepForwardBtn = document.getElementById("stepForwardBtn");
const resetBtn = document.getElementById("resetBtn");
const canvas = document.getElementById("outputCanvas");
const pseudocodeDisplay = document.getElementById("pseudocode");
const explanationDisplay = document.getElementById("explanation");
const stepsDisplay = document.getElementById("steps");
const comparisonsDisplay = document.getElementById("comparisons");
const swapsDisplay = document.getElementById("swaps");
const timeDisplay = document.getElementById("timeTaken");
const complexityDisplay = document.getElementById("complexity");
const canvasSizeRange = document.getElementById("canvasSizeRange");
const canvasSizeLabel = document.getElementById("canvasSizeLabel");

// Update label and canvas size when range changes
canvasSizeRange.addEventListener("input", () => {
  const newSize = parseInt(canvasSizeRange.value);
  canvasSizeLabel.textContent = `${newSize} x ${newSize}`;
  canvas.width = newSize;
  canvas.height = newSize;
});

let img = null;
let gridSize = parseInt(gridSizeRange.value);
let speed = parseInt(speedRange.value);
let tiles = [],
  originalTiles = [],
  gen = null,
  running = false;
let stepCount = 0,
  comparisons = 0,
  swaps = 0,
  startTime = null;

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
      const canvasSize = parseInt(canvasSizeRange.value);
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      canvasSizeLabel.textContent = `${canvasSize} x ${canvasSize}`;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ⬇️ Fit the image (like background-size: contain)
      const imgRatio = img.width / img.height;
      const canvasRatio = canvas.width / canvas.height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgRatio > canvasRatio) {
        // Image is wider — fit by width
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        // Image is taller — fit by height
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
        offsetY = 0;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      // For tile logic, draw full image into offscreen canvas at this same size
      const offCanvas = document.createElement("canvas");
      offCanvas.width = canvas.width;
      offCanvas.height = canvas.height;
      const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
      offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
      offCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      originalTiles = initializeSorter(
        offCtx,
        canvas.width,
        canvas.height,
        gridSize
      );
      shuffleTiles(originalTiles);
      tiles = [...originalTiles];

      const highlight = result.value.highlight || [];
      renderFinalImage(ctx, tiles, gridSize, true, highlight);
      
      resetBtn.disabled = false;
      stepForwardBtn.disabled = false;
    };

    img.src = reader.result;
  };

  reader.readAsDataURL(file);
});

function shuffleTiles(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

startBtn.addEventListener("click", () => {
  if (!tiles.length) return;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  gen = getSortingGenerator(algorithmSelect.value, tiles);
  const pseudocodeLines = pseudocodeMap[algorithmSelect.value].split("\n");
  pseudocodeDisplay.innerHTML = pseudocodeLines
    .map((line, index) => `<pre id="line-${index}">${line}</pre>`)
    .join("");
  startTime = performance.now();
  running = true;
  pauseBtn.disabled = false;
  complexityDisplay.textContent = `Complexity: ${
    complexityMap[algorithmSelect.value]
  }`;
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
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  tiles = [...originalTiles];
  const highlight = result.value.highlight || [];
  renderFinalImage(ctx, tiles, gridSize, true, highlight);
  
  resetStats();
  running = false;
});

function resetStats() {
  stepCount = comparisons = swaps = 0;
  stepsDisplay.textContent = `Steps: 0`;
  comparisonsDisplay.textContent = `Comparisons: 0`;
  swapsDisplay.textContent = `Swaps: 0`;
  timeDisplay.textContent = `Time: 0.00s`;
  explanationDisplay.textContent = "Explanation will appear here...";
}

function stepOnce() {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const result = gen.next();

  if (!result.done) {
    const val = result.value;
    stepCount++;
    comparisons += val.comparison ? 1 : 0;
    swaps += val.swap ? 1 : 0;

    explanationDisplay.textContent = val.explanation;
    stepsDisplay.textContent = `Steps: ${stepCount}`;
    comparisonsDisplay.textContent = `Comparisons: ${comparisons}`;
    swapsDisplay.textContent = `Swaps: ${swaps}`;
    
    const highlight = result.value.highlight || [];
    renderFinalImage(ctx, tiles, gridSize, true, highlight);
    

    // 🔥 Highlight the current pseudocode line
    if (typeof val.line === "number") {
      document
        .querySelectorAll("#pseudocode pre")
        .forEach((el) => el.classList.remove("active-line"));
      const activeLine = document.getElementById(`line-${val.line}`);
      if (activeLine) activeLine.classList.add("active-line");
    }
  } else {
    running = false;
    const endTime = performance.now();
    timeDisplay.textContent = `Time: ${((endTime - startTime) / 1000).toFixed(
      2
    )}s`;
    pauseBtn.disabled = true;

    // ✅ Clear highlight when done
    document
      .querySelectorAll("#pseudocode pre")
      .forEach((el) => el.classList.remove("active-line"));
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
