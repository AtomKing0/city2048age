import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { AGES } from '../config/ages.js';
import { BuildingTile, getBuildingPng } from './tiles.jsx';
import { GameImg } from './GameImg.jsx';

// Reusable 9-slice background layer — drop inside any position:relative container
function SliceSpan({ src, slice, bw }) {
  return (
    <span aria-hidden="true" style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      borderStyle: 'solid', borderWidth: 1,
      borderImage: `url('${src}') ${slice} fill / ${bw}px stretch`,
    }} />
  );
}

// Arch + floating icon header used by all major popups
function PopupArchIcon({ children, title }) {
  return (
    <>
      <img src="assets/ui/ui_pop_top.png" aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto',
          borderRadius: '20px 20px 0 0', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)',
        zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
        {title && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#3fcbff', textAlign: 'center' }}>{title}</div>}
      </div>
    </>
  );
}

function useCountUp(target, duration = 480) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef(null);
  const fromRef = useRef(target);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = fromRef.current;
    fromRef.current = target;
    if (from === target) return;
    const start = performance.now();
    const diff = target - from;
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + diff * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else setDisplay(target);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

// ── Skyline Background ─────────────────────────────────────
export const SkylineBg = memo(function SkylineBg({ age }) {
  const ageData = AGES[age] || AGES.classic;
  const [body, accent, shadow] = ageData.tilePalette[5];
  const cloudColor = age === 'industrial' ? '#9a8e70' : age === 'stone' ? '#c8e8a8' : age === 'space' ? 'transparent' : '#fff';

  const buildings = useMemo(() => {
    const arr = [];
    let x = 0;
    while (x < 360) {
      const w = 18 + Math.random() * 28;
      const h = 30 + Math.random() * 70;
      arr.push({ x, w, h });
      x += w + 2;
    }
    return arr;
  }, [age]);

  const buildingRects = buildings.map((b, i) => (
    <rect key={i} x={b.x} y={140 - b.h} width={b.w} height={b.h} fill={shadow} rx="2" />
  ));

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 130, height: 140,
      pointerEvents: 'none', zIndex: 1, opacity: 0.35,
      overflow: 'hidden',
    }}>
      {/* Two SVG copies scrolling left seamlessly */}
      <div style={{ display: 'flex', width: '200%', height: '100%', animation: 'skylineDrift 50s linear infinite' }}>
        <svg width="50%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="xMidYMax meet">
          {buildingRects}
        </svg>
        <svg width="50%" height="100%" viewBox="0 0 360 140" preserveAspectRatio="xMidYMax meet">
          {buildingRects}
        </svg>
      </div>
      <div style={{
        position: 'absolute', top: -60, right: 30, width: 60, height: 60,
        borderRadius: '50%', background: ageData.id === 'classic' ? '#f7b55f' : accent,
        boxShadow: `0 0 40px ${accent}88`, opacity: 0.6,
      }}/>
      <div style={{ position: 'absolute', top: -90, left: 30, opacity: 0.5 }}>
        <svg width="80" height="30" viewBox="0 0 80 30">
          <ellipse cx="20" cy="20" rx="20" ry="10" fill={cloudColor} />
          <ellipse cx="40" cy="15" rx="22" ry="12" fill={cloudColor} />
          <ellipse cx="60" cy="22" rx="18" ry="8" fill={cloudColor} />
        </svg>
      </div>
    </div>
  );
});

// ── Floating Clouds ────────────────────────────────────────
const CLOUD_CONFIGS = [
  { scale: 1.0,  dur: 28, delay:   0, topPct: 5  },
  { scale: 0.65, dur: 20, delay:  -7, topPct: 40 },
  { scale: 0.8,  dur: 34, delay: -14, topPct: 70 },
  { scale: 0.5,  dur: 16, delay:  -4, topPct: 20 },
  { scale: 1.1,  dur: 44, delay: -22, topPct: 55 },
];

const CLOUD_COLORS = {
  classic:    ['rgba(255,255,255,0.72)', 'rgba(220,238,255,0.65)'],
  stone:      ['rgba(210,235,185,0.65)', 'rgba(175,210,140,0.58)'],
  egypt:      ['rgba(255,242,195,0.6)',  'rgba(248,225,160,0.52)'],
  medieval:   ['rgba(198,210,182,0.58)', 'rgba(172,188,155,0.52)'],
  industrial: ['rgba(145,132,118,0.55)', 'rgba(110,100,90,0.48)'],
  china:      ['rgba(255,235,220,0.62)', 'rgba(255,215,195,0.55)'],
  global:     ['rgba(195,228,255,0.68)', 'rgba(218,240,255,0.62)'],
  space:      ['rgba(50,70,140,0.38)',   'rgba(70,35,95,0.32)'],
};

function CloudShape({ color }) {
  return (
    <svg width="96" height="42" viewBox="0 0 96 42" style={{ display: 'block' }}>
      <ellipse cx="26" cy="30" rx="23" ry="12" fill={color}/>
      <ellipse cx="48" cy="22" rx="28" ry="17" fill={color}/>
      <ellipse cx="72" cy="30" rx="21" ry="11" fill={color}/>
    </svg>
  );
}

