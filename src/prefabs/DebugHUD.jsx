// DebugHUD — runtime leak diagnostics. Enabled only with ?debug=1 in the URL.
// Samples key counters every 1s. Δ = change over the last ~60s window.
// A metric whose Δ stays positive over minutes = the thing that's leaking.
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

// [key, getter, unit]. window.__bv is set by GameScene in debug mode.
const METRICS = [
  ['heap',    () => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1), 'M'],
  ['domNodes',() => document.getElementsByTagName('*').length],
  ['gsapTw',  () => gsap.globalTimeline.getChildren(true, true, false).length],
  ['sprites', () => window.__bv?._sprites?.size ?? -1],
  ['poolSum', () => (window.__bv ? [...window.__bv._pool.values()].reduce((a, l) => a + l.length, 0) : -1)],
  ['tileCh',  () => window.__bv?._tileContainer?.children.length ?? -1],
  ['partCh',  () => window.__bv?._particleContainer?.children.length ?? -1],
  ['badgeTx', () => window.__bv?._badgeBgCache?.size ?? -1],
  ['labelTx', () => window.__bv?._labelTextureCache?.size ?? -1],
];

// metrics where a sustained positive Δ likely means a leak
const WATCH = new Set(['heap', 'domNodes', 'gsapTw', 'sprites', 'poolSum', 'tileCh', 'partCh']);

export default function DebugHUD() {
  const [rows, setRows] = useState([]);
  const hist = useRef({});
  const peak = useRef({});

  useEffect(() => {
    const sample = () => {
      const out = METRICS.map(([k, fn, unit = '']) => {
        let v = -1;
        try { v = fn(); } catch { /* ignore */ }
        const h = (hist.current[k] ??= []);
        h.push(v);
        if (h.length > 60) h.shift();
        peak.current[k] = Math.max(peak.current[k] ?? v, v);
        const d = h.length > 1 ? v - h[0] : 0;
        return { k, v, unit, peak: peak.current[k], d };
      });
      setRows(out);
    };
    sample();
    const t = setInterval(sample, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 4, left: 4, zIndex: 99999,
      background: 'rgba(0,0,0,0.82)', color: '#9fe',
      font: '10px/1.32 ui-monospace, Menlo, monospace',
      padding: '6px 8px', borderRadius: 6, pointerEvents: 'none', whiteSpace: 'pre',
    }}>
      <div style={{ color: '#fc6', marginBottom: 2, fontWeight: 700 }}>DIAG  Δ=last60s</div>
      {rows.map((r) => {
        const leaking = WATCH.has(r.k) && r.d > 0;
        return (
          <div key={r.k} style={{ color: leaking ? '#ff7b7b' : '#9fe' }}>
            {r.k.padEnd(8)}{String(r.v).padStart(6)}{r.unit.padEnd(1)} pk{String(r.peak).padStart(5)} Δ{r.d >= 0 ? '+' : ''}{r.d}
          </div>
        );
      })}
    </div>
  );
}
