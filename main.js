export const pseudocodeMap = {
  bubble: `
1. repeat until no swaps:
2.   set swapped to false
3.   for i from 1 to length - 1:
4.     if element[i - 1] > element[i]:
5.       swap them
6.       set swapped to true`.trim(),

  selection: `
1. for i from 0 to n - 1:
2.   set minIndex to i
3.   for j from i + 1 to n:
4.     if element[j] < element[minIndex]:
5.       set minIndex to j
6.   swap element[i] with element[minIndex]`.trim(),

  insertion: `
1. for i from 1 to n:
2.   key = element[i]
3.   j = i - 1
4.   while j >= 0 and element[j] > key:
5.     move element[j] to j + 1
6.     j = j - 1
7.   insert key at j + 1`.trim(),

  quick: `
1. if low < high:
2.   partition array
3.   quicksort left part
4.   quicksort right part`.trim(),

  merge: `
1. if start < end:
2.   find mid
3.   mergeSort(start, mid)
4.   mergeSort(mid + 1, end)
5.   merge(start, mid, end)`.trim(),
};

export const complexityMap = {
  bubble: "O(n^2) / O(1)",
  selection: "O(n^2) / O(1)",
  insertion: "O(n^2) / O(1)",
  quick: "O(n log n) / O(log n)",
  merge: "O(n log n) / O(n)",
};

export function initializeSorter(ctx, width, height, gridSize) {
  const tileWidth = width / gridSize;
  const tileHeight = height / gridSize;
  const tiles = [];

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const imageData = ctx.getImageData(
        x * tileWidth,
        y * tileHeight,
        tileWidth,
        tileHeight
      );
      tiles.push({
        x,
        y,
        width: tileWidth,
        height: tileHeight,
        imageData,
        index: y * gridSize + x, // Assign unique tile ID
      });
    }
  }

  return tiles;
}

export function renderFinalImage(
  ctx,
  tiles,
  gridSize,
  animate = false,
  highlights = []
) {
  const tileWidth = tiles[0].width;
  const tileHeight = tiles[0].height;

  if (!animate) {
    // Regular render (instant)
    for (let i = 0; i < tiles.length; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      ctx.putImageData(tiles[i].imageData, col * tileWidth, row * tileHeight);

      // Highlight box
      if (highlights.includes(i)) {
        ctx.strokeStyle = "#F6DC43"; // yellow
        ctx.lineWidth = 3;
        ctx.strokeRect(
          col * tileWidth,
          row * tileHeight,
          tileWidth,
          tileHeight
        );
      }
    }
  } else {
    // Animate swap transitions
    const start = performance.now();
    const duration = 200;

    const initialPositions = tiles.map((tile, i) => {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      return {
        x: col * tileWidth,
        y: row * tileHeight,
      };
    });

    function animateFrame(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      for (let i = 0; i < tiles.length; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const targetX = col * tileWidth;
        const targetY = row * tileHeight;
        const currentX =
          initialPositions[i].x + (targetX - initialPositions[i].x) * progress;
        const currentY =
          initialPositions[i].y + (targetY - initialPositions[i].y) * progress;

        ctx.putImageData(tiles[i].imageData, currentX, currentY);

        // Highlight box (approximate position for animation)
        if (highlights.includes(i)) {
          ctx.strokeStyle = "#F6DC43";
          ctx.lineWidth = 3;
          ctx.strokeRect(currentX, currentY, tileWidth, tileHeight);
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      }
    }

    requestAnimationFrame(animateFrame);
  }
}

export function getSortingGenerator(name, tiles) {
  switch (name) {
    case "bubble":
      return bubbleSort(tiles);
    case "selection":
      return selectionSort(tiles);
    case "insertion":
      return insertionSort(tiles);
    case "quick":
      return quickSort(tiles, 0, tiles.length - 1);
    case "merge":
      return mergeSort(tiles, 0, tiles.length - 1);
    default:
      return bubbleSort(tiles);
  }
}

function* bubbleSort(arr) {
  let n = arr.length;
  let swapped;
  do {
    swapped = false;
    for (let i = 1; i < n; i++) {
      yield {
        explanation: `Compare ${i - 1} and ${i}`,
        comparison: true,
        highlight: [i - 1, i]
      };
      if (arr[i - 1].index > arr[i].index) {
        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        swapped = true;
        yield {
          explanation: `Swap ${i - 1} and ${i}`,
          swap: true,
          highlight: [i - 1, i]
        };
      }
    }
    n--;
  } while (swapped);
}


function* selectionSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < n; j++) {
      yield {
        explanation: `Compare ${j} and ${minIndex}`,
        comparison: true,
        highlight: [j, minIndex]
      };
      if (arr[j].index < arr[minIndex].index) {
        minIndex = j;
      }
    }
    if (minIndex !== i) {
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
      yield {
        explanation: `Swap ${i} and ${minIndex}`,
        swap: true,
        highlight: [i, minIndex]
      };
    }
  }
}


function* insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j].index > key.index) {
      yield {
        explanation: `Compare ${j} and key`,
        comparison: true,
        highlight: [j, i]
      };
      arr[j + 1] = arr[j];
      yield {
        explanation: `Move ${j} to ${j + 1}`,
        swap: true,
        highlight: [j, j + 1]
      };
      j--;
    }
    arr[j + 1] = key;
    yield {
      explanation: `Insert key at ${j + 1}`,
      swap: true,
      highlight: [j + 1]
    };
  }
}


function* quickSort(arr, low, high) {
  if (low < high) {
    const pivotIndex = yield* partition(arr, low, high);
    yield* quickSort(arr, low, pivotIndex - 1);
    yield* quickSort(arr, pivotIndex + 1, high);
  }
}

function* partition(arr, low, high) {
  const pivot = arr[high].index;
  let i = low - 1;
  for (let j = low; j < high; j++) {
    yield {
      explanation: `Compare ${j} to pivot`,
      comparison: true,
      highlight: [j, high]
    };
    if (arr[j].index <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      yield {
        explanation: `Swap ${i} and ${j}`,
        swap: true,
        highlight: [i, j]
      };
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  yield {
    explanation: `Place pivot at ${i + 1}`,
    swap: true,
    highlight: [i + 1, high]
  };
  return i + 1;
}


function* mergeSort(arr, start, end) {
  if (start < end) {
    const mid = Math.floor((start + end) / 2);
    yield* mergeSort(arr, start, mid);
    yield* mergeSort(arr, mid + 1, end);
    yield* merge(arr, start, mid, end);
  }
}

function* merge(arr, start, mid, end) {
  const left = arr.slice(start, mid + 1);
  const right = arr.slice(mid + 1, end + 1);
  let i = 0, j = 0, k = start;
  while (i < left.length && j < right.length) {
    yield {
      explanation: `Compare left[${i}] to right[${j}]`,
      comparison: true,
      highlight: [k]
    };
    if (left[i].index <= right[j].index) {
      arr[k++] = left[i++];
      yield {
        explanation: `Insert from left`,
        swap: true,
        highlight: [k - 1]
      };
    } else {
      arr[k++] = right[j++];
      yield {
        explanation: `Insert from right`,
        swap: true,
        highlight: [k - 1]
      };
    }
  }
  while (i < left.length) {
    arr[k++] = left[i++];
    yield {
      explanation: `Insert remaining from left`,
      swap: true,
      highlight: [k - 1]
    };
  }
  while (j < right.length) {
    arr[k++] = right[j++];
    yield {
      explanation: `Insert remaining from right`,
      swap: true,
      highlight: [k - 1]
    };
  }
}
