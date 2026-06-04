import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { AGES } from '../config/ages.js';
import {
  SIZE, emptyGrid, newTile, spawnRandom, cloneGrid,
  move, canMove, highestLevel, nextId,
} from '../systems/logic/GameLogic.js';
import { BoardView } from '../systems/board/BoardView.js';
import { loadBuildingAssetsForAge, preloadAllAges, loadTileBoxAssets } from '../systems/board/AssetLoader.js';
import { audioManager } from '../systems/audio/AudioSystem.js';
import { GameManager } from '../core/GameManager.js';
import { Board } from '../prefabs/Board.jsx';
import {
  SkylineBg, TopHUD, BottomBar, BoosterBar, FloatingClouds,
  GameOverPopup, ShopPopup,
  RestartConfirmPopup, SettingsPopup, WarnPopup,
  CitySelectModal, CityChangeConfirmPopup, DailyRewardPopup,
  CityCompletePopup, NewCityBoostPopup,
  BillboardCar, HowToPlayPopup,
} from '../prefabs/ui.jsx';
import DebugHUD from '../prefabs/DebugHUD.jsx';

// Runtime leak diagnostics overlay — only when ?debug=1 is in the URL.
const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');
// iOS Safari: a full-screen continuously-animating DOM layer (clouds) over the WebGL
// canvas forces per-frame whole-viewport compositing → ~1 FPS. Disabled on mobile.
const IS_MOBILE = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

const CITY_IDS = ['stone','egypt','medieval','industrial','china','classic','global','space'];
function getNextCity(id) {
  const i = CITY_IDS.indexOf(id);
  return i >= 0 && i < CITY_IDS.length - 1 ? CITY_IDS[i + 1] : null;
}
const CITY_UNLOCK_THRESHOLDS = { stone:9, egypt:10, medieval:11, industrial:11, china:12, classic:12, global:12 };

// ── Save / Load ───────────────────────────────────────────────────────────────
const SAVE_KEY = 'city2048-save';
function getSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null') ?? {}; }
  catch { return {}; }
}
function clearSave() { localStorage.removeItem(SAVE_KEY); }

const TWEAK_DEFAULTS = {
  age: getSave().age || 'stone',
  tileStyle: 'png',
  particles: true,
};