export const FloatingClouds = memo(function FloatingClouds({ age }) {
  const palette = CLOUD_COLORS[age] || CLOUD_COLORS.classic;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'hidden' }}>
      {CLOUD_CONFIGS.map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${c.topPct}%`,
          animation: `cloudDrift ${c.dur}s linear infinite`,
          animationDelay: `${c.delay}s`,
        }}>
          <div style={{ transform: `scale(${c.scale})`, transformOrigin: 'left center' }}>
            <CloudShape color={palette[i % palette.length]} />
          </div>
        </div>
      ))}
    </div>
  );
});

// ── Score Card ─────────────────────────────────────────────
export function ScoreCard({ label, sub, value, variant }) {
  const bg = variant === 'gold' ? 'linear-gradient(180deg, #FFD86A, #F5B728)' : 'linear-gradient(180deg, #FFF8EC, #FDEFD0)';
  const labelColor = variant === 'gold' ? '#5A2A05' : '#794729';
  return (
    <div style={{
      flex: 1,
      background: bg,
      borderRadius: 12,
      padding: '5px 12px 6px',
      boxShadow: '0 3px 0 rgba(58,30,14,0.30), inset 0 1px 0 rgba(255,255,255,0.5)',
      border: '2px solid rgba(58,30,14,0.18)',
      minHeight: 56,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4, marginBottom: 1 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: labelColor, lineHeight: 1 }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: labelColor, opacity: 0.6, letterSpacing: '0.1em', lineHeight: 1 }}>{sub}</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: 33, color: variant === 'gold' ? '#5A2A05' : '#3A1E0E',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        textShadow: '0 1px 0 rgba(255,255,255,0.6)',
      }}>{value.toLocaleString()}</div>
    </div>
  );
}

// ── Coin Pill ──────────────────────────────────────────────
export function CoinPill({ coins, coinPanelRef, coinShake, onClick, big }) {
  const h = big ? 43 : 44;
  const iconSz = big ? 29 : 28;
  const fs = big ? 22 : 21;
  const displayCoins = useCountUp(coins);
  const [flashClass, setFlashClass] = useState('');
  const prevCoinsRef = useRef(coins);

  useEffect(() => {
    if (coins === prevCoinsRef.current) return;
    const cls = coins > prevCoinsRef.current ? 'coin-gain' : 'coin-lose';
    prevCoinsRef.current = coins;
    setFlashClass(cls);
    const t = setTimeout(() => setFlashClass(''), 540);
    return () => clearTimeout(t);
  }, [coins]);

  const classes = [coinShake ? 'coin-shake' : '', flashClass].filter(Boolean).join(' ');
  return (
    <button ref={coinPanelRef} onClick={onClick} className={classes} style={{
      position: 'relative',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: 'none', border: 'none',
      padding: 0,
      cursor: 'pointer',
    }}>
      <GameImg src="assets/ui/ui_coin_box.png" height={h} style={{ display: 'block' }} />
      <span style={{
        position: 'absolute',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: fs,
        color: '#ffffff',
        fontVariantNumeric: 'tabular-nums',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
      }}>{displayCoins.toLocaleString()}</span>
    </button>
  );
}

function MiniIconBtn({ children, onClick, title }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick} title={title} aria-label={title}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{
        width: 30, height: 30, borderRadius: 9,
        background: 'rgba(31,43,82,0.55)',
        border: '1.5px solid rgba(255,248,236,0.22)',
        boxShadow: pressed ? 'inset 0 2px 4px rgba(0,0,0,0.4)' : 'inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 0 rgba(58,30,14,0.3)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0,
        transform: pressed ? 'translateY(1px)' : 'none',
        transition: 'transform 80ms',
      }}
    >{children}</button>
  );
}

export function ChunkyIconButton({ children, bg = '#FFF8EC', size = 44, onClick, disabled = false, badge, glow }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{
        width: size, height: size, borderRadius: 14,
        background: bg,
        border: '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: pressed
          ? 'inset 0 2px 4px rgba(0,0,0,0.4)'
          : `0 3px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)${glow ? ', 0 0 20px rgba(248,128,24,0.5)' : ''}`,
        transform: pressed ? 'translateY(3px)' : 'none',
        transition: 'transform 80ms, box-shadow 80ms',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        position: 'relative', padding: 0, flexShrink: 0,
      }}>
      {children}
      {badge !== undefined && (
        <div style={{
          position: 'absolute', top: -6, right: -6,
          minWidth: 20, height: 20, padding: '0 5px',
          background: 'var(--brand-orange-400)', color: '#FFF8EC',
          borderRadius: 999, fontSize: 11, fontWeight: 800,
          fontFamily: 'var(--font-display)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #FFF8EC',
        }}>{badge}</div>
      )}
    </button>
  );
}

// ── Top HUD ────────────────────────────────────────────────
export const TopHUD = memo(function TopHUD({ ageData, score, highScore, coins, coinPanelRef, coinShake, onSettings, onCoinPress, onAgeBadge }) {
  return (
    <div style={{ padding: '14px 16px 8px', position: 'relative', zIndex: 10, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Coin pill — left */}
        <CoinPill coins={coins} coinPanelRef={coinPanelRef} coinShake={coinShake} onClick={onCoinPress} big />

        <div style={{ flex: 1 }} />

        {/* City select + Settings — right */}
        <ChunkyIconButton bg="rgba(0,0,0,0.28)" size={46} onClick={onAgeBadge} aria-label="City">
          <GameImg src="assets/ui/ui_btn_world_map.png" width={32} height={32} style={{ display: 'block' }} />
        </ChunkyIconButton>
        <ChunkyIconButton bg="rgba(0,0,0,0.28)" size={46} onClick={onSettings} aria-label="Settings">
          <GameImg src="assets/icons/setting.png" width={26} height={26} style={{ display: 'block' }} />
        </ChunkyIconButton>
      </div>

      {/* Score card — below main row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 8 }}>
        <div style={{
          position: 'relative',
          padding: '5px 16px', minWidth: 120,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <SliceSpan src="assets/ui/ui_ingame_score_box.png" slice={20} bw={12} />
          <div style={{ position: 'relative', fontSize: 13, fontWeight: 600, color: '#b3c3db' }}>Score</div>
          <div style={{
            position: 'relative',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36,
            color: '#ffffff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums',
          }}>{score.toLocaleString()}</div>
        </div>
        <div style={{
          position: 'relative',
          padding: '5px 16px', minWidth: 120,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <SliceSpan src="assets/ui/ui_ingame_score_box.png" slice={20} bw={12} />
          <div style={{ position: 'relative', fontSize: 13, fontWeight: 600, color: '#b3c3db' }}>Best</div>
          <div style={{
            position: 'relative',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36,
            color: '#3fcbff', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums',
          }}>{highScore.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
});

// ── Booster Bar ────────────────────────────────────────────
function BoosterBtn({ src, icon, label, badge, cost, onClick, disabled, active, activeColor }) {
  const [pressed, setPressed] = useState(false);
  const color = activeColor || 'var(--brand-orange-400)';
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', padding: 0, opacity: disabled ? 0.4 : 1, position: 'relative', minWidth: 60 }}>
      <div style={{
        position: 'relative',
        width: 58, height: 58,
        boxShadow: active ? `0 0 18px ${color}99` : '0 3px 10px rgba(0,0,0,0.2)',
        transform: pressed ? 'scale(0.93) translateY(2px)' : 'scale(1)',
        transition: 'transform 80ms, box-shadow 80ms',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        outline: active ? `2.5px solid ${color}` : 'none',
        outlineOffset: 2, borderRadius: '50%',
      }}>
        <GameImg src="assets/ui/ui_ingame_item_box.png" width={58} height={58}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'block' }} />
        {icon
          ? <span style={{ position: 'relative', fontSize: 26, lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}>{icon}</span>
          : <GameImg src={src} width={30} height={30} style={{ position: 'relative', display: 'block', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}/>
        }
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#ffffff', letterSpacing: '0.02em', textAlign: 'center', lineHeight: 1 }}>
        {label}
      </div>
      {badge != null ? (
        <div style={{
          position: 'absolute', top: -3, right: 3, width: 24, height: 24,
          borderRadius: '50%',
          background: 'linear-gradient(180deg,#34C3FA,#00A6EE)',
          border: '2px solid #FFFFFF',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#FFFFFF',
        }}>{badge}</div>
      ) : cost != null ? (
        <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(180deg,#FFFFFF,#FDEFD0)', color: '#243244', padding: '2px 6px', borderRadius: 999, fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-display)', border: '1.5px solid rgba(58,30,14,0.15)', display: 'flex', alignItems: 'center', gap: 2, lineHeight: 1, whiteSpace: 'nowrap', boxShadow: '0 2px 0 rgba(58,30,14,0.2)' }}>
          <GameImg src="assets/icons/coin.png" width={11} height={11}/>{cost}
        </div>
      ) : null}
    </button>
  );
}

export const BoosterBar = memo(function BoosterBar({ onUndo, onWand, onRemove, canUndo, removeMode, wandMode, undoItems, removeItems, wandItems }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 24, padding: '2px 20px 10px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
      <BoosterBtn src="assets/atlas/icon_undo.png" label="Undo"
        badge={undoItems > 0 ? undoItems : null} cost={undoItems > 0 ? undefined : 80}
        onClick={onUndo} disabled={!canUndo} />
      <BoosterBtn src="assets/atlas/icon_magnet.png" label="Wand"
        badge={wandItems > 0 ? wandItems : null} cost={wandItems > 0 ? undefined : 220}
        active={wandMode} activeColor="#A040E0" onClick={onWand} />
      <BoosterBtn src="assets/atlas/icon_eraser.png" label="Clear"
        badge={removeItems > 0 ? removeItems : null} cost={removeItems > 0 ? undefined : 150}
        active={removeMode} onClick={onRemove} />
    </div>
  );
});

// ── Building Progress ──────────────────────────────────────
const TOTAL_LEVELS = 12;

export function BuildingProgress({ age, unlockedLevels }) {
  const currentLevel = useMemo(() => {
    let max = 0;
    for (const l of unlockedLevels) if (l > max) max = l;
    return max;
  }, [unlockedLevels]);

  // 4-tile window centered just before the next target
  const winStart = Math.max(1, Math.min(currentLevel - 1, TOTAL_LEVELS - 4));
  const windowLevels = Array.from({ length: 4 }, (_, i) => winStart + i).filter(l => l < TOTAL_LEVELS);

  const lastLevel = TOTAL_LEVELS;
  const lastUnlocked = unlockedLevels.has(lastLevel);
  const lastIsNext = !lastUnlocked && unlockedLevels.has(lastLevel - 1);
  const LAST_SIZE = 56;

  function buildingImg(level, size, unlocked, isNext, isCurrent) {
    return (
      <div style={{
        width: size, height: size, flexShrink: 0, borderRadius: 6, overflow: 'hidden',
        opacity: unlocked ? 1 : isNext ? 0.65 : 0.28,
        filter: unlocked ? 'none' : 'grayscale(0.6)',
        outline: isNext ? '2px solid rgba(248,128,24,0.95)' : isCurrent ? '1.5px solid rgba(248,128,24,0.45)' : 'none',
        outlineOffset: 2,
        boxShadow: isNext ? '0 0 10px rgba(248,128,24,0.7)' : 'none',
        transition: 'opacity 350ms, filter 350ms',
        background: 'transparent',
      }}>
        <img src={getBuildingPng(age, level)} width={size} height={size}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
          draggable={false} />
      </div>
    );
  }

  return (
    <div style={{
      width: 374, boxSizing: 'border-box', padding: '4px 10px 6px',
      display: 'flex', flexDirection: 'column', gap: 4,
      flexShrink: 0, zIndex: 10,
    }}>
      {/* progress dots — one per level */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => {
          const done = unlockedLevels.has(i + 1);
          return (
            <div key={i} style={{
              flex: 1, height: done ? 4 : 3, borderRadius: 99,
              background: done ? '#F88018' : 'rgba(255,255,255,0.1)',
              transition: 'background 350ms',
            }} />
          );
        })}
      </div>

      {/* main icons row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
        {/* 4-tile window */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, flex: 1 }}>
          {windowLevels.map(level => {
            const unlocked = unlockedLevels.has(level);
            const isNext = !unlocked && unlockedLevels.has(level - 1);
            const isCurrent = level === currentLevel;
            const size = isNext ? 52 : isCurrent ? 48 : 40;
            return <div key={level}>{buildingImg(level, size, unlocked, isNext, isCurrent)}</div>;
          })}
        </div>

        {/* divider */}
        <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.1)', flexShrink: 0, margin: '0 6px' }} />

        {/* pinned final */}
        {buildingImg(lastLevel, LAST_SIZE, lastUnlocked, lastIsNext, false)}
      </div>
    </div>
  );
}

// ── Bottom Bar ─────────────────────────────────────────────
function SysBtn({ icon, label, onClick, disabled, variant, badge, buttonRef, keepColor }) {
  const [pressed, setPressed] = useState(false);
  const isGreen = variant === 'green';
  return (
    <button ref={buttonRef} onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        background: 'transparent', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '4px 8px', opacity: disabled ? 0.4 : 1, position: 'relative',
      }}>
      <div style={{
        position: 'relative',
        width: 52, height: 52,
        boxShadow: pressed ? 'inset 0 2px 6px rgba(0,0,0,0.25)' : '0 3px 10px rgba(0,0,0,0.2)',
        transform: pressed ? 'scale(0.93) translateY(2px)' : 'scale(1)',
        transition: 'transform 80ms, box-shadow 80ms',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <SliceSpan src="assets/ui/ui_ingame_restart_box.png" slice={20} bw={12} />
        <GameImg src={icon} width={26} height={26} style={{ position: 'relative', display: 'block', filter: keepColor ? 'none' : 'brightness(0) invert(1) opacity(0.9)' }}/>
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 16, color: '#ffffff', letterSpacing: '0.01em', textAlign: 'center', lineHeight: 1 }}>
        {label}
      </div>
      {badge && (
        <div style={{ position: 'absolute', top: 0, right: 4, background: '#DD4444', border: '1.5px solid rgba(255,255,255,0.8)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: '#fff' }}>
          {badge}
        </div>
      )}
    </button>
  );
}

export const BottomBar = memo(function BottomBar({ onRestart, onAdReward, adButtonRef, reward = 70 }) {
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAd = useCallback(() => {
    if (cooldown > 0) return;
    onAdReward();
    setCooldown(30);
  }, [cooldown, onAdReward]);

  return (
    <div style={{
      padding: '6px 20px 14px', position: 'relative', zIndex: 10, flexShrink: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    }}>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <SysBtn icon="assets/atlas/icon_restart.png" label="Restart" onClick={onRestart} keepColor />
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
        <button ref={adButtonRef} onClick={handleAd} disabled={cooldown > 0}
          style={{
            position: 'relative', background: 'none', border: 'none', padding: 0,
            cursor: cooldown > 0 ? 'not-allowed' : 'pointer', opacity: cooldown > 0 ? 0.5 : 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          }}>
          <div style={{ position: 'relative', width: 62, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GameImg src="assets/ui/ui_ad_reward.png" width={62} height={62} style={{ display: 'block', objectFit: 'contain' }} />
            <div style={{ position: 'absolute', top: 2, right: 7, width: 13, height: 13, borderRadius: '50%', background: '#FF3B3B', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 13, color: '#ffffff', textAlign: 'center', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            {cooldown > 0 ? `${cooldown}s` : (
              <>+<GameImg src="assets/icons/coin.png" width={13} height={13} style={{ display: 'block' }} />{reward}</>
            )}
          </div>
        </button>
      </div>
    </div>
  );
});

// ── Billboard Ad Car ──────────────────────────────────────
export const BillboardCar = memo(function BillboardCar({ onEarned }) {
  const [cooldown, setCooldown] = useState(0); // 0 = car visible immediately

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  if (cooldown > 0) return null;

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 104,
      height: 90, pointerEvents: 'none', zIndex: 4, overflow: 'hidden',
    }}>
      <div
        onClick={() => { onEarned(); setCooldown(120); }}
        onAnimationEnd={() => setCooldown(120)}
        style={{
          position: 'absolute', bottom: 0,
          animation: 'carDrive 50s linear forwards',
          cursor: 'pointer', pointerEvents: 'auto',
          userSelect: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}
      >
        {/* Billboard sign */}
        <div style={{
          background: 'linear-gradient(180deg,#FFE566,#F5B728)',
          border: '2px solid #C07800',
          borderRadius: 7, padding: '4px 10px',
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.38)',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12,
          color: '#5A2A05', whiteSpace: 'nowrap',
        }}>
          <img src="assets/atlas/icon_ad.png" width={15} height={15} style={{ display: 'block' }} />
          FREE +70
          <img src="assets/icons/coin.png" width={14} height={14} style={{ display: 'block' }} />
        </div>
        {/* Pole */}
        <div style={{ width: 2, height: 8, background: '#888' }} />
        {/* Emoji truck — scaleX(-1) to face left (direction of travel) */}
        <div style={{ fontSize: 46, lineHeight: 1, transform: 'scaleX(-1)' }}>🚛</div>
      </div>
    </div>
  );
});

export function ItemButton({ icon, label, sub, cost, onClick, disabled, active, activeColor, variant, adge, big, buttonRef }) {
  const [pressed, setPressed] = useState(false);
  const bg = variant === 'orange'
    ? 'linear-gradient(180deg, #FFA33A, #F88018)'
    : variant === 'green'
      ? 'linear-gradient(180deg, #9DD478, #7DB85A)'
      : 'linear-gradient(180deg, #FBF3DE, #ECDCC0)';
  const borderColor = variant === 'orange' ? 'rgba(58,30,14,0.4)' : 'rgba(58,30,14,0.22)';
  const labelColor = variant === 'orange' ? '#793010' : variant === 'green' ? '#23564d' : '#adbdd5';
  const iconSize = big ? 34 : 22;
  const isPrimary = variant === 'orange';
  return (
    <button ref={buttonRef} onClick={onClick} disabled={disabled}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{
        flex: big ? 1.35 : 1, minWidth: 0,
        background: bg, borderRadius: big ? 16 : 12,
        border: `${big ? 2.5 : 1.5}px solid ${borderColor}`,
        padding: big ? '6px 4px 7px' : '4px 2px 5px',
        marginBottom: big ? -6 : 0,
        opacity: disabled ? 0.45 : (isPrimary ? 1 : 0.92),
        boxShadow: pressed
          ? '0 1px 0 rgba(58,30,14,0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
          : `0 ${big ? 5 : 3}px 0 rgba(58,30,14,${isPrimary ? 0.4 : 0.22}), inset 0 1px 0 rgba(255,255,255,0.5)${active ? `, 0 0 18px ${activeColor || 'rgba(248,128,24,0.7)'}` : ''}${big ? ', 0 0 24px rgba(248,128,24,0.5)' : ''}`,
        transform: pressed ? 'translateY(3px)' : 'none',
        transition: 'transform 80ms, box-shadow 80ms, opacity 120ms',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        outline: active ? `2.5px solid ${activeColor || '#F88018'}` : 'none', outlineOffset: 1,
      }}>
      <div style={{ width: iconSize, height: iconSize, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: big ? 2 : 0 }}>
        <GameImg src={icon} width={iconSize} height={iconSize} style={{ display: 'block', filter: variant === 'orange' ? 'drop-shadow(0 1px 0 rgba(0,0,0,0.25))' : variant ? 'none' : 'saturate(0.8)' }}/>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: isPrimary ? 800 : 600, fontSize: big ? 11 : 9, color: labelColor, lineHeight: 1.05, textAlign: 'center', textShadow: variant === 'orange' ? '0 1px 0 rgba(58,30,14,0.4)' : 'none' }}>{label}</div>
      <div style={{ fontSize: big ? 7.5 : 6.5, fontWeight: 700, letterSpacing: '0.06em', color: labelColor, opacity: isPrimary ? 0.85 : 0.55, textAlign: 'center' }}>{sub}</div>
      {cost !== undefined && (
        <div style={{ position: 'absolute', top: -7, right: -2, background: '#FFF8EC', color: '#5A2A05', padding: '1px 4px', borderRadius: 999, fontSize: 8.5, fontWeight: 800, fontFamily: 'var(--font-display)', border: '1.5px solid rgba(58,30,14,0.3)', boxShadow: '0 2px 0 rgba(58,30,14,0.22)', display: 'flex', alignItems: 'center', gap: 2, lineHeight: 1, whiteSpace: 'nowrap' }}>
          <GameImg src="assets/icons/coin.png" width={10} height={10} />
          {cost}
        </div>
      )}
      {adge && (
        <div style={{ position: 'absolute', top: -7, right: -2, background: '#FFF8EC', color: '#5A2A05', padding: '1px 5px', borderRadius: 999, fontSize: 8.5, fontWeight: 800, fontFamily: 'var(--font-display)', border: '1.5px solid rgba(58,30,14,0.3)', boxShadow: '0 2px 0 rgba(58,30,14,0.22)', whiteSpace: 'nowrap' }}>{adge}</div>
      )}
    </button>
  );
}

function DPad({ onMove }) {
  const ArrowBtn = ({ dir, src }) => (
    <button onClick={() => onMove(dir)} style={{ width: 38, height: 38, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))' }}>
      <GameImg src={src} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}/>
    </button>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 38px)', gridTemplateRows: 'repeat(3, 38px)', gap: 2 }}>
      <div /><ArrowBtn dir="up" src="assets/atlas/arrow_up.png" /><div />
      <ArrowBtn dir="left" src="assets/atlas/arrow_left.png" />
      <div />
      <ArrowBtn dir="right" src="assets/atlas/arrow_right.png" />
      <div /><ArrowBtn dir="down" src="assets/atlas/arrow_down.png" /><div />
    </div>
  );
}

export function FloatingDPad({ onMove }) {
  return (
    <div style={{ position: 'absolute', right: 14, bottom: 96, zIndex: 30 }}>
      <DPad onMove={onMove} />
    </div>
  );
}

// ── Popups ─────────────────────────────────────────────────
function Overlay({ children }) {
  return (
    <div className="popup-overlay" style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(31, 43, 82, 0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 200ms' }}>{children}</div>
  );
}

function PopupCloseBtn({ onClick, style }) {
  return (
    <button onClick={onClick} aria-label="Close"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', ...style }}>
      <img src="assets/ui/ui_btn_pop_close.png" width={36} height={36} style={{ display: 'block' }} />
    </button>
  );
}

function PopupShell({ children, title, ribbon = false }) {
  return (
    <div style={{ width: 290, background: 'var(--paper-50)', borderRadius: 28, padding: '24px 22px 18px', boxShadow: '0 14px 40px rgba(58,30,14,0.4), inset 0 -3px 0 rgba(58,30,14,0.08)', border: '3px solid rgba(58,30,14,0.18)', position: 'relative', animation: 'popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
      <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', background: ribbon ? 'linear-gradient(180deg, #FFA33A, #F88018)' : 'linear-gradient(180deg, #1E7ED6, #135CA8)', color: '#FFF8EC', padding: '9px 24px', borderRadius: 999, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, whiteSpace: 'nowrap', boxShadow: '0 4px 0 rgba(58,30,14,0.4), inset 0 1px 0 rgba(255,255,255,0.4)', border: '2px solid rgba(58,30,14,0.3)', textShadow: '0 1px 0 rgba(58,30,14,0.5)', textAlign: 'center', lineHeight: 1.05 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

const BIG_BTN_SRC = {
  green:  'assets/ui/ui_btn_main_green.png',
  blue:   'assets/ui/ui_btn_main_blue.png',
  orange: 'assets/ui/ui_btn_main_orange.png',
  red:    'assets/ui/ui_btn_main_red.png',
  cream:  'assets/ui/ui_btn_main_basic.png',
};
// Source PNG 286×117 — corner slice 55px → renders at 26px for 54px display height
const BTN_SLICE = 55;
const BTN_BW = 26;

export function BigButton({ children, variant = 'orange', onClick }) {
  const [pressed, setPressed] = useState(false);
  const src = BIG_BTN_SRC[variant] ?? BIG_BTN_SRC.orange;
  const labelColor = variant === 'orange' ? '#793010' : variant === 'green' ? '#23564d' : variant === 'blue' ? '#145184' : variant === 'red' ? '#792110' : '#adbdd5';
  return (
    <button onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{
        position: 'relative',
        background: 'none', border: 'none',
        color: labelColor, padding: '0 16px',
        height: 54, minHeight: 54, width: '100%',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
        transform: pressed ? 'scale(0.97) translateY(2px)' : 'none',
        transition: 'transform 80ms', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
      <span aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        borderStyle: 'solid', borderWidth: 1,
        borderImage: `url('${src}') ${BTN_SLICE} fill / ${BTN_BW}px stretch`,
      }} />
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        {children}
      </span>
    </button>
  );
}

function RestartGlyphLight() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32">
      <path d="M16 6 A10 10 0 1 1 6 16" fill="none" stroke="#FFF8EC" strokeWidth="3.5" strokeLinecap="round" />
      <polygon points="14,2 18,6 14,10" fill="#FFF8EC" />
    </svg>
  );
}

export function GameOverPopup({ score, highScore, onRestart, onContinue, onContinueAd }) {
  return (
    <Overlay>
      <div style={{
        width: 320, borderRadius: 20,
        background: 'linear-gradient(180deg, #253f5a 0%, #152840 100%)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        padding: '64px 16px 20px', overflow: 'visible',
        position: 'relative', animation: 'popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <PopupArchIcon title="No more Moves"><span style={{ fontSize: 52, lineHeight: 1 }}>😢</span></PopupArchIcon>
        <PopupCloseBtn onClick={onRestart} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }} />
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#ffffff' }}>The board is full</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#f7b55f' }}>Continue or restart?</div>
        </div>

        {/* Score boxes */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, width: '100%' }}>
          {[{ label: 'Score', value: score, color: '#ffffff' }, { label: 'Best', value: highScore, color: '#3fcbff' }].map(({ label, value, color }) => (
            <div key={label} style={{
              position: 'relative', flex: 1,
              padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <SliceSpan src="assets/ui/ui_pop_score_box.png" slice={20} bw={8} />
              <div style={{ position: 'relative', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: '#b3c3db' }}>{label}</div>
              <div style={{ position: 'relative', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color, fontVariantNumeric: 'tabular-nums' }}>{value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <div style={{ position: 'relative' }}>
            <BigButton variant="blue" onClick={onContinue}><span>Continue</span></BigButton>
            <div style={{ position: 'absolute', top: -10, right: 6, background: '#FFF8EC', borderRadius: 999, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
              <GameImg src="assets/icons/coin.png" width={14} height={14} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#5A2A05' }}>200</span>
            </div>
          </div>
          <BigButton variant="orange" onClick={onContinueAd}>
            <GameImg src="assets/atlas/icon_ad.png" width={24} height={24} />
            <span>Watch ad Continue</span>
          </BigButton>
          <BigButton variant="green" onClick={onRestart}>
            <GameImg src="assets/atlas/icon_restart.png" width={24} height={24} />
            <span>Restart</span>
          </BigButton>
        </div>
      </div>
    </Overlay>
  );
}

export function BuildingRewardPopup({ level, age, onClaim }) {
  const ageData = AGES[age] || AGES.classic;
  const name = ageData.names[level - 1];
  const reward = level * 25;
  return (
    <Overlay>
      <PopupShell title="New Building!" ribbon>
        <div style={{ textAlign: 'center', padding: '8px 0 6px' }}>
          <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto 6px' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(255,225,138,0.9) 0%, rgba(248,128,24,0) 70%)', animation: 'rewardGlow 2s ease-in-out infinite' }}/>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ position: 'absolute', inset: 0, animation: 'spinSlow 8s linear infinite' }}>
              {Array.from({ length: 12 }).map((_, i) => {
                const a = (i * 30) * Math.PI / 180;
                return <line key={i} x1={65 + Math.cos(a) * 35} y1={65 + Math.sin(a) * 35} x2={65 + Math.cos(a) * 60} y2={65 + Math.sin(a) * 60} stroke="#F5B728" strokeWidth="3" strokeLinecap="round" opacity="0.6" />;
              })}
            </svg>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 90, height: 90 }}>
              <BuildingTile level={level} age={age} style="png" size={90} />
            </div>
          </div>
          <div style={{ display: 'inline-block', background: 'rgba(58,30,14,0.1)', borderRadius: 999, padding: '3px 12px', fontSize: 15, fontWeight: 700, color: 'var(--ink-700)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Level {level} · {ageData.name}</div>
          <h2 style={{ margin: '4px 0 10px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: 'var(--ink-900)' }}>{name}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <BigButton variant="green" onClick={() => onClaim(reward * 2)}>
              <GameImg src="assets/atlas/icon_ad.png" width={24} height={24} />
              <GameImg src="assets/icons/coin.png" width={20} height={20} />
              <span>Watch Ad · +{reward * 2}</span>
            </BigButton>
            <BigButton variant="orange" onClick={() => onClaim(reward)}>
              <GameImg src="assets/icons/coin.png" width={24} height={24} />
              <span>CLAIM +{reward}</span>
            </BigButton>
          </div>
        </div>
      </PopupShell>
    </Overlay>
  );
}

export function BuildingToast({ level, age, onCoinLaunch }) {
  const ageData = AGES[age] || AGES.classic;
  const name = ageData.names?.[level - 1] || `Level ${level}`;
  const reward = level * 25;
  const coinBadgeRef = useRef(null);
  const onCoinLaunchRef = useRef(onCoinLaunch);

  useEffect(() => {
    const t = setTimeout(() => {
      if (coinBadgeRef.current && onCoinLaunchRef.current) onCoinLaunchRef.current(coinBadgeRef.current);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'absolute', top: 198, left: 0, right: 0,
      display: 'flex', justifyContent: 'center',
      zIndex: 'var(--z-toast)', pointerEvents: 'none',
      animation: 'slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'linear-gradient(135deg, #FFF8EC, #FDEFD0)',
        border: '2px solid rgba(58,30,14,0.28)',
        borderRadius: 'var(--r-xl)',
        boxShadow: '0 4px 0 rgba(58,30,14,0.3), 0 8px 24px rgba(58,30,14,0.18)',
        padding: '8px 16px 8px 8px',
        minWidth: 200,
      }}>
        <div style={{ width: 52, height: 52, flexShrink: 0 }}>
          <BuildingTile level={level} age={age} style="png" size={52} badgeScale={0.8} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--ink-900)', lineHeight: 1.1 }}>
            🏛 {name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-500)', fontWeight: 600, marginTop: 1 }}>
            New building unlocked!
          </div>
        </div>
        <div ref={coinBadgeRef} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'linear-gradient(180deg,#FFD86A,#F5B728)', borderRadius: 'var(--r-pill)', padding: '4px 10px', boxShadow: '0 2px 0 rgba(58,30,14,0.25)' }}>
          <GameImg src="assets/icons/coin.png" width={14} height={14} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#5A2A05' }}>+{reward}</span>
        </div>
      </div>
    </div>
  );
}

export function RestartConfirmPopup({ onCancel, onConfirm }) {
  return (
    <Overlay>
      <div style={{
        width: 300, background: '#1A2845', borderRadius: 20,
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        padding: '20px 18px 20px',
        position: 'relative', animation: 'popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <PopupCloseBtn onClick={onCancel} style={{ position: 'absolute', top: 12, right: 12 }} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#ffffff', marginBottom: 12 }}>Restart</div>
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 14 }} />
        <div style={{ width: '100%', background: '#0d1828', borderRadius: 14, padding: '16px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#f7b55f', marginBottom: 8, lineHeight: 1.3 }}>
            Start over from the beginning
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            Current Board Will be Lost.<br/>Best Score &amp; Coins Kept
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <BigButton variant="cream" onClick={onCancel}><span>Cancel</span></BigButton>
          <BigButton variant="blue" onClick={onConfirm}><span>Restart</span></BigButton>
        </div>
      </div>
    </Overlay>
  );
}

export function WarnPopup({ title, message, sub, onCancel, onConfirm, confirmLabel = 'OK', cancelLabel = 'CANCEL' }) {
  return (
    <Overlay>
      <div style={{
        width: 300, background: '#1A2845', borderRadius: 20,
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        padding: '20px 18px 20px',
        position: 'relative', animation: 'popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <PopupCloseBtn onClick={onCancel ?? onConfirm} style={{ position: 'absolute', top: 12, right: 12 }} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#ff6f60', marginBottom: 14 }}>{title}</div>
        <div style={{ width: '100%', background: '#0d1828', borderRadius: 14, padding: '16px', marginBottom: 16, textAlign: 'center' }}>
          {message && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#f7b55f', lineHeight: 1.4, marginBottom: sub ? 8 : 0 }}>{message}</div>}
          {sub && <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{sub}</div>}
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {onCancel && <BigButton variant="cream" onClick={onCancel}><span>{cancelLabel}</span></BigButton>}
          <BigButton variant="red" onClick={onConfirm}><span>{confirmLabel}</span></BigButton>
        </div>
      </div>
    </Overlay>
  );
}

export function ShopPopup({ coins, undoItems, removeItems, wandItems, onClose, onPurchase }) {
  const [tab, setTab] = useState('items');

  const itemProducts = [
    { id: 'undo5',   icon: 'assets/atlas/icon_undo.png',   label: 'Undo x5',       sub: 'Bundle 20% OFF',   price: 320, badge: undoItems  > 0 ? `Have ${undoItems}`  : null },
    { id: 'wand3',   icon: 'assets/atlas/icon_magnet.png', label: 'Wonder Wand x3', sub: 'Bundle 13% OFF',   price: 390, badge: wandItems  > 0 ? `Have ${wandItems}`  : null },
    { id: 'remove3', icon: 'assets/atlas/icon_eraser.png', label: 'Cleaner x3',     sub: 'Bundle 15% OFF',   price: 255, badge: removeItems > 0 ? `Have ${removeItems}` : null },
    { id: 'freeAd',  icon: 'assets/atlas/icon_ad.png',     label: 'Watch Ad',       sub: 'Free 70 Coins',    price: 'AD', free: true },
    { id: 'noads',   icon: 'assets/icons/item_remove.png', label: 'Remove Ads',     sub: 'No Ads + 300 Coins', price: '$1.99', iap: true },
  ];

  const goldProducts = [
    { id: 'coins1000', icon: 'assets/icons/coin.png', label: '1,000 Coins', sub: '',           price: '$1.99', iap: true, badge: 'POPULAR' },
    { id: 'coins3000', icon: 'assets/icons/coin.png', label: '3,000 Coins', sub: '',           price: '$1.99', iap: true },
    { id: 'coins7500', icon: 'assets/icons/coin.png', label: '7,500 Coins', sub: '',           price: '$1.99', iap: true, badge: 'BEST VALUE' },
  ];

  const products = tab === 'items' ? itemProducts : goldProducts;

  return (
    <Overlay>
      <div style={{
        width: 310, borderRadius: 20,
        background: 'linear-gradient(180deg, #253f5a 0%, #152840 100%)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        padding: '62px 14px 18px', overflow: 'visible',
        position: 'relative', animation: 'popIn 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        maxHeight: '82vh', display: 'flex', flexDirection: 'column',
      }}>
        <PopupArchIcon title="Shop"><img src="assets/icons/item_shop.png" width={58} height={49} style={{ display: 'block' }} /></PopupArchIcon>
        <PopupCloseBtn onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }} />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[['items', 'Item'], ['gold', 'Gold']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '13px 0', border: 'none',
              backgroundImage: `url('assets/ui/ui_btn_shop_tab_${tab === key ? 'on' : 'off'}.png')`,
              backgroundSize: '100% 100%',
              borderRadius: 20, overflow: 'hidden',
              color: tab === key ? '#ffffff' : 'rgba(255,255,255,0.5)',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
              cursor: 'pointer',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Product list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', minHeight: 380 }}>
          {products.map(it => (
            <ShopRow key={it.id} item={it}
              canAfford={typeof it.price === 'number' ? coins >= it.price : true}
              onBuy={(el) => onPurchase(it.id, el)}
              onGetGold={tab === 'items' ? () => setTab('gold') : null} />
          ))}
        </div>
      </div>
    </Overlay>
  );
}

function ShopRow({ item, canAfford, onBuy, onGetGold }) {
  const [pressed, setPressed] = useState(false);
  const cantAfford = typeof item.price === 'number' && !canAfford;
  const handleClick = cantAfford && onGetGold ? onGetGold : (el) => onBuy(el);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', opacity: cantAfford ? 0.6 : 1 }}>
      <SliceSpan src="assets/ui/ui_shop_item_list_box.png" slice={18} bw={9} />
      <div style={{ position: 'relative', width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {item.icon.startsWith('assets')
          ? <GameImg src={item.icon} width={28} height={28} style={{ display: 'block' }}/>
          : <span style={{ fontSize: 24, lineHeight: 1 }}>{item.icon}</span>
        }
      </div>
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#ffffff', lineHeight: 1.1 }}>
          {item.label}
          {item.badge && <span style={{ fontSize: 10, fontWeight: 800, background: item.badge === 'BEST VALUE' ? '#3fcbff' : '#FF6EB4', color: '#FFF', padding: '1px 5px', borderRadius: 999 }}>{item.badge}</span>}
        </div>
        {item.sub && <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{item.sub}</div>}
      </div>
      <button onClick={(e) => handleClick(e.currentTarget)} onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
        style={{
          position: 'relative',
          background: item.iap ? 'linear-gradient(180deg, #FFA33A, #F88018)' : item.price === 'AD' ? 'linear-gradient(180deg, #40D0F8, #18A8D8)' : 'linear-gradient(180deg, #4FC178, #2E9E5A)',
          color: item.iap ? '#793010' : item.price === 'AD' ? '#145184' : '#23564d', border: 'none', borderRadius: 9, padding: '7px 10px',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
          boxShadow: pressed ? 'none' : '0 3px 0 rgba(0,0,0,0.3)',
          transform: pressed ? 'translateY(2px)' : 'none', transition: 'transform 80ms',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
        }}>
        {typeof item.price === 'number'
          ? <><GameImg src="assets/icons/coin.png" width={12} height={12}/><span>{item.price}</span></>
          : item.price === 'AD' ? <span>Claim</span>
          : <span>{item.price}</span>
        }
      </button>
    </div>
  );
}

export function SettingsPopup({ onClose, soundOn, onToggleSound, musicOn, onToggleMusic, onRestart }) {
  return (
    <Overlay>
      <div style={{
        width: 320, borderRadius: 20,
        background: 'linear-gradient(180deg, #253f5a 0%, #152840 100%)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        padding: '64px 16px 22px', overflow: 'visible',
        position: 'relative', animation: 'popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <PopupArchIcon title="Settings"><img src="assets/icons/setting.png" width={50} height={54} style={{ display: 'block' }} /></PopupArchIcon>
        <PopupCloseBtn onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }} />
        <div style={{ width: '80%', background: '#0d1828', borderRadius: 14, padding: '4px 16px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#ffffff' }}>
              <img src="assets/atlas/music_btn.png" width={28} height={28} style={{ display: 'block', opacity: 0.7 }} /><span>Music</span>
            </div>
            <ToggleSwitch on={musicOn} onClick={onToggleMusic} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#ffffff' }}>
              <img src="assets/icons/sound.png" width={28} height={28} style={{ display: 'block', opacity: 0.7 }} /><span>Sound</span>
            </div>
            <ToggleSwitch on={soundOn} onClick={onToggleSound} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <BigButton variant="green" onClick={onClose}><span>Resume</span></BigButton>
          <BigButton variant="blue" onClick={onRestart}>
            <GameImg src="assets/atlas/icon_restart.png" width={24} height={24} />
            <span>Restart Game</span>
          </BigButton>
        </div>
      </div>
    </Overlay>
  );
}

function SettingsRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: '#5A2A05' }}>
      <span>{label}</span>{children}
    </div>
  );
}

function SettingsLink({ children, onClick }) {
  return (
    <button onClick={onClick} style={{ textAlign: 'left', padding: '8px 4px', background: 'transparent', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, color: '#8A3500', cursor: 'pointer', borderBottom: '1px dashed rgba(58,30,14,0.15)' }}>{children} ›</button>
  );
}

function ToggleSwitch({ on, onClick }) {
  return (
    <button onClick={onClick} aria-label={on ? 'On' : 'Off'} style={{
      width: 60, height: 30, padding: 0, border: 'none', cursor: 'pointer',
      backgroundImage: `url('assets/ui/ui_btn_setting_${on ? 'on' : 'off'}.png')`,
      backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
      backgroundColor: 'transparent', flexShrink: 0,
    }} />
  );
}

export function PausedOverlay({ onResume, onSettings }) {
  const pauseBtnStyle = { padding: '10px 16px', borderRadius: 14, background: 'rgba(255,248,236,0.18)', border: '2px solid rgba(255,248,236,0.3)', color: '#FFF8EC', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 0 rgba(58,30,14,0.4)' };
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(31,43,82,0.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, animation: 'fadeIn 200ms ease-out' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 54, fontWeight: 800, color: '#f7b55f', textShadow: '0 3px 0 rgba(58,30,14,0.6)', letterSpacing: '0.1em' }}>PAUSED</div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'rgba(255,248,236,0.85)', marginTop: -8 }}>Tap to resume</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button onClick={onSettings} style={{...pauseBtnStyle, fontSize: 18}}>Settings</button>
        <button onClick={onResume} style={{...pauseBtnStyle, fontSize: 18, background: 'linear-gradient(180deg, #F5B728, #F88018)', color: '#5A2A05', minWidth: 120}}>RESUME</button>
      </div>
    </div>
  );
}


// ── Daily Reward Popup ────────────────────────────────────
const DAILY_REWARDS = [
  { type: 'coins',  amount: 100, icon: 'assets/icons/coin.png',        label: '100',     special: false },
  { type: 'wand',   amount: 1,   icon: 'assets/atlas/icon_magnet.png',  label: 'Magic Wand ×1', special: true  },
  { type: 'coins',  amount: 150, icon: 'assets/icons/coin.png',        label: '150',     special: false },
  { type: 'undo',   amount: 2,   icon: 'assets/atlas/icon_undo.png',   label: 'Undo ×2', special: false },
  { type: 'remove', amount: 1,   icon: 'assets/atlas/icon_eraser.png', label: 'Cleaner', special: false },
  { type: 'coins',  amount: 250, icon: 'assets/icons/coin.png',        label: '250',     special: false },
  { type: 'coins',  amount: 500, icon: 'assets/icons/coin.png',        label: '500',     special: true  },
];

function DayCard({ reward, day, active, done }) {
  const isLast = day === 7;
  const cardH = 90;
  const iconSize = isLast ? 36 : 24;
  const bgSrc = isLast
    ? 'assets/ui/ui_daily_reward_box_day07.png'
    : active ? 'assets/ui/ui_daily_reward_box_today.png'
    : 'assets/ui/ui_daily_reward_box_day.png';
  const stripH = 20;
  const dayColor = active ? '#793010' : done ? '#b3c3db' : 'rgba(255,255,255,0.6)';
  const amtColor = active ? '#793010' : '#ffffff';

  return (
    <div style={{
      position: 'relative',
      flex: isLast ? undefined : 1,
      width: isLast ? '100%' : undefined,
      height: cardH, flexShrink: 0,
    }}>
      <SliceSpan src={bgSrc} slice={20} bw={isLast ? 10 : 8} />

      {/* Header strip: "Day X" with check badge when done */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: stripH,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
        color: dayColor, letterSpacing: '0.02em',
      }}>
        {done && <img src="assets/ui/ui_daily_reward_box_check.png" width={12} height={12} style={{ display: 'block' }} />}
        Day {day}
      </div>

      {/* Body: icon + amount always visible */}
      <div style={{
        position: 'absolute', top: stripH, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2,
        opacity: done ? 0.6 : 1,
      }}>
        {reward.icon.startsWith('assets')
          ? <GameImg src={reward.icon} width={iconSize} height={iconSize} style={{ opacity: active ? 1 : 0.8 }} />
          : <span style={{ fontSize: iconSize, lineHeight: 1, opacity: active ? 1 : 0.8 }}>{reward.icon}</span>
        }
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: isLast ? 15 : 12,
          color: amtColor, lineHeight: 1, textAlign: 'center', padding: '0 2px',
        }}>
          {reward.type === 'coins' ? `+${reward.label}` : reward.label}
        </div>
      </div>
    </div>
  );
}

export function DailyRewardPopup({ streak, onClaim, onClose }) {
  const dayIdx = Math.min(streak - 1, DAILY_REWARDS.length - 1);
  const todayReward = DAILY_REWARDS[dayIdx];
  const rows = [DAILY_REWARDS.slice(0, 3), DAILY_REWARDS.slice(3, 6), DAILY_REWARDS.slice(6)];

  return (
    <Overlay>
      <div style={{
        width: 310, borderRadius: 20,
        background: 'linear-gradient(180deg, #253f5a 0%, #152840 100%)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        padding: '80px 14px 18px',
        position: 'relative', animation: 'popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        overflow: 'visible',
      }}>
        {/* Top arch decoration */}
        <img src="assets/ui/ui_pop_top.png" aria-hidden="true"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'auto', borderRadius: '20px 20px 0 0', pointerEvents: 'none' }} />

        {/* Calendar icon + title — centered, sits above the arch */}
        <div style={{ position: 'absolute', top: -38, left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
          <img src="assets/ui/ui_icon_daily_reward.png" width={72} height={76} style={{ display: 'block' }} />
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#3fcbff', textAlign: 'center' }}>Daily Bonus</div>
        </div>

        {/* X close button */}
        {onClose && <PopupCloseBtn onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }} />}

        <div style={{ width: '100%', marginBottom: 12 }}>
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} style={{
              display: 'flex', gap: 6, marginBottom: rowIdx < 2 ? 6 : 0,
            }}>
              {row.map((r, i) => {
                const day = rowIdx * 3 + i + 1;
                return <DayCard key={day} reward={r} day={day} active={day === streak} done={day < streak} />;
              })}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
          <BigButton variant="orange" onClick={() => onClaim({ ...todayReward, amount: todayReward.amount * 2 })}>
            <GameImg src="assets/atlas/icon_ad.png" width={24} height={24} />
            <span>Watch Ad x2</span>
          </BigButton>
          <BigButton variant="blue" onClick={() => onClaim(todayReward)}>
            <span>Claim Reward</span>
          </BigButton>
        </div>
      </div>
    </Overlay>
  );
}

// ── City Select Modal ──────────────────────────────────────
// unlockCondition: { ageId, minLevel } — reach minLevel in ageId to unlock next city
const CITY_ORDER = [
  { id: 'stone',      tagline: '구석기 부족 마을',      taglineEn: 'Prehistoric Tribal Village',       unlockCondition: null },
  { id: 'egypt',      tagline: '파라오의 사막 왕국',    taglineEn: "Pharaoh's Desert Kingdom",          unlockCondition: { ageId: 'stone',      minLevel:  9 } },
  { id: 'medieval',   tagline: '기사와 성벽의 시대',    taglineEn: 'Knights & Castle Walls',            unlockCondition: { ageId: 'egypt',      minLevel: 10 } },
  { id: 'industrial', tagline: '증기와 강철의 혁명',    taglineEn: 'Steam & Steel Revolution',          unlockCondition: { ageId: 'medieval',   minLevel: 11 } },
  { id: 'china',      tagline: '황제의 동양 왕국',      taglineEn: "Emperor's Eastern Kingdom",         unlockCondition: { ageId: 'industrial', minLevel: 11 } },
  { id: 'classic',    tagline: '현대의 마천루 도시',    taglineEn: 'Modern Skyscraper City',            unlockCondition: { ageId: 'china',      minLevel: 12 } },
  { id: 'global',     tagline: '세계를 잇는 미래 도시', taglineEn: 'Future City Connecting the World',  unlockCondition: { ageId: 'classic',    minLevel: 12 } },
  { id: 'space',      tagline: '우주 식민지 미래도시',  taglineEn: 'Space Colony Future City',          unlockCondition: { ageId: 'global',     minLevel: 12 } },
  { id: 'coming_soon', comingSoon: true, tagline: '다음 도시 준비 중...', taglineEn: 'Next city coming soon...' },
];

function CityThumb({ ageData, size = 52 }) {
  const cols = [2, 5, 8, 11].map(i => ageData.tilePalette[i][1]);
  const bldgs = [{ x: 3, w: 7, h: 20 }, { x: 11, w: 9, h: 32 }, { x: 21, w: 6, h: 24 }, { x: 28, w: 10, h: 38 }, { x: 39, w: 6, h: 18 }];
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.19), overflow: 'hidden', flexShrink: 0,
      background: ageData.boardBg, border: '1.5px solid rgba(58,30,14,0.18)',
    }}>
      <svg width={size} height={size} viewBox="0 0 48 48">
        {bldgs.map((b, i) => (
          <rect key={i} x={b.x} y={48 - b.h} width={b.w} height={b.h}
            fill={cols[Math.min(i, cols.length - 1)]} rx="1" opacity={0.85} />
        ))}
      </svg>
    </div>
  );
}

function LockIcon({ dark }) {
  const fill = dark ? 'rgba(58,30,14,0.18)' : 'rgba(255,255,255,0.25)';
  const stroke = dark ? 'rgba(58,30,14,0.45)' : 'rgba(255,255,255,0.4)';
  const dot = dark ? 'rgba(58,30,14,0.5)' : 'rgba(255,255,255,0.5)';
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" fill="none">
      <rect x="2" y="8" width="14" height="11" rx="3" fill={fill} stroke={stroke} strokeWidth="1.5"/>
      <path d="M5 8V6a4 4 0 0 1 8 0v2" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="9" cy="14" r="2" fill={dot}/>
    </svg>
  );
}

function CityCardItem({ index, city, ageData, isUnlocked, isCurrent, onSelect, onLockedTap, unlockHint }) {
  const [pressed, setPressed] = useState(false);
  const listBgSrc = isCurrent
    ? 'assets/ui/ui_world_map_list_box_now.png'
    : 'assets/ui/ui_world_map_list_box.png';

  if (city.comingSoon) {
    return (
      <div style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 12, opacity: 0.5,
      }}>
        <SliceSpan src="assets/ui/ui_world_map_list_box.png" slice={18} bw={9} />
        <div style={{ position: 'relative', width: 20, flexShrink: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{index}</div>
        <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 20 }}>🔮</span>
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.1 }}>???</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{city.taglineEn}</div>
        </div>
        <div style={{ position: 'relative', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9, letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.4, flexShrink: 0 }}>COMING<br/>SOON</div>
      </div>
    );
  }

  return (
    <div
      onClick={() => { if (!isUnlocked && unlockHint) onLockedTap(unlockHint); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 12,
        opacity: isUnlocked ? 1 : 0.75,
        transform: pressed ? 'scale(0.98)' : 'none',
        transition: 'transform 80ms',
      }}
    >
      <SliceSpan src={listBgSrc} slice={18} bw={9} />
      <div style={{ position: 'relative', width: 20, flexShrink: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>{index}</div>

      <img src={`assets/icons/theme-${city.id}.png`} width={42} height={42}
        style={{ position: 'relative', borderRadius: 10, flexShrink: 0, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.15)' }} />

      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#ffffff', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ageData.name}
        </div>
        <div style={{ fontSize: 11, color: '#b3c3db', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {city.taglineEn}
        </div>
      </div>

      <div style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {isCurrent ? (
          <div style={{
            position: 'relative',
            color: '#23564d', padding: '6px 14px',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, letterSpacing: '0.04em',
          }}>
            <SliceSpan src="assets/ui/ui_btn_mini_green.png" slice={20} bw={8} />
            <span style={{ position: 'relative' }}>PLAYING</span>
          </div>
        ) : isUnlocked ? (
          <button
            onMouseDown={(e) => { e.stopPropagation(); setPressed(true); }}
            onMouseUp={(e) => { e.stopPropagation(); setPressed(false); }}
            onMouseLeave={() => setPressed(false)}
            onTouchStart={(e) => { e.stopPropagation(); setPressed(true); }}
            onTouchEnd={(e) => { e.stopPropagation(); setPressed(false); onSelect(); }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            style={{
              position: 'relative',
              background: 'none', color: '#793010', border: 'none', padding: '6px 14px',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11,
              cursor: 'pointer', letterSpacing: '0.04em',
              transform: pressed ? 'scale(0.96)' : 'none', transition: 'transform 80ms',
            }}>
            <SliceSpan src="assets/ui/ui_btn_mini_orange.png" slice={20} bw={8} />
            <span style={{ position: 'relative' }}>SELECT</span>
          </button>
        ) : (
          <div style={{
            backgroundImage: "url('assets/ui/ui_world_maop_lock.png')",
            backgroundSize: '100% 100%',
            width: 66, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center',
            paddingLeft: 30, boxSizing: 'border-box',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, color: '#ffffff' }}>Lock</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CityCompletePopup({ currentAgeData, nextAgeData, onContinue, onClose }) {
  return (
    <Overlay>
      <div style={{
        width: 300, borderRadius: 20,
        background: 'linear-gradient(180deg, #253f5a 0%, #152840 100%)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        padding: '62px 14px 20px', overflow: 'visible',
        position: 'relative', animation: 'popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <PopupArchIcon title="City Complete!"><img src="assets/icons/map.png" width={56} height={48} style={{ display: 'block' }} /></PopupArchIcon>
        {onClose && <PopupCloseBtn onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }} />}

        {currentAgeData && (
          <img src={`assets/icons/theme-${currentAgeData.id}.png`}
            width={80} height={80}
            style={{ borderRadius: 16, marginBottom: 10, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)' }} />
        )}
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#f7b55f', marginBottom: 2 }}>You've Completed</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#ffffff', marginBottom: 16 }}>
          {currentAgeData?.name}
        </div>

        {nextAgeData && (
          <div style={{
            width: '100%', background: '#0d1828', borderRadius: 12,
            padding: '10px 14px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <img src={`assets/icons/theme-${nextAgeData.id}.png`}
              width={40} height={40}
              style={{ borderRadius: 10, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,0.15)', flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Next City Unlocked</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#ffffff' }}>{nextAgeData.name}</div>
            </div>
          </div>
        )}

        <BigButton variant="green" onClick={onContinue}>
          <span>Continue Game</span>
        </BigButton>
      </div>
    </Overlay>
  );
}

export function NewCityBoostPopup({ age, onYes, onNo }) {
  return (
    <Overlay>
      <div style={{
        width: 280, borderRadius: 20,
        background: 'linear-gradient(180deg, #253f5a 0%, #152840 100%)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
        padding: '64px 14px 20px', overflow: 'visible',
        position: 'relative', animation: 'popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <PopupArchIcon title="City Bonus!">
          <img src="assets/icons/reward.png" width={58} height={52} style={{ display: 'block' }} />
        </PopupArchIcon>
        <PopupCloseBtn onClick={onNo} style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }} />

        <div style={{ width: 90, height: 90, margin: '0 auto 14px', position: 'relative' }}>
          <BuildingTile level={4} age={age || 'stone'} style="png" size={90} />
        </div>

        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: '#ffffff', margin: '0 0 18px', lineHeight: 1.6, textAlign: 'center' }}>
          Watch a short ad and start with a{' '}
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: '#3fcbff' }}>128 Building</strong>{' '}
          in the board!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <BigButton variant="orange" onClick={onYes}>
            <GameImg src="assets/atlas/icon_ad.png" width={26} height={26} />
            <span>Watch Ad &amp; Get 128</span>
          </BigButton>
          <BigButton variant="cream" onClick={onNo}>
            <span>No Thanks</span>
          </BigButton>
        </div>
      </div>
    </Overlay>
  );
}

export function CityChangeConfirmPopup({ ageData, onCancel, onConfirm }) {
  return (
    <Overlay>
      <PopupShell title="Switch City?">
        <div style={{ padding: '14px 22px 4px', fontFamily: 'var(--font-ui)', fontSize: 19, color: '#5A2A05', textAlign: 'center', lineHeight: 1.5 }}>
          Switch to <strong>{ageData?.name}</strong>?<br/>
          <span style={{ fontSize: 14, color: '#8A6238' }}>CURRENT PROGRESS WILL BE RESET</span>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '14px 18px 4px' }}>
          <BigButton variant="cream" onClick={onCancel}><span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>CANCEL</span></BigButton>
          <BigButton variant="orange" onClick={onConfirm}><span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>SWITCH</span></BigButton>
        </div>
      </PopupShell>
    </Overlay>
  );
}

export function CitySelectModal({ currentAge, highestPerAge, onSelect, onClose }) {
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, zIndex: 210, background: 'rgba(31,43,82,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 200ms' }}
    >
      {/* Centered popup */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(360px, calc(100vw - 20px))', maxHeight: '76vh',
          background: '#1A2845',
          borderRadius: 20,
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          animation: 'popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 16px 10px', flexShrink: 0, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 2 }}>
            <img src="assets/icons/map.png" width={22} height={22} style={{ display: 'block' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#ffffff' }}>World Map</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Complete each city to advance</div>
          <PopupCloseBtn onClick={onClose} style={{ position: 'absolute', top: 12, right: 12 }} />
        </div>

        {/* Card list */}
        <div className="game-scroll" style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '4px 10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CITY_ORDER.map((city, idx) => {
            if (city.comingSoon) {
              return <CityCardItem key="coming_soon" index={idx + 1} city={city} ageData={null} isUnlocked={false} isCurrent={false} onSelect={null} onLockedTap={showToast} unlockHint={null} />;
            }
            const ageData = AGES[city.id];
            if (!ageData) return null;
            const cond = city.unlockCondition;
            const isUnlocked = !cond || (highestPerAge[cond.ageId] || 0) >= cond.minLevel;
            const isCurrent = currentAge === city.id;
            const unlockHint = cond
              ? `Complete ${AGES[cond.ageId]?.name} first`
              : null;
            return (
              <CityCardItem
                key={city.id}
                index={idx + 1}
                city={city}
                ageData={ageData}
                isUnlocked={isUnlocked}
                isCurrent={isCurrent}
                onSelect={() => onSelect(city.id)}
                onLockedTap={showToast}
                unlockHint={unlockHint}
              />
            );
          })}
        </div>
      </div>

      {/* Toast — screen center, above popup */}
      {toast && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(10,20,50,0.92)', color: '#ffffff',
          borderRadius: 999, padding: '10px 20px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
          whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          animation: 'fadeIn 180ms', pointerEvents: 'none', zIndex: 5,
        }}>🔒 {toast}</div>
      )}
    </div>
  );
}

// ── How To Play Popup ─────────────────────────────────────
export function HowToPlayPopup({ onClose }) {
  return (
    <Overlay>
      <div style={{
        width: 310,
        background: '#FFFFFF',
        borderRadius: 24,
        boxShadow: '0 8px 0 rgba(58,30,14,0.3), 0 16px 40px rgba(0,0,0,0.5)',
        animation: 'popIn 300ms cubic-bezier(0.34,1.56,0.64,1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        overflow: 'hidden',
      }}>
        {/* Tutorial image */}
        <img
          src="assets/howtoplay.png"
          alt="How to play"
          style={{ width: '100%', display: 'block' }}
        />
        {/* Divider + OK */}
        <div style={{ width: '100%', height: 1, background: 'rgba(58,30,14,0.12)' }} />
        <button onClick={onClose} style={{
          width: '100%', padding: '16px 0',
          background: 'transparent', border: 'none',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
          color: '#3B9BE8', cursor: 'pointer',
        }}>OK</button>
      </div>
    </Overlay>
  );
}
