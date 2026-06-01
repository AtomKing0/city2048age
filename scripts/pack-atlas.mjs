/**
 * pack-atlas.mjs — Generate PixiJS-compatible texture atlases for each building age.
 *
 * Usage: node scripts/pack-atlas.mjs
 * Output: public/assets/atlas/buildings/{age}-buildings.png + .json
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const buildings = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/config/buildings.json'), 'utf-8')
);

const PUBLIC  = path.join(ROOT, 'public');
const OUT_DIR = path.join(ROOT, 'public/assets/atlas/buildings');
const COLS    = 4;
const PADDING = 2;
// Resize all buildings to this size before atlasing.
// 76px tile × 2× retina = 152px; 160px gives slight headroom.
// Reduces classic atlas from 1684×1263 (1.6 MB) → 656×492 (~100 KB).
const TARGET_PX = 160;

async function packAge(ageName, pngPaths) {
  const unique = [...new Set(pngPaths)];

  const images = (await Promise.all(unique.map(async src => {
    const fullPath = path.join(PUBLIC, src);
    if (!fs.existsSync(fullPath)) {
      console.warn(`  ⚠ missing: ${src}`);
      return null;
    }
    // Resize to TARGET_PX (fit inside square, preserve alpha)
    const { data, info } = await sharp(fullPath)
      .resize(TARGET_PX, TARGET_PX, { fit: 'inside', withoutEnlargement: false })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { src, buffer: data, w: info.width, h: info.height, channels: info.channels };
  }))).filter(Boolean);

  const maxW  = Math.max(...images.map(i => i.w));
  const maxH  = Math.max(...images.map(i => i.h));
  const slotW = maxW + PADDING * 2;
  const slotH = maxH + PADDING * 2;
  const cols  = Math.min(COLS, images.length);
  const rows  = Math.ceil(images.length / cols);
  const atlasW = cols * slotW;
  const atlasH = rows * slotH;

  const frames     = {};
  const composites = [];

  for (let i = 0; i < images.length; i++) {
    const img  = images[i];
    const col  = i % cols;
    const row  = Math.floor(i / cols);
    const left = col * slotW + PADDING + Math.floor((maxW - img.w) / 2);
    const top  = row * slotH + PADDING + Math.floor((maxH - img.h) / 2);

    frames[img.src] = {
      frame:            { x: left, y: top, w: img.w, h: img.h },
      rotated:          false,
      trimmed:          false,
      spriteSourceSize: { x: 0, y: 0, w: img.w, h: img.h },
      sourceSize:       { w: img.w, h: img.h },
    };
    // Pass raw RGBA buffer so composite uses resized pixels
    composites.push({
      input: img.buffer,
      raw: { width: img.w, height: img.h, channels: img.channels },
      left,
      top,
    });
  }

  const atlasImg  = `${ageName}-buildings.png`;
  const atlasJson = {
    frames,
    meta: { image: atlasImg, format: 'RGBA8888', size: { w: atlasW, h: atlasH }, scale: '1' },
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });

  await sharp({
    create: { width: atlasW, height: atlasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, atlasImg));

  fs.writeFileSync(path.join(OUT_DIR, `${ageName}-buildings.json`), JSON.stringify(atlasJson));

  const kb = Math.round(fs.statSync(path.join(OUT_DIR, atlasImg)).size / 1024);
  console.log(`  ✓ ${ageName.padEnd(12)} ${images.length} imgs  ${atlasW}×${atlasH}  →  ${kb} KB`);
}

console.log('📦 Packing building atlases…');
for (const [ageName, pngPaths] of Object.entries(buildings)) {
  await packAge(ageName, pngPaths);
}
console.log('✅ Done');