const CELL = 76;
const GAP = 7;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CityGame() {
  const [tweaks, setTweaksState] = useState(TWEAK_DEFAULTS);
  const setTweak = useCallback((key, val) => {
    setTweaksState(prev => ({ ...prev, [key]: val }));
  }, []);
  const ageData = AGES[tweaks.age] || AGES.classic;
  const bgFrom = ageData.bgFrom;
  const bgTo   = ageData.bgTo;

  // Sync outer wrapper background (fills letterbox sides)
  useEffect(() => {
    document.documentElement.style.setProperty('--bg-from', bgFrom);
    document.documentElement.style.setProperty('--bg-to', bgTo);
  }, [bgFrom, bgTo]);

  const [grid, setGrid] = useState(() => {
    const save = getSave();
    if (save.grid) {
      try {
        const g = emptyGrid();
        for (let r = 0; r < SIZE; r++)
          for (let c = 0; c < SIZE; c++)
            if (save.grid[r]?.[c]) g[r][c] = newTile(save.grid[r][c], r, c);
        return g;
      } catch {}
    }
    return spawnRandom(spawnRandom(emptyGrid()));
  });

  const [score, setScore] = useState(() => getSave().score ?? 0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('city2048-hs') || '0', 10));
  const [history, setHistory] = useState([]);
  const [gameOver, setGameOver] = useState(() => {
    const save = getSave();
    if (!save.grid) return false;
    try {
      const g = emptyGrid();
      for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++)
          if (save.grid[r]?.[c]) g[r][c] = newTile(save.grid[r][c], r, c);
      return !canMove(g);
    } catch { return false; }
  });
  const [unlockedLevels, setUnlockedLevels] = useState(new Set([1, 2]));
  const [removeMode, setRemoveMode] = useState(false);
  const [wandMode, setWandMode] = useState(false);
  const [removeHighestWarn, setRemoveHighestWarn] = useState(null);
  const [coins, setCoins] = useState(() => getSave().coins ?? 250);
  const [showShop, setShowShop] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [coinShake, setCoinShake] = useState(false);
  const [flyingCoins, setFlyingCoins] = useState([]);
  const [undoItems, setUndoItems] = useState(() => getSave().undoItems ?? 0);
  const [removeItems, setRemoveItems] = useState(() => getSave().removeItems ?? 0);
  const [wandItems, setWandItems] = useState(() => getSave().wandItems ?? 0);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCitySelect, setShowCitySelect] = useState(false);
  const [showCityChangeConfirm, setShowCityChangeConfirm] = useState(false);
  const [pendingCity, setPendingCity] = useState(null);
  const [showCityComplete, setShowCityComplete] = useState(false);
  const [showNewCityBoost, setShowNewCityBoost] = useState(false);
  const [nextCityId, setNextCityId] = useState(null);
  const [hasShownCityComplete, setHasShownCityComplete] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const needHowToPlay = !localStorage.getItem('city2048-htp');

  const [dailyStreak, setDailyStreak] = useState(1);
  const [highestPerAge, setHighestPerAge] = useState(() => {
    try { return JSON.parse(localStorage.getItem('city2048-hpa') || '{}'); }
    catch { return {}; }
  });

  // PixiJS refs
  const canvasRef = useRef(null);
  const preloadStartedRef = useRef(false);
  const ageEffectInitRef = useRef(false);
  const boardViewRef = useRef(null);
  const saveTimerRef = useRef(null);
  const gridRef = useRef(grid);
  const isAnimatingRef = useRef(false);
  const spawnedCellRef = useRef(null);
  const coinPanelRef = useRef(null);
  const adButtonRef = useRef(null);
  const cityCompletePendingRef = useRef(false);
  const turnCountRef = useRef(0);
  const gameOverTimerRef = useRef(null);

  useEffect(() => { gridRef.current = grid; }, [grid]);

  const scoreRef = useRef(score);
  useEffect(() => { scoreRef.current = score; }, [score]);
  const unlockedLevelsRef = useRef(unlockedLevels);
  useEffect(() => { unlockedLevelsRef.current = unlockedLevels; }, [unlockedLevels]);
  const coinsRef = useRef(coins);
  useEffect(() => { coinsRef.current = coins; }, [coins]);
  const undoItemsRef = useRef(undoItems);
  useEffect(() => { undoItemsRef.current = undoItems; }, [undoItems]);
  const removeItemsRef = useRef(removeItems);
  useEffect(() => { removeItemsRef.current = removeItems; }, [removeItems]);
  const wandItemsRef = useRef(wandItems);
  useEffect(() => { wandItemsRef.current = wandItems; }, [wandItems]);
  const historyRef = useRef(history);
  useEffect(() => { historyRef.current = history; }, [history]);
  const removeModeRef = useRef(removeMode);
  useEffect(() => { removeModeRef.current = removeMode; }, [removeMode]);
  const wandModeRef = useRef(wandMode);
  useEffect(() => { wandModeRef.current = wandMode; }, [wandMode]);

  // Audio: sync SFX mute state
  useEffect(() => { audioManager.setMuted(!soundOn); }, [soundOn]);

  // Audio: BGM controlled by musicOn
  useEffect(() => {
    if (musicOn) audioManager.playBGM(tweaks.age);
    else audioManager.stopBGM?.();
  }, [tweaks.age, musicOn]);

  // Persist game state to localStorage — debounced 500ms to batch rapid state changes
  // (score + grid both update per move → would otherwise write twice per swipe)
  useEffect(() => {
    if (gameOver) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          v: 1,
          grid: grid.map(row => row.map(t => t?.level ?? null)),
          score,
          coins,
          undoItems,
          removeItems,
          wandItems,
          age: tweaks.age,
        }));
      } catch {}
    }, 500);
  }, [grid, score, coins, undoItems, removeItems, wandItems, tweaks.age, gameOver]);

  // Daily reward check
  useEffect(() => {
    const last = localStorage.getItem('city2048-lastClaim');
    const today = todayStr();
    if (last !== today) {
      const streak = parseInt(localStorage.getItem('city2048-streak') || '0', 10);
      const newStreak = last === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        ? Math.min(streak + 1, 7)
        : 1;
      setDailyStreak(newStreak);
      const timer = setTimeout(() => {
        startTransition(() => setShowDailyReward(true));
        audioManager.playSfx('popup');
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      // Daily reward already claimed today → show HTP if first time
      if (!localStorage.getItem('city2048-htp')) {
        const t = setTimeout(() => startTransition(() => setShowHowToPlay(true)), 800);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const claimDailyReward = (reward) => {
    if (reward.type === 'coins')  setCoins(c => c + reward.amount);
    else if (reward.type === 'undo')   setUndoItems(n => n + reward.amount);
    else if (reward.type === 'remove') setRemoveItems(n => n + reward.amount);
    else if (reward.type === 'wand')   setWandItems(n => n + reward.amount);
    localStorage.setItem('city2048-lastClaim', todayStr());
    localStorage.setItem('city2048-streak', String(dailyStreak));
    setShowDailyReward(false);
    audioManager.playSfx('wonder');
    if (!localStorage.getItem('city2048-htp')) { setTimeout(() => setShowHowToPlay(true), 400); }
  };

  // Track highest tile level per age + detect city completion
  useEffect(() => {
    const h = highestLevel(grid);
    // Sync progress bar: unlock all levels 1→h whenever grid changes
    if (h > 0) {
      setUnlockedLevels(prev => {
        if (prev.has(h)) return prev;
        const next = new Set(prev);
        for (let i = 1; i <= h; i++) next.add(i);
        return next;
      });
    }
    const age = tweaks.age;
    setHighestPerAge(prev => {
      if ((prev[age] || 0) >= h) return prev;
      const next = { ...prev, [age]: h };
      localStorage.setItem('city2048-hpa', JSON.stringify(next));
      return next;
    });
    const threshold = CITY_UNLOCK_THRESHOLDS[age];
    const prevH = highestPerAge[age] || 0;
    if (threshold && h >= threshold && prevH < threshold && !hasShownCityComplete) {
      const next = getNextCity(age);
      if (next) {
        cityCompletePendingRef.current = true;
        setHasShownCityComplete(true);
        setTimeout(() => {
          setNextCityId(next);
          setShowCityComplete(true);
          audioManager.playSfx('wonder2');
        }, 900);
      }
    }
  }, [grid, tweaks.age, hasShownCityComplete]);

  // Init PixiJS BoardView once canvas is mounted
  useEffect(() => {
    if (!canvasRef.current) return;
    const bv = new BoardView();
    boardViewRef.current = bv;
    if (DEBUG) window.__bv = bv;
    const age = tweaks.age;
    GameManager.init({ audio: audioManager, board: bv });
    let cancelled = false;
    let fallbackTimer = null;
    (async () => {
      try {
        console.time('[T] loadAssets');
        await Promise.all([loadBuildingAssetsForAge(age), loadTileBoxAssets()]);
        console.timeEnd('[T] loadAssets');
        if (cancelled) return;
        console.time('[T] bv.init');
        await bv.init(canvasRef.current);
        console.timeEnd('[T] bv.init');
        if (cancelled) return;
        console.time('[T] bv.render');
        bv.render(gridRef.current, { ageId: age });
        console.timeEnd('[T] bv.render');
        // Pre-warm SFX audio pool after board is visible to prevent first-play freeze.
        setTimeout(() => audioManager.preloadSfx(), 500);
        // Preload all ages lazily: triggered by city select open (handleAgeBadge)
        // or after 60s as a silent fallback so assets are ready before most users switch.
        fallbackTimer = setTimeout(() => {
          if (!preloadStartedRef.current) {
            preloadStartedRef.current = true;
            preloadAllAges();
          }
        }, 60_000);
      } catch (err) {
        console.error('[BoardView init]', err);
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      bv.destroy();
      boardViewRef.current = null;
      if (DEBUG) window.__bv = null;
    };
  }, []);

  // Load age-specific building assets and re-render when age changes (skip initial mount)
  useEffect(() => {
    if (!ageEffectInitRef.current) { ageEffectInitRef.current = true; return; }
    if (!boardViewRef.current) return;
    GameManager.onAgeChange(tweaks.age);
    loadBuildingAssetsForAge(tweaks.age).then(() => {
      boardViewRef.current?.render(gridRef.current, { ageId: tweaks.age });
    });
  }, [tweaks.age]);

  // Re-render tiles whenever grid changes
  useEffect(() => {
    if (!boardViewRef.current) return;
    const dimLevel = wandMode ? highestLevel(grid) : null;
    boardViewRef.current.render(grid, { spawnedCell: spawnedCellRef.current, ageId: tweaks.age, dimLevel });
    spawnedCellRef.current = null;
  }, [grid, wandMode]);

  const flashCoinShortage = () => {
    setCoinShake(true);
    audioManager.playSfx('button');
    setTimeout(() => setCoinShake(false), 600);
  };

  const launchFlyingCoins = (sourceEl, count = 8) => {
    if (!sourceEl || !coinPanelRef.current) return;
    const src = sourceEl.getBoundingClientRect();
    const dst = coinPanelRef.current.getBoundingClientRect();
    const root = sourceEl.closest('[data-game-root]')?.getBoundingClientRect();
    if (!root) return;
    const sx = src.left + src.width / 2 - root.left;
    const sy = src.top + src.height / 2 - root.top;
    const dx = dst.left + dst.width / 2 - root.left;
    const dy = dst.top + dst.height / 2 - root.top;
    const next = [];
    for (let i = 0; i < count; i++) {
      next.push({ id: nextId(), sx: sx + (Math.random() - 0.5) * 40, sy: sy + (Math.random() - 0.5) * 40, dx, dy, delay: i * 40 });
    }
    setFlyingCoins(p => [...p, ...next]);
    const nextIds = new Set(next.map(n => n.id));
    setTimeout(() => setFlyingCoins(p => p.filter(f => !nextIds.has(f.id))), 1200);
  };

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('city2048-hs', String(score));
      audioManager.playSfx('scoreUp');
    }
  }, [score]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMove = useCallback(async (dir) => {
    if (gameOver || removeMode || wandMode || isAnimatingRef.current) return;

    const oldGrid = gridRef.current;
    const { grid: ng, moved, scoreGained, mergedCount, highest } = move(oldGrid, dir);
    if (!moved) return;

    isAnimatingRef.current = true;
    audioManager.playSfx('move');
    if (mergedCount > 0) {
      audioManager.playSfx('merge');
      GameManager.onMerge(highest, mergedCount, scoreGained);
    }

    // Particles for merges (WebGL-based)
    if (tweaks.particles && mergedCount > 0 && boardViewRef.current) {
      for (const row of ng) {
        for (const t of row) {
          if (t && t.justMerged) {
            boardViewRef.current.spawnMergeParticles(t.r, t.c);
          }
        }
      }
    }

    if (highest > 0 && !unlockedLevelsRef.current.has(highest)) {
      setUnlockedLevels(prev => {
        const next = new Set(prev);
        for (let i = 1; i <= highest; i++) next.add(i);
        return next;
      });
    }

    setHistory(h => [...h.slice(-4), { grid: oldGrid, score: scoreRef.current }]);
    setScore(s => { GameManager.onScoreUp(scoreGained, s + scoreGained); return s + scoreGained; });

    const after = spawnRandom(ng);

    try {
      if (boardViewRef.current) {
        await boardViewRef.current.animateMove(oldGrid, after);
      }
    } finally {
      isAnimatingRef.current = false;
    }

    setGrid(after);

    // Turn-based coin drop: every 12 turns, 40% chance of 12–28 coins
    turnCountRef.current += 1;
    if (turnCountRef.current % 12 === 0 && Math.random() < 0.4) {
      const amount = 12 + Math.floor(Math.random() * 17);
      setTimeout(() => {
        setCoins(c => c + amount);
        if (canvasRef.current) launchFlyingCoins(canvasRef.current, 5);
        audioManager.playSfx('wonder');
      }, 350);
    }

    if (!canMove(after)) {
      gameOverTimerRef.current = setTimeout(() => {
        gameOverTimerRef.current = null;
        setGameOver(true);
        GameManager.onGameOver();
        audioManager.playSfx('popup');
      }, 600);
    }
  }, [gameOver, removeMode, wandMode, tweaks.particles]);
  // Keyboard
  const anyPopupOpen = !!(showCityComplete || showNewCityBoost || showShop ||
    showSettings || showCitySelect || showCityChangeConfirm || showDailyReward || showRestart || gameOver);
  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
      if (map[e.key]) { e.preventDefault(); if (!anyPopupOpen) handleMove(map[e.key]); }
      if (e.key === 'Escape') { setRemoveMode(false); setWandMode(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleMove, anyPopupOpen]);

  // Touch / swipe on the board div
  const boardSwipeRef = useRef(null);
  useEffect(() => {
    const el = boardSwipeRef.current;
    if (!el) return;
    let startX = 0, startY = 0, started = false;
    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY; started = true;
    };
    const onEnd = (e) => {
      if (!started) return;
      started = false;
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left');
      else handleMove(dy > 0 ? 'down' : 'up');
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('mousedown', onStart);
    el.addEventListener('mouseup', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('mousedown', onStart);
      el.removeEventListener('mouseup', onEnd);
    };
  }, [handleMove]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    if (undoItemsRef.current > 0) {
      setUndoItems(n => n - 1);
    } else if (coinsRef.current >= 80) {
      setCoins(c => c - 80);
    } else {
      flashCoinShortage(); return;
    }
    const last = historyRef.current[historyRef.current.length - 1];
    setGrid(last.grid);
    setScore(last.score);
    setHistory(h => h.slice(0, -1));
    setGameOver(false);
    setRemoveMode(false);
    setWandMode(false);
    audioManager.playSfx('undo');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemoveBlock = useCallback(() => {
    if (removeModeRef.current) {
      setRemoveItems(n => n + 1);
      setRemoveMode(false);
      audioManager.playSfx('button');
      return;
    }
    setWandMode(false);
    if (removeItemsRef.current === 0 && coinsRef.current < 150) { flashCoinShortage(); return; }
    let hasTiles = false;
    for (const row of gridRef.current) for (const t of row) if (t) hasTiles = true;
    if (!hasTiles) return;
    if (removeItemsRef.current > 0) setRemoveItems(n => n - 1);
    else setCoins(c => c - 150);
    setRemoveMode(true);
    audioManager.playSfx('button');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWandActivate = useCallback(() => {
    if (wandModeRef.current) {
      setWandItems(n => n + 1);
      setWandMode(false);
      audioManager.playSfx('button');
      return;
    }
    setRemoveMode(false);
    if (wandItemsRef.current === 0 && coinsRef.current < 220) { flashCoinShortage(); return; }
    let hasTiles = false;
    for (const row of gridRef.current) for (const t of row) if (t) hasTiles = true;
    if (!hasTiles) return;
    if (wandItemsRef.current > 0) setWandItems(n => n - 1);
    else setCoins(c => c - 220);
    setWandMode(true);
    audioManager.playSfx('button');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doRemoveTileAt = useCallback((r, c) => {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
    if (!gridRef.current[r] || !gridRef.current[r][c]) return false;
    setHistory(h => [...h, { grid: cloneGrid(gridRef.current), score: scoreRef.current, coins: coinsRef.current, undoItems: undoItemsRef.current, removeItems: removeItemsRef.current }].slice(-10));
    setGrid(g => { const ng = cloneGrid(g); ng[r][c] = null; return ng; });
    setRemoveMode(false);
    audioManager.playSfx('broom');
    return true;
  }, []);

  const removeTileAt = useCallback((r, c) => {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return false;
    const tile = gridRef.current?.[r]?.[c];
    if (!tile) return false;
    const boardHighest = highestLevel(gridRef.current);
    if (tile.level === boardHighest) {
      setRemoveHighestWarn({ r, c });
      return false;
    }
    return doRemoveTileAt(r, c);
  }, [doRemoveTileAt]);

  const useWandOnTile = useCallback((r, c) => {
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    const currentGrid = gridRef.current;
    if (!currentGrid[r] || !currentGrid[r][c]) return;
    const tile = currentGrid[r][c];
    const boardHighest = highestLevel(currentGrid);
    if (tile.level >= boardHighest || tile.level >= 64) return;

    const newLevel = tile.level + 1;
    const scoreGain = Math.pow(2, newLevel);

    setHistory(h => [...h, { grid: cloneGrid(currentGrid), score: scoreRef.current }].slice(-10));
    const ng = cloneGrid(currentGrid);
    ng[r][c] = { ...tile, id: nextId(), level: newLevel, justMerged: true, justSpawned: false };
    setGrid(ng);
    setScore(s => s + scoreGain);
    setWandMode(false);
    audioManager.playSfx('wonder');
  }, []);

  // Board click: remove mode OR wand mode
  const handleBoardClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const c = Math.floor((px - GAP) / (CELL + GAP));
    const r = Math.floor((py - GAP) / (CELL + GAP));
    if (removeMode) { removeTileAt(r, c); return; }
    if (wandMode) { useWandOnTile(r, c); return; }
  }, [removeMode, wandMode, removeTileAt, useWandOnTile]);


  useEffect(() => {
    if (!removeMode && !wandMode) return;
    const onKey = (e) => { if (e.key === 'Escape') {
      if (removeMode) setRemoveItems(n => n + 1);
      if (wandMode) setWandItems(n => n + 1);
      setRemoveMode(false); setWandMode(false);
    } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [removeMode, wandMode]);

  const doRestart = () => {
    clearTimeout(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
    clearSave();
    GameManager.onRestart();
    const g = spawnRandom(spawnRandom(emptyGrid()));
    setGrid(g);
    setScore(0);
    setHistory([]);
    setGameOver(false);

    setUnlockedLevels(new Set([1, 2]));
    setRemoveMode(false);
    setWandMode(false);
    setShowRestart(false);
    setHasShownCityComplete(false);
    cityCompletePendingRef.current = false;
    turnCountRef.current = 0;
    audioManager.playSfx('button');
  };

  const startNewCity = (cityId) => {
    clearTimeout(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
    clearSave();
    const currentIdx = CITY_IDS.indexOf(tweaks.age);
    const targetIdx = CITY_IDS.indexOf(cityId);
    GameManager.onRestart();
    setScore(0);
    setHistory([]);
    setGameOver(false);

    setUnlockedLevels(new Set([1, 2]));
    setRemoveMode(false);
    setWandMode(false);
    setHasShownCityComplete(false);
    cityCompletePendingRef.current = false;
    turnCountRef.current = 0;
    setTweak('age', cityId);
    audioManager.playBGM(cityId);
    if (targetIdx > currentIdx) {
      setGrid(emptyGrid());
      setShowNewCityBoost(true);
    } else {
      setGrid(spawnRandom(spawnRandom(emptyGrid())));
    }
  };

  const handleBoostYes = () => {
    let g = spawnRandom(spawnRandom(emptyGrid()));
    const empty = [];
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (!g[r][c]) empty.push([r, c]);
    if (empty.length > 0) {
      const [r, c] = empty[Math.floor(Math.random() * empty.length)];
      g = cloneGrid(g);
      g[r][c] = newTile(7, r, c);
    }
    setGrid(g);
    setShowNewCityBoost(false);
    audioManager.playSfx('wonder');
  };

  const handleBoostNo = () => {
    setGrid(spawnRandom(spawnRandom(emptyGrid())));
    setShowNewCityBoost(false);
    audioManager.playSfx('button');
  };

  const handleCitySelect = (id) => {
    setPendingCity(id);
    setShowCitySelect(false);
    setShowCityChangeConfirm(true);
  };

  const confirmCityChange = () => {
    setPendingCity(null);
    setShowCityChangeConfirm(false);
    startNewCity(pendingCity);
  };

  // BottomBar manages its own cooldown; parent just handles reward
  const handleAdReward = useCallback(() => {
    if (adButtonRef.current) launchFlyingCoins(adButtonRef.current, 10);
    setTimeout(() => setCoins(c => c + 70), 700);
    audioManager.playSfx('wonder');
  }, []);

  // BillboardCar manages its own cooldown + visibility
  const handleCarEarned = useCallback(() => {
    if (canvasRef.current) launchFlyingCoins(canvasRef.current, 8);
    setTimeout(() => setCoins(c => c + 70), 700);
    audioManager.playSfx('wonder');
  }, []);

  // Stable TopHUD / BottomBar callbacks
  const handleRestartPress = useCallback(() => setShowRestart(true), []);
  const handleSettings = useCallback(() => { setShowSettings(true); audioManager.playSfx('popup'); }, []);
  const handleCoinPress = useCallback(() => { setShowShop(true); audioManager.playSfx('popup'); }, []);
  const startPreloadAllAges = useCallback(() => {
    if (preloadStartedRef.current) return;
    preloadStartedRef.current = true;
    preloadAllAges();
  }, []);

  const handleAgeBadge = useCallback(() => {
    startPreloadAllAges();
    setShowCitySelect(true);
    audioManager.playSfx('popup');
  }, [startPreloadAllAges]);

  const handleGameOverContinueAd = () => {
    clearTimeout(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
    setGrid(g => {
      const ng = cloneGrid(g);
      const tiles = [];
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
        if (ng[r][c]) tiles.push({ r, c, level: ng[r][c].level });
      }
      tiles.sort((a, b) => a.level - b.level);
      for (let i = 0; i < Math.min(3, tiles.length); i++) ng[tiles[i].r][tiles[i].c] = null;
      return ng;
    });
    setGameOver(false);
    audioManager.playSfx('button');
  };

  const handleGameOverContinue = () => {
    clearTimeout(gameOverTimerRef.current);
    gameOverTimerRef.current = null;
    if (coins < 200) { flashCoinShortage(); return; }
    setCoins(c => c - 200);
    setGrid(g => {
      const ng = cloneGrid(g);
      const tiles = [];
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
        if (ng[r][c]) tiles.push({ r, c, level: ng[r][c].level });
      }
      tiles.sort((a, b) => a.level - b.level);
      for (let i = 0; i < Math.min(3, tiles.length); i++) ng[tiles[i].r][tiles[i].c] = null;
      return ng;
    });
    setGameOver(false);
    audioManager.playSfx('button');
  };

  const handleShopPurchase = (item, sourceEl) => {
    audioManager.playSfx('button');
    const shootCoins = () => { if (sourceEl) launchFlyingCoins(sourceEl, 10); };
    if (item === 'undo5') {
      if (coins < 320) { flashCoinShortage(); return; }
      setCoins(c => c - 320); setUndoItems(n => n + 5);
    } else if (item === 'wand3') {
      if (coins < 390) { flashCoinShortage(); return; }
      setCoins(c => c - 390); setWandItems(n => n + 3);
    } else if (item === 'remove3') {
      if (coins < 255) { flashCoinShortage(); return; }
      setCoins(c => c - 255); setRemoveItems(n => n + 3);
    } else if (item === 'coins1000') {
      shootCoins(); setCoins(c => c + 1000);
    } else if (item === 'coins3000') {
      shootCoins(); setCoins(c => c + 3000);
    } else if (item === 'coins7500') {
      shootCoins(); setCoins(c => c + 7500);
    } else if (item === 'noads') {
      shootCoins(); setCoins(c => c + 300);
    } else if (item === 'freeAd') {
      setShowShop(false);
      shootCoins();
      setTimeout(() => setCoins(c => c + 70), 300);
      audioManager.playSfx('wonder');
    } // shop ad: independent, no cooldown
  };

  return (
    <div data-game-root className={showDailyReward || showHowToPlay ? 'game-paused' : undefined} style={{
      width: '100%', height: '100%',
      background: `linear-gradient(180deg, ${bgFrom} 0%, ${bgTo} 100%)`,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-ui)', color: 'var(--ink-700)',
      position: 'relative', overflow: 'hidden',
    }}>
      {DEBUG && <DebugHUD />}
      <FloatingClouds age={tweaks.age} />
      {!IS_MOBILE && <BillboardCar onEarned={handleCarEarned} />}

      <TopHUD
        ageData={ageData} score={score} highScore={highScore}
        coins={coins} coinPanelRef={coinPanelRef} coinShake={coinShake}
        onSettings={handleSettings}
        onCoinPress={handleCoinPress}
        onAgeBadge={handleAgeBadge}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <BoosterBar
          onUndo={handleUndo} onWand={handleWandActivate} onRemove={handleRemoveBlock}
          canUndo={history.length > 0 && (undoItems > 0 || coins >= 80)}
          removeMode={removeMode} wandMode={wandMode}
          undoItems={undoItems} removeItems={removeItems} wandItems={wandItems}
        />

        <div ref={boardSwipeRef} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '14px 18px',
          position: 'relative', zIndex: 2,
          touchAction: 'none',
        }}>

        {(removeMode || wandMode) && (
          <div style={{ position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center', zIndex: 80, pointerEvents: 'none' }}>
            <div style={{
              display: 'inline-block',
              background: wandMode ? 'linear-gradient(180deg,#B060E8,#8030C0)' : 'var(--brand-orange-400)',
              color: 'var(--paper-50)', padding: '7px 16px', borderRadius: 999,
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
              boxShadow: '0 3px 0 rgba(58,30,14,0.35)',
            }}>
              {wandMode ? '✨ Select a building to upgrade' : '🧹 Select a building to remove'}
            </div>
          </div>
        )}

        <Board
          ageData={ageData}
          canvasRef={canvasRef}
          removeMode={removeMode}
          wandMode={wandMode}
          onBoardClick={handleBoardClick}
        />
        </div>
        <div style={{ height: 91, flexShrink: 0 }} />
      </div>

      <BottomBar
        onRestart={handleRestartPress}
        onAdReward={handleAdReward}
        adButtonRef={adButtonRef}
      />

      {showHowToPlay && (
        <HowToPlayPopup onClose={() => { localStorage.setItem('city2048-htp', '1'); setShowHowToPlay(false); }} />
      )}
      {gameOver && <GameOverPopup score={score} highScore={highScore} onRestart={doRestart} onContinue={handleGameOverContinue} onContinueAd={handleGameOverContinueAd} />}
      {showShop && <ShopPopup coins={coins} undoItems={undoItems} removeItems={removeItems} wandItems={wandItems} onClose={() => setShowShop(false)} onPurchase={handleShopPurchase} />}
      {showRestart && <RestartConfirmPopup onCancel={() => setShowRestart(false)} onConfirm={doRestart} />}
      {removeHighestWarn && <WarnPopup title="Remove Best Building?" message="This is your highest-level building!" sub="Are you sure you want to remove it?" confirmLabel="REMOVE" cancelLabel="CANCEL" onCancel={() => setRemoveHighestWarn(null)} onConfirm={() => { doRemoveTileAt(removeHighestWarn.r, removeHighestWarn.c); setRemoveHighestWarn(null); }} />}
      {showSettings && <SettingsPopup onClose={() => setShowSettings(false)} soundOn={soundOn} onToggleSound={() => setSoundOn(s => !s)} musicOn={musicOn} onToggleMusic={() => setMusicOn(m => !m)} onRestart={() => { setShowSettings(false); setShowRestart(true); }} />}
      {showCitySelect && (
        <CitySelectModal
          currentAge={tweaks.age}
          highestPerAge={highestPerAge}
          onSelect={handleCitySelect}
          onClose={() => setShowCitySelect(false)}
        />
      )}
      {showCityChangeConfirm && (
        <CityChangeConfirmPopup
          ageData={AGES[pendingCity]}
          onCancel={() => { setShowCityChangeConfirm(false); setPendingCity(null); setShowCitySelect(true); }}
          onConfirm={confirmCityChange}
        />
      )}
      {showCityComplete && (
        <CityCompletePopup
          currentAgeData={ageData}
          nextAgeData={AGES[nextCityId]}
          onClose={() => setShowCityComplete(false)}
          onContinue={() => {
            setShowCityComplete(false);
            startNewCity(nextCityId);
            setNextCityId(null);
          }}
        />
      )}
      {showNewCityBoost && (
        <NewCityBoostPopup age={tweaks.age} onYes={handleBoostYes} onNo={handleBoostNo} />
      )}
      {showDailyReward && (
        <DailyRewardPopup streak={dailyStreak} onClaim={claimDailyReward} onClose={() => setShowDailyReward(false)} />
      )}

      {flyingCoins.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 200 }}>
          {flyingCoins.map(fc => (
            <div key={fc.id} className="flying-coin" style={{
              position: 'absolute', left: fc.sx, top: fc.sy,
              '--dx': `${fc.dx - fc.sx}px`, '--dy': `${fc.dy - fc.sy}px`,
              animationDelay: `${fc.delay}ms`,
            }}>
              <img src="assets/icons/coin.png" width={20} height={20} style={{ display: 'block' }} />
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
