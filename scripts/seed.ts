import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const DATA_DIR = path.join(process.cwd(), 'data', 'reels');
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'reels');
const DB_PATH = path.join(process.cwd(), 'bioscope.db');

const REELS = [
  { id: 'reel-a', title: 'Calcutta Trams', frames: 4, desc: 'A glimpse of Calcutta in the 50s' },
  { id: 'reel-b', title: 'Durga Puja', frames: 3, desc: 'Procession near the Hooghly river' },
  { id: 'reel-c', title: 'Circus Elephant', frames: 5, desc: 'Traveling circus arrives in town' },
];

function seed() {
  console.log('Seeding the bioscope...');

  // 1. Database
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS reels (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      frame_count INTEGER NOT NULL,
      price_usd TEXT NOT NULL DEFAULT '0.001',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const insertReel = db.prepare('INSERT OR REPLACE INTO reels (id, title, description, frame_count, price_usd) VALUES (?, ?, ?, ?, ?)');
  
  for (const r of REELS) {
    insertReel.run(r.id, r.title, r.desc, r.frames, '0.001');
    
    // 2. Directories
    const publicReelDir = path.join(PUBLIC_DIR, r.id);
    const dataReelDir = path.join(DATA_DIR, r.id, 'frames');
    fs.mkdirSync(publicReelDir, { recursive: true });
    fs.mkdirSync(dataReelDir, { recursive: true });

    // 3. meta.json
    const meta = {
      title: r.title,
      description: r.desc,
      frameCount: r.frames,
      frames: Array.from({ length: r.frames }).map((_, i) => `frame_${i}.jpg`)
    };
    fs.writeFileSync(path.join(DATA_DIR, r.id, 'meta.json'), JSON.stringify(meta, null, 2));

    // 4. Dummy images (just empty files or simple text-based images if possible, we'll just write mock files that act as valid jpegs, or use a 1x1 pixel)
    const base64Pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuPnAAAAAElFTkSuQmCC'; // 1x1 yellow PNG
    const buffer = Buffer.from(base64Pixel, 'base64');

    // Frame 0 goes to public (free)
    fs.writeFileSync(path.join(publicReelDir, 'preview.jpg'), buffer);

    // Frame 1..N go to data (paid)
    for (let i = 1; i < r.frames; i++) {
      fs.writeFileSync(path.join(dataReelDir, `frame_${i}.jpg`), buffer);
    }
  }

  console.log('Seeded successfully.');
}

seed();
