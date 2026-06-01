import { Assets } from 'pixi.js';
import { BUILDING_PNGS, AGE_BUILDING_PNGS } from '../../config/ages.js';

const textureCache = {};  // src -> Texture
const loadedAges = new Set();

// Prepend Vite base URL so paths work on GitHub Pages (e.g. /supergene-esther/city2048/)
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') + '/';

// ── Atlas loader (primary) ─────────────────────────────────
// Loads a pre-packed spritesheet JSON + PNG for one age.
// Frame names in the JSON match the original PNG paths (e.g. "assets/buildings/stone/01.png"),
// so getBuildingTexture() keeps working without changes.
async function loadAtlas(ageName, pngPaths) {
  const jsonUrl = `${BASE}assets/atlas/buildings/${ageName}-buildings.json`;
  try {
    const sheet = await Assets.load(jsonUrl);
    // Populate textureCache from spritesheet frames
    const unique = [...new Set(pngPaths)];
    for (const src of unique) {
      const tex = sheet.textures?.[src];
      if (tex) textureCache[src] = tex;
    }
    return Object.keys(sheet.textures ?? {}).length > 0;
  } catch {
    return false; // atlas not found → fall back to individual PNGs
  }
}

// ── Fallback: individual PNG loader ───────────────────────
async function loadPngs(pngs) {
  const unloaded = pngs.filter(src => !textureCache[src]);
  if (unloaded.length === 0) return;
  for (const src of unloaded) {
    const fullSrc = BASE + src;
    if (!Assets.resolver.hasKey(src)) Assets.add({ alias: src, src: fullSrc });
  }
  const result = await Assets.load(unloaded);
  for (const src of unloaded) {
    if (result[src]) textureCache[src] = result[src];
  }
}

export async function loadBuildingAssets() {
  if (loadedAges.has('classic')) return;
  const ok = await loadAtlas('classic', BUILDING_PNGS);
  if (!ok) await loadPngs(BUILDING_PNGS);
  loadedAges.add('classic');
}

export async function loadBuildingAssetsForAge(ageId) {
  if (loadedAges.has(ageId)) return;
  const pngs = AGE_BUILDING_PNGS[ageId];
  if (!pngs) {
    // classic / global / space all use the classic atlas
    await loadBuildingAssets();
    loadedAges.add(ageId);
    return;
  }
  const ok = await loadAtlas(ageId, pngs);
  if (!ok) await loadPngs(pngs);
  loadedAges.add(ageId);
}

// Preload all ages sequentially in background — one at a time to avoid
// simultaneous GPU texture uploads that freeze the main thread.
// Yield to browser between each atlas so GPU uploads don't cause per-age stutters.
function yieldFrame() {
  return new Promise(resolve =>
    (typeof requestIdleCallback !== 'undefined')
      ? requestIdleCallback(resolve, { timeout: 800 })
      : setTimeout(resolve, 100)
  );
}

export async function preloadAllAges() {
  for (const id of Object.keys(AGE_BUILDING_PNGS)) {
    console.time(`[T] preload:${id}`);
    await loadBuildingAssetsForAge(id);
    console.timeEnd(`[T] preload:${id}`);
    await yieldFrame(); // give browser a frame to breathe before next atlas
  }
}

export function getBuildingTexture(level, ageId) {
  const pngs = (ageId && AGE_BUILDING_PNGS[ageId]) ? AGE_BUILDING_PNGS[ageId] : BUILDING_PNGS;
  const src = pngs[Math.min(level - 1, pngs.length - 1)];
  return textureCache[src] ?? null;
}

const TILE_BOX_SRCS = [
  'assets/ui/ui_ingame_main_icon_box_01.png',
  'assets/ui/ui_ingame_main_icon_box_02.png',
  'assets/ui/ui_ingame_main_icon_box_03.png',
  'assets/ui/ui_ingame_main_icon_box_04.png',
  'assets/ui/ui_ingame_main_icon_box_05.png',
  'assets/ui/ui_ingame_main_icon_box_06.png',
];
const tileBoxCache = {};

export async function loadTileBoxAssets() {
  for (const src of TILE_BOX_SRCS) {
    if (!Assets.resolver.hasKey(src)) Assets.add({ alias: src, src: BASE + src });
  }
  const loaded = await Assets.load(TILE_BOX_SRCS);
  for (const src of TILE_BOX_SRCS) {
    if (loaded[src]) tileBoxCache[src] = loaded[src];
  }
}

export function getTileBoxTexture(level) {
  const src = TILE_BOX_SRCS[((level - 1) % 6)];
  return tileBoxCache[src] ?? null;
}
