import { ProcessedSlice, ProcessingMode } from '../types';

/**
 * Calculates the "energy" or "noise" of a row of pixels.
 */
const calculateRowEnergy = (
  data: Uint8ClampedArray,
  width: number,
  y: number,
  sampleRate: number = 5
): number => {
  const rowStart = y * width * 4;
  let energy = 0;
  let previousPixel = { r: data[rowStart], g: data[rowStart + 1], b: data[rowStart + 2] };

  // Heuristic 1: Variance across the row
  for (let x = sampleRate; x < width; x += sampleRate) {
    const i = rowStart + x * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const diff = Math.abs(r - previousPixel.r) + Math.abs(g - previousPixel.g) + Math.abs(b - previousPixel.b);
    energy += diff;
    previousPixel = { r, g, b };
  }

  // Heuristic 2: Check standard deviation from pure white
  const midIndex = rowStart + Math.floor(width / 2) * 4;
  const isWhite = data[midIndex] > 240 && data[midIndex + 1] > 240 && data[midIndex + 2] > 240;
  
  if (isWhite) {
    energy = energy * 0.5;
  }

  return energy;
};

/**
 * Finds the optimal cut point within a search window around the target Y.
 */
const findOptimalCutPoint = (
  ctx: CanvasRenderingContext2D,
  width: number,
  targetY: number,
  totalHeight: number,
  searchWindow: number = 1500
): number => {
  if (targetY >= totalHeight) return totalHeight;

  const startSearchY = Math.max(0, targetY - searchWindow);
  const endSearchY = Math.min(totalHeight, targetY + (searchWindow / 2));
  const heightToSearch = endSearchY - startSearchY;

  if (heightToSearch <= 0) return targetY;

  try {
    const imageData = ctx.getImageData(0, startSearchY, width, heightToSearch);
    const data = imageData.data;

    let minEnergy = Infinity;
    let bestLocalY = targetY - startSearchY;

    for (let y = 0; y < heightToSearch; y++) {
      const energy = calculateRowEnergy(data, width, y);
      const distFromTarget = Math.abs((startSearchY + y) - targetY);
      const distancePenalty = distFromTarget * 10;
      const totalScore = energy + distancePenalty;

      if (totalScore < minEnergy) {
        minEnergy = totalScore;
        bestLocalY = y;
      }
    }
    
    return startSearchY + bestLocalY;

  } catch (e) {
    console.error("Error analyzing pixels", e);
    return targetY;
  }
};

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
};

interface Chunk {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Splits a single image into chunks based on targetHeight using smart cutting.
 */
const generateChunks = async (
  img: HTMLImageElement,
  targetHeight: number
): Promise<Chunk[]> => {
  const canvas = document.createElement('canvas');
  const width = img.width;
  const height = img.height;
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');
  
  ctx.drawImage(img, 0, 0);
  
  const chunks: Chunk[] = [];
  let currentY = 0;

  while (currentY < height) {
    let nextCutY = currentY + targetHeight;

    if (nextCutY >= height) {
      nextCutY = height;
    } else {
      nextCutY = findOptimalCutPoint(ctx, width, nextCutY, height, 1500);
    }

    const sliceHeight = nextCutY - currentY;
    if (sliceHeight <= 0) break;

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = width;
    sliceCanvas.height = sliceHeight;
    const sliceCtx = sliceCanvas.getContext('2d');
    
    if (sliceCtx) {
      sliceCtx.drawImage(canvas, 0, currentY, width, sliceHeight, 0, 0, width, sliceHeight);
      chunks.push({ canvas: sliceCanvas, width: width, height: sliceHeight });
    }

    currentY = nextCutY;
    await new Promise(r => requestAnimationFrame(r)); // Yield to prevent UI freeze
  }

  return chunks;
};

/**
 * Main function to process one or multiple images
 */
export const processImages = async (
  files: File[],
  targetHeight: number,
  mode: ProcessingMode,
  quality: number,
  onProgress: (progress: number) => void
): Promise<ProcessedSlice[]> => {
  
  // CASE 1: Stitch Mode (Combine all images horizontally)
  // Logic: Cut EVERY image into chunks first, then stitch ALL chunks side-by-side.
  if (mode === 'stitch') {
    let allChunks: Chunk[] = [];
    
    // Step 1: Generate chunks from all files
    for (let i = 0; i < files.length; i++) {
      // Progress 0-60%
      const progressBase = (i / files.length) * 60;
      onProgress(progressBase);

      const img = await loadImage(files[i]);
      const chunks = await generateChunks(img, targetHeight);
      allChunks.push(...chunks);
      
      URL.revokeObjectURL(img.src);
    }

    onProgress(70);

    // Step 2: Stitch all chunks horizontally
    if (allChunks.length === 0) return [];

    const totalWidth = allChunks.reduce((sum, chunk) => sum + chunk.width, 0);
    const maxHeight = Math.max(...allChunks.map(chunk => chunk.height));

    const stitchedCanvas = document.createElement('canvas');
    stitchedCanvas.width = totalWidth;
    stitchedCanvas.height = maxHeight;
    const ctx = stitchedCanvas.getContext('2d');
    
    if (!ctx) throw new Error("Canvas context failed");

    let currentX = 0;
    for (const chunk of allChunks) {
      ctx.drawImage(chunk.canvas, currentX, 0);
      currentX += chunk.width;
    }
    
    onProgress(90);

    const blob = await new Promise<Blob>((res, rej) => 
      stitchedCanvas.toBlob(b => b ? res(b) : rej(new Error('Blob failed')), 'image/jpeg', quality)
    );

    onProgress(100);

    return [{
      id: 'stitched-result',
      blob,
      url: URL.createObjectURL(blob),
      width: totalWidth,
      height: maxHeight,
      index: 1
    }];
  }

  // CASE 2: Slice Mode (Process each file independently and save as separate files)
  let allResults: ProcessedSlice[] = [];
  let currentIndex = 0;

  for (let i = 0; i < files.length; i++) {
    const progressStart = (i / files.length) * 100;
    const progressEnd = ((i + 1) / files.length) * 100;
    onProgress(progressStart);

    const img = await loadImage(files[i]);
    const chunks = await generateChunks(img, targetHeight);
    
    // Convert chunks to ProcessedSlice
    for (let j = 0; j < chunks.length; j++) {
       const chunk = chunks[j];
       // Progress interpolation
       onProgress(progressStart + ((j / chunks.length) * (progressEnd - progressStart)));

       const blob = await new Promise<Blob>((res, rej) => 
         chunk.canvas.toBlob(b => b ? res(b) : rej(new Error('Blob failed')), 'image/jpeg', quality)
       );

       allResults.push({
         id: `slice-${files[i].name}-${j}`,
         blob,
         url: URL.createObjectURL(blob),
         width: chunk.width,
         height: chunk.height,
         index: currentIndex + j + 1
       });
    }
    
    currentIndex += chunks.length;
    URL.revokeObjectURL(img.src);
  }
  
  onProgress(100);
  return allResults;
};