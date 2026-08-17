export type ProcessingMode = 'slice' | 'stitch';

export interface SliceSettings {
  targetHeight: number; // The target height for each slice (default 10000)
  sensitivity: number; // How aggressively to search for whitespace (0-100)
  mode: ProcessingMode;
  quality: number; // 0.1 to 1.0
}

export interface ProcessedSlice {
  id: string;
  blob: Blob;
  url: string;
  width: number;
  height: number;
  index: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}