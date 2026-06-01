---
name: pixi-audio-leak-hazards
description: BoardView shared-texture destroy hazard and AudioSystem BGM decoder teardown — mobile slowdown root causes
metadata:
  type: project
---

In city_2048 (PixiJS v8 + React), mobile slowdown has TWO distinct classes of cause: (A) a steady-state idle render cost, and (B) GPU/decoder leaks.

**(A) Steady-state — the dominant FPS/heat driver (verified 2026-05-26):** BoardView.init() uses default `autoStart: true`, so the Pixi Application ticker calls renderer.render() at 60fps FOREVER even on a static board. Each idle frame redraws 16 tiles, and each tile's building image uses a per-tile Sprite mask (`imgWrapper.mask = clipMask`, _createTileSprite) — masks are the most expensive mobile-GPU op (stencil/extra pass). Net: full masked redraw 60x/sec for zero visual change → battery/heat → SoC throttle → progressive stutter. Fix: `autoStart:false`+`sharedTicker:false`, render-on-demand after mutations, drive a RAF loop ONLY while GSAP tweens active. Also preloadAllAges() (GameScene.jsx) fires all ~4MB of atlases un-awaited right after first paint → early-game jank; defer via requestIdleCallback + serialize. NOTE: flying-coins and DOM particles are CSS-animated with single-shot cleanup timers — NOT per-frame RAF/filter, so not a cause.

**(B) Leaks — these non-obvious GPU/decoder leaks:**

- **BoardView.js shared textures**: pooled tile container children (`__bg`, `__img`, `__badgeBg`, `__label`) all point at SHARED cached RenderTextures/atlas frames (`_bgTexture`, `_clipMaskTexture`, `_labelTextureCache`, `_badgeBgCache`, building atlas). `container.destroy()` MUST always pass `{ children: true, texture: false }` — destroying these textures blanks every other tile using the atlas frame.
- **`_destroyPoolForAge(ageId)`** frees pooled containers but does NOT evict that age's `_badgeBgCache` RenderTextures → they leak until full `destroy()`. City switching is the action users associate with slowdown.
- **AudioSystem.js `playBGM`/`stopBGM`** only `pause()` + null the Audio element; never `removeAttribute('src')` + `load()`. On mobile WebKit the media decoder is retained → accumulates across city switches.
- **GameScene.jsx** init useEffect (`[]` deps) calls `GameManager.init` but cleanup only does `bv.destroy()` — no GameManager teardown, so a destroyed BoardView can stay referenced.

**Why:** these are GPU/decoder-side leaks invisible to JS heap snapshots, and the SFX pool + most useEffect cleanups are already correct so they're easy to overlook.
**How to apply:** when reviewing board/audio changes, check destroy options and per-age cache eviction first.
