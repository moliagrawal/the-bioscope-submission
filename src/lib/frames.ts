import fs from 'fs';
import path from 'path';

/**
 * Reads frame files from data/reels/<reelId>/frames/ — OUTSIDE public/.
 * This is the ONLY way paid frames are served (Check #5).
 * 
 * Frame filenames are validated against meta.json to prevent path traversal.
 * The reel ID and frame index are validated before any filesystem access.
 */

const DATA_DIR = path.join(process.cwd(), 'data', 'reels');

export interface ReelMeta {
  title: string;
  description: string;
  frameCount: number;
  frames: string[]; // filenames relative to the frames/ directory
}

/**
 * Load reel metadata from data/reels/<reelId>/meta.json.
 */
export function getReelMeta(reelId: string): ReelMeta | null {
  // Validate reelId: alphanumeric + hyphens only (prevent traversal)
  if (!/^[a-z0-9-]+$/.test(reelId)) {
    return null;
  }

  const metaPath = path.join(DATA_DIR, reelId, 'meta.json');
  if (!fs.existsSync(metaPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(metaPath, 'utf-8');
    return JSON.parse(raw) as ReelMeta;
  } catch {
    return null;
  }
}

/**
 * Read a specific frame's bytes from the protected data directory.
 * frameIndex is 0-based internally but 1-based in the user-facing API:
 *   - Frame 0 (index 0) = preview/free frame (served from public/)
 *   - Frame 1+ (index 1+) = paid frames (served from data/)
 * 
 * This function only serves paid frames (index >= 1).
 * Returns null if the frame doesn't exist or the index is out of range.
 */
export function readPaidFrame(
  reelId: string,
  frameIndex: number
): { buffer: Buffer; mimeType: string } | null {
  // Validate reelId
  if (!/^[a-z0-9-]+$/.test(reelId)) {
    return null;
  }

  const meta = getReelMeta(reelId);
  if (!meta) return null;

  // frameIndex must be >= 1 (paid frames only) and within range
  if (frameIndex < 1 || frameIndex >= meta.frameCount) {
    return null;
  }

  // Get the filename from meta.json (prevents arbitrary file access)
  const filename = meta.frames[frameIndex];
  if (!filename) return null;

  // Validate filename: no path separators, no dots except for extension
  if (!/^[a-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
    return null;
  }

  const framePath = path.join(DATA_DIR, reelId, 'frames', filename);

  // Double-check the resolved path is within the expected directory
  const realPath = path.resolve(framePath);
  const expectedDir = path.resolve(path.join(DATA_DIR, reelId, 'frames'));
  if (!realPath.startsWith(expectedDir)) {
    return null;
  }

  if (!fs.existsSync(framePath)) {
    return null;
  }

  const buffer = fs.readFileSync(framePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };

  return {
    buffer,
    mimeType: mimeMap[ext] || 'application/octet-stream',
  };
}

/**
 * Get all paid frame indices for a reel (1-based).
 */
export function getPaidFrameIndices(reelId: string): number[] {
  const meta = getReelMeta(reelId);
  if (!meta) return [];

  const indices: number[] = [];
  for (let i = 1; i < meta.frameCount; i++) {
    indices.push(i);
  }
  return indices;
}
