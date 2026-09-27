import { test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

test('Check 5: Paid frames are NOT public', () => {
  const publicDir = path.join(process.cwd(), 'public');
  const dataDir = path.join(process.cwd(), 'data');

  const filesInPublic = fs.existsSync(publicDir) ? fs.readdirSync(publicDir, { recursive: true }) : [];
  
  // Paid frames must not exist anywhere inside public/
  const framesInPublic = filesInPublic.filter(f => typeof f === 'string' && f.includes('frame_1.jpg'));
  expect(framesInPublic.length).toBe(0);

  // They must exist in data/ instead
  const filesInData = fs.existsSync(dataDir) ? fs.readdirSync(dataDir, { recursive: true }) : [];
  const framesInData = filesInData.filter(f => typeof f === 'string' && f.includes('frame_1.jpg'));
  expect(framesInData.length).toBeGreaterThan(0);
});
