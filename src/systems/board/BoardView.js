import { Application, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { getBuildingTexture, getTileBoxTexture } from './AssetLoader.js';
import { AGES } from '../../config/ages.js';

// Mobile: skip merge particles (16+ animated sprites/frame is costly on iOS Safari WebGL)
const IS_MOBILE = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

function ageBadgeColor() {
  return 0xFFFFFF;
}

function darkenColor(hex, factor = 0.5) {
  const r = Math.round(((hex >> 16) & 0xFF) * factor);
  const g = Math.round(((hex >> 8) & 0xFF) * factor);
  const b = Math.round((hex & 0xFF) * factor);
  return (r << 16) | (g << 8) | b;
}

const CELL = 76;
const GAP = 7;
const SIZE = 4;
const BOARD_PX = SIZE * CELL + (SIZE + 1) * GAP;

const TILE_NUMBERS = [2,4,8,16,32,64,128,256,512,1024,2048,4096];
const BADGE_W = num => num >= 10000 ? 38 : num >= 1000 ? 32 : num >= 100 ? 28 : 22;
const BADGE_H = 20;

function cellX(c) { return GAP + c * (CELL + GAP) + CELL / 2; }
function cellY(r) { return GAP + r * (CELL + GAP) + CELL / 2; }

// ── Overscan / CTR_Y tables ─────────────────────────────────
const OVERSCANS_CLASSIC = [0.986, 0.946, 0.904, 0.876, 0.998, 1.002,
                            1.018, 0.972, 1.139, 1.169, 1.030, 1.054];
const CTR_Y_CLASSIC     = [0.454, 0.447, 0.447, 0.463, 0.411, 0.393,
                            0.407, 0.409, 0.381, 0.375, 0.390, 0.403];
const CTR_X_CLASSIC     = [0.521, 0.532, 0.476, 0.458, 0.499, 0.461,
                            0.457, 0.463, 0.542, 0.499, 0.516, 0.452];
const AGE_OVERSCANS = {
  stone:      [0.849, 0.869, 1.150, 0.910, 0.930, 0.950, 0.970, 0.990, 1.010, 1.031, 1.051, 1.071, 1.091, 1.111],
  china:      [0.853, 0.872, 0.892, 0.911, 0.931, 0.950, 0.969, 0.989, 1.008, 1.028, 1.047, 1.067, 1.086, 1.105],
  egypt:      [0.853, 0.872, 0.892, 0.911, 0.931, 0.950, 0.969, 0.989, 1.008, 1.028, 1.047, 1.067, 1.086, 1.105],
  industrial: [0.849, 0.869, 0.890, 0.910, 0.930, 0.950, 0.970, 0.990, 1.010, 1.031, 1.051, 1.071, 1.091, 1.111],
  medieval:   [0.842, 0.864, 0.885, 0.907, 0.928, 0.950, 0.972, 0.993, 1.015, 1.036, 1.058, 1.079, 1.101, 1.122],
};
const AGE_CTR_Y = {
  stone:      [0.498, 0.500, 0.570, 0.498, 0.498, 0.498, 0.500, 0.495, 0.500, 0.495, 0.505, 0.502, 0.502, 0.500],
  china:      [0.495, 0.498, 0.502, 0.498, 0.495, 0.491, 0.493, 0.505, 0.507, 0.505, 0.498, 0.498, 0.498, 0.498],
  egypt:      [0.500, 0.500, 0.498, 0.495, 0.500, 0.502, 0.514, 0.500, 0.500, 0.502, 0.502, 0.498, 0.498, 0.500],
  industrial: [0.514, 0.495, 0.511, 0.495, 0.498, 0.498, 0.502, 0.498, 0.507, 0.500, 0.502, 0.534, 0.536, 0.534],
  medieval:   [0.502, 0.498, 0.511, 0.500, 0.498, 0.502, 0.498, 0.502, 0.505, 0.502, 0.507, 0.505, 0.505, 0.505],
};

function isClassicAge(ageId) {
  return !ageId || ageId === 'classic' || ageId === 'global' || ageId === 'space';
}

function getBuildingTransform(level, ageId, texWidth) {
  const idx = Math.min(level - 1, 11);
  if (isClassicAge(ageId)) {
    const ov = OVERSCANS_CLASSIC[idx];
    const renderedH = CELL * ov;
    return {
      scale: (CELL * ov) / texWidth,
      x: (0.5 - CTR_X_CLASSIC[idx]) * renderedH,
      y: (0.5 - CTR_Y_CLASSIC[idx]) * renderedH,
    };
  }
  const ageOvr  = AGE_OVERSCANS[ageId];
  const ageCtrY = AGE_CTR_Y[ageId];
  const ov  = ageOvr  ? ageOvr[Math.min(level - 1, ageOvr.length - 1)]   : 1.0;
  const ctrY = ageCtrY ? ageCtrY[Math.min(level - 1, ageCtrY.length - 1)] : 0.5;
  return {
    scale: (CELL * ov) / texWidth,
    x: 0,
    y: (0.5 - ctrY) * CELL,
  };
}

export class BoardView {
  constructor() {
    this._app = null;
    this._sprites = new Map();    // id -> Container
    this._tileContainer = null;
    this._bgTexture = null;
    this._clipMaskTexture = null;
    this._labelTextureCache = new Map(); // num -> Texture
    this._badgeBgCache = new Map();      // `${ageId}:${badgeW}` -> Texture
    // Pool keyed by ageId only — any level's sprite can be reused for any other level
    // by calling _updateTileContents(). This ensures merge (N→N+1) always hits the pool.
    this._pool = new Map();              // ageId -> Container[]
    this._ageId = null;
    this._particleContainer = null;
    this._particleTexture = null;
  }

  async init(canvas) {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const resolution = isMobile
      ? Math.min(window.devicePixelRatio || 1, 1.5)
      : (window.devicePixelRatio || 1);

    this._app = new Application();
    await this._app.init({
      canvas,
      width: BOARD_PX,
      height: BOARD_PX,
      backgroundAlpha: 0,
      antialias: !isMobile,
      autoDensity: true,
      resolution,
      preference: 'webgl',
    });

    // C1: Stop continuous 60fps rendering — render only on demand.
    // We call _renderFrame() manually after each state change and start/stop
    // the ticker only during GSAP animations.
    this._app.ticker.stop();

    this._tileContainer = new Container();
    this._app.stage.addChild(this._tileContainer);

    this._particleContainer = new Container();
    this._app.stage.addChild(this._particleContainer);

    this._warmupCaches();
  }

  _warmupCaches() {
    // Only generate the two cheap Graphics textures needed before first render.
    // Label textures are generated lazily via _getLabelTexture() on first use,
    // so we never block the main thread upfront for 12 drop-shadow blur passes.
    console.time('[T] warmup:bgClip');
    const gfxBg = new Graphics();
    gfxBg.roundRect(0, 0, CELL, CELL, 12);
    gfxBg.fill({ color: 0xFFFFFF });
    this._bgTexture = this._app.renderer.generateTexture(gfxBg);
    gfxBg.destroy();

    const gfxClip = new Graphics();
    gfxClip.roundRect(0, 0, CELL, CELL, 12);
    gfxClip.fill(0xFFFFFF);
    this._clipMaskTexture = this._app.renderer.generateTexture(gfxClip);
    gfxClip.destroy();
    console.timeEnd('[T] warmup:bgClip');
  }

  // Lazy label texture — generates on first call for each number, then cached.
  // At game start only 2 tiles exist, so only 2 textures are created upfront.
  _getLabelTexture(num) {
    if (this._labelTextureCache.has(num)) return this._labelTextureCache.get(num);
    console.time(`[T] labelTex:${num}`);
    const fontSize = num >= 10000 ? 11 : num >= 1000 ? 12 : num >= 100 ? 13 : 15;
    const t = new Text({
      text: String(num),
      style: {
        fontFamily: 'Baloo 2, system-ui, sans-serif',
        fontSize,
        fontWeight: '800',
        fill: 0x1A2845,
        // No drop shadow — badge bg provides sufficient contrast.
        // drop shadow triggers GPU shader compilation on first call (1-2s freeze on mobile).
      },
    });
    const tex = this._app.renderer.generateTexture(t);
    t.destroy();
    this._labelTextureCache.set(num, tex);
    console.timeEnd(`[T] labelTex:${num}`);
    return tex;
  }

  // ── Sprite Pool ──────────────────────────────────────────────────────────────
  // Pool keyed by ageId only. On reuse, _updateTileContents() refreshes all
  // visuals for the new level. This guarantees pool hits on every merge (N→N+1)
  // regardless of which level is acquired vs released.

  _acquireFromPool(ageId) {
    const list = this._pool.get(ageId);
    if (list && list.length > 0) {
      const c = list.pop();
      c.visible = true;
      c.alpha = 1;
      c.scale.set(1, 1);
      return c;
    }
    return null;
  }

  _releaseToPool(container) {
    gsap.killTweensOf(container);
    gsap.killTweensOf(container.scale);
    container.visible = false;
    container.alpha = 1;
    container.scale.set(1, 1);
    const ageId = container.__ageKey;
    if (!ageId) { container.destroy({ children: true, texture: false }); return; }
    if (!this._pool.has(ageId)) this._pool.set(ageId, []);
    const list = this._pool.get(ageId);
    // Max 20 per age (board fits 16 tiles + margin for mid-animation)
    if (list.length < 20) list.push(container);
    else container.destroy({ children: true, texture: false });
  }

  _destroyPoolForAge(ageId) {
    const list = this._pool.get(ageId);
    if (!list) return;
    for (const c of list) c.destroy({ children: true, texture: false });
    this._pool.delete(ageId);
    // C1: Free badge RenderTextures for this age to prevent accumulation
    for (const [key, tex] of this._badgeBgCache) {
      if (key.startsWith(`${ageId}:`)) {
        tex.destroy(true);
        this._badgeBgCache.delete(key);
      }
    }
  }

  // Update all visuals of a pooled container for a new level/age.
  // Textures are already cached — this is just reference swaps (cheap).
  _updateTileContents(container, level, ageId) {
    const num    = TILE_NUMBERS[Math.min(level - 1, 11)];
    const badgeW = BADGE_W(num);

    // bg texture
    if (container.__bg) {
      const tileBoxTex = getTileBoxTexture(level);
      if (tileBoxTex) {
        container.__bg.texture = tileBoxTex;
        container.__bg.tint = 0xFFFFFF;
        container.__bg.alpha = 1;
      } else {
        container.__bg.texture = this._bgTexture;
        const paletteHex = AGES[ageId]?.tilePalette?.[Math.min(level - 1, 13)]?.[0];
        container.__bg.tint = paletteHex ? parseInt(paletteHex.replace('#', ''), 16) : 0xFFF8EC;
        container.__bg.alpha = 0.55;
      }
    }

    // building image
    const tex = getBuildingTexture(level, ageId);
    if (container.__img) {
      if (tex && tex !== Texture.EMPTY) {
        const t = getBuildingTransform(level, ageId, tex.width);
        container.__img.texture = tex;
        container.__img.scale.set(t.scale);
        container.__img.x = t.x;
        container.__img.y = t.y;
        if (container.__imgWrapper) container.__imgWrapper.visible = true;
      } else {
        if (container.__imgWrapper) container.__imgWrapper.visible = false;
      }
    }

    // badge background
    const badgeBgKey = `${ageId}:${badgeW}`;
    if (!this._badgeBgCache.has(badgeBgKey)) {
      const bColor = ageBadgeColor();
      const gfx = new Graphics();
      gfx.roundRect(0, 0, badgeW, BADGE_H, 5);
      gfx.fill({ color: bColor });
      gfx.stroke({ color: 0xCCCCCC, width: 1 });
      this._badgeBgCache.set(badgeBgKey, this._app.renderer.generateTexture(gfx));
      gfx.destroy();
    }
    if (container.__badgeBg) {
      container.__badgeBg.texture = this._badgeBgCache.get(badgeBgKey);
      container.__badgeBg.x = CELL / 2 - badgeW - 3;
    }

    // label
    if (container.__label) {
      container.__label.texture = this._getLabelTexture(num);
      container.__label.x = CELL / 2 - badgeW / 2 - 3;
    }

    container.__ageKey = ageId;
  }

  // ── Animation ────────────────────────────────────────────────────────────────

  // ── On-demand rendering helpers ──────────────────────────────────────────────
  _startTicker() {
    if (this._app && !this._app.ticker.started) this._app.ticker.start();
  }

  _stopTickerAfter(ms) {
    clearTimeout(this._stopTickerTimer);
    this._stopTickerTimer = setTimeout(() => {
      if (this._app) this._app.ticker.stop();
    }, ms);
  }

  animateMove(oldGrid, newGrid) {
    if (!this._app) return Promise.resolve();
    this._startTicker(); // render during position tweens

    const mergeDests = new Map();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const t = newGrid[r][c];
        if (t?.fromIds) {
          for (const srcId of t.fromIds) mergeDests.set(srcId, { r, c });
        }
      }
    }

    const survivorIds = new Set();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const t = newGrid[r][c];
        if (t && !t.fromIds) survivorIds.add(t.id);
      }
    }

    const DURATION = 0.13;
    const mergingSprites = [];
    let pending = 0;

    return new Promise(resolve => {
      let resolved = false;

      // Ensure all mergingSprites are released even if tweens never fire (safetyTimer path).
      const releaseMerging = () => {
        for (const sprite of mergingSprites) {
          if (this._tileContainer?.children.includes(sprite)) {
            this._tileContainer.removeChild(sprite);
          }
          this._releaseToPool(sprite);
        }
        mergingSprites.length = 0;
      };

      const finish = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(safetyTimer);
        releaseMerging(); // safety: release any sprites done() didn't handle
        // Keep ticker running a bit longer for the subsequent render() spawn anims
        this._stopTickerAfter(400);
        resolve();
      };

      const done = () => {
        if (--pending > 0) return;
        releaseMerging();
        finish();
      };

      const safetyTimer = setTimeout(finish, 500);

      for (const [id, sprite] of this._sprites) {
        if (survivorIds.has(id)) {
          const t = this._findInGrid(newGrid, id);
          if (t) {
            pending++;
            gsap.to(sprite, {
              x: cellX(t.c), y: cellY(t.r),
              duration: DURATION, ease: 'power3.out',
              overwrite: true, onComplete: done,
            });
          }
        } else if (mergeDests.has(id)) {
          const dest = mergeDests.get(id);
          mergingSprites.push(sprite);
          this._sprites.delete(id);
          pending++;
          gsap.to(sprite, {
            x: cellX(dest.c), y: cellY(dest.r),
            duration: DURATION, ease: 'power3.out',
            overwrite: true, onComplete: done,
          });
        }
      }

      if (pending === 0) finish();
    });
  }

  spawnMergeParticles(r, c) {
    if (!this._app) return;
    if (IS_MOBILE) return; // perf: no particles on mobile
    this._startTicker();

    const x = cellX(c);
    const y = cellY(r);
    const count = 8;

    if (!this._particleTexture) {
      const gfx = new Graphics();
      gfx.circle(0, 0, 3);
      gfx.fill({ color: 0xFFE18A });
      this._particleTexture = this._app.renderer.generateTexture(gfx);
      gfx.destroy();
    }

    for (let i = 0; i < count; i++) {
      const p = new Sprite(this._particleTexture);
      p.anchor.set(0.5);
      p.x = x;
      p.y = y;

      this._particleContainer.addChild(p);

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const distance = 40 + Math.random() * 30;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;

      gsap.to(p, {
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          if (this._particleContainer) {
            this._particleContainer.removeChild(p);
          }
          p.destroy();
        }
      });
    }

    this._stopTickerAfter(650);
  }

  render(grid, { spawnedCell, ageId, dimLevel } = {}) {
    const prevAgeId = this._ageId;
    this._ageId = ageId ?? this._ageId ?? null;
    // Guard: _bgTexture is null until _warmupCaches() completes inside init()
    if (!this._app || !this._bgTexture) return;
    let hasAnim = false;

    // Age changed — release current sprites to new-age pool, destroy old-age pool
    if (ageId && ageId !== prevAgeId && prevAgeId !== null) {
      for (const [, sprite] of this._sprites) {
        if (this._tileContainer.children.includes(sprite)) {
          this._tileContainer.removeChild(sprite);
        }
        this._releaseToPool(sprite);
      }
      this._sprites.clear();
      // Old-age pool sprites won't be reused soon → destroy to free memory
      this._destroyPoolForAge(prevAgeId);
    }

    const gridIds = new Set();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c]) gridIds.add(grid[r][c].id);
      }
    }

    for (const [id, sprite] of this._sprites) {
      if (!gridIds.has(id)) {
        this._tileContainer.removeChild(sprite);
        this._releaseToPool(sprite);
        this._sprites.delete(id);
      }
    }

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const t = grid[r][c];
        if (!t) continue;

        const isDimmed = dimLevel != null && t.level === dimLevel;
        if (this._sprites.has(t.id)) {
          const sprite = this._sprites.get(t.id);
          gsap.killTweensOf(sprite);
          gsap.killTweensOf(sprite.scale);
          sprite.scale.set(1);
          sprite.x = cellX(c);
          sprite.y = cellY(r);
          sprite.alpha = isDimmed ? 0.35 : 1;
        } else {
          const sprite = this._createTileSprite(t.level, cellX(c), cellY(r));
          sprite.alpha = isDimmed ? 0.35 : 1;
          this._tileContainer.addChild(sprite);
          this._sprites.set(t.id, sprite);

          if (t.justSpawned) {
            sprite.scale.set(0);
            gsap.to(sprite.scale, { x: 1, y: 1, duration: 0.22, ease: 'back.out(1.8)' });
            hasAnim = true;
          } else if (t.justMerged) {
            gsap.fromTo(sprite.scale,
              { x: 1.07, y: 1.07 },
              { x: 1, y: 1, duration: 0.18, ease: 'power2.out' }
            );
            hasAnim = true;
          }
        }
      }
    }

    // Render: start ticker for spawn/merge anims; otherwise do a single static frame.
    if (hasAnim) {
      this._startTicker();
      this._stopTickerAfter(350); // covers 220ms spawn + buffer
    } else {
      this._app.renderer.render(this._app.stage);
    }
  }

  destroy() {
    if (this._bgTexture) { this._bgTexture.destroy(); this._bgTexture = null; }
    if (this._clipMaskTexture) { this._clipMaskTexture.destroy(); this._clipMaskTexture = null; }
    for (const t of this._labelTextureCache.values()) t.destroy();
    this._labelTextureCache.clear();
    for (const t of this._badgeBgCache.values()) t.destroy();
    this._badgeBgCache.clear();
    if (this._particleTexture) { this._particleTexture.destroy(true); this._particleTexture = null; }
    if (this._particleContainer) { this._particleContainer.destroy({ children: true }); this._particleContainer = null; }
    for (const list of this._pool.values()) {
      for (const c of list) c.destroy({ children: true, texture: false });
    }
    this._pool.clear();
    if (this._app) {
      this._app.destroy(false, { children: true });
      this._app = null;
    }
    this._sprites.clear();
  }

  // ── Sprite creation ──────────────────────────────────────────────────────────

  _createTileSprite(level, x, y) {
    const ageId = this._ageId ?? 'classic';

    // Pool hit: reuse container, just update visual contents for the new level
    const pooled = this._acquireFromPool(ageId);
    if (pooled) {
      pooled.x = x;
      pooled.y = y;
      this._updateTileContents(pooled, level, ageId);
      return pooled;
    }

    // Pool miss: create a new container and store child references for future updates
    const container = new Container();
    container.x = x;
    container.y = y;
    container.__ageKey = ageId;

    // Background
    const tileBoxTex = getTileBoxTexture(level);
    const bg = new Sprite(tileBoxTex ?? this._bgTexture);
    bg.x = -CELL / 2;
    bg.y = -CELL / 2;
    bg.width = CELL;
    bg.height = CELL;
    if (!tileBoxTex) {
      bg.alpha = 0.55;
      const paletteHex = AGES[ageId]?.tilePalette?.[Math.min(level - 1, 13)]?.[0];
      bg.tint = paletteHex ? parseInt(paletteHex.replace('#', ''), 16) : 0xFFF8EC;
    }
    container.addChild(bg);
    container.__bg = bg;

    // Building image
    const tex = getBuildingTexture(level, ageId);
    if (tex && tex !== Texture.EMPTY) {
      const t = getBuildingTransform(level, ageId, tex.width);
      const img = new Sprite(tex);
      img.scale.set(t.scale);
      img.anchor.set(0.5, 0.5);
      img.x = t.x;
      img.y = t.y;

      const imgWrapper = new Container();
      if (!IS_MOBILE) {
        // Rounded-corner clip via sprite mask. Skipped on mobile: each masked
        // container is a separate stencil pass — catastrophic on iOS Safari WebGL
        // (11 tiles → ~7 FPS). Building art is sized to fit, so overflow is minimal.
        const clipMask = new Sprite(this._clipMaskTexture);
        clipMask.x = -CELL / 2;
        clipMask.y = -CELL / 2;
        imgWrapper.addChild(clipMask);
        imgWrapper.mask = clipMask;
      }
      imgWrapper.addChild(img);
      container.addChild(imgWrapper);
      container.__img = img;
      container.__imgWrapper = imgWrapper;
    }

    // Badge background
    const num    = TILE_NUMBERS[Math.min(level - 1, 11)];
    const badgeW = BADGE_W(num);
    const badgeBgKey = `${ageId}:${badgeW}`;
    if (!this._badgeBgCache.has(badgeBgKey)) {
      const bColor = ageBadgeColor();
      const gfx = new Graphics();
      gfx.roundRect(0, 0, badgeW, BADGE_H, 5);
      gfx.fill({ color: bColor });
      gfx.stroke({ color: 0xCCCCCC, width: 1 });
      this._badgeBgCache.set(badgeBgKey, this._app.renderer.generateTexture(gfx));
      gfx.destroy();
    }
    const badgeBg = new Sprite(this._badgeBgCache.get(badgeBgKey));
    badgeBg.x = CELL / 2 - badgeW - 3;
    badgeBg.y = -CELL / 2 + 3;
    container.addChild(badgeBg);
    container.__badgeBg = badgeBg;

    // Label
    const label = new Sprite(this._getLabelTexture(num));
    label.anchor.set(0.5, 0.5);
    label.x = CELL / 2 - badgeW / 2 - 3;
    label.y = -CELL / 2 + 3 + BADGE_H / 2;
    container.addChild(label);
    container.__label = label;

    return container;
  }

  _findInGrid(grid, id) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c]?.id === id) return grid[r][c];
      }
    }
    return null;
  }
}
