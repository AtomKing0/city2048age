import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import CityGame from './scenes/GameScene.jsx';

// VERSION MARKER — if this doesn't appear in console, old cached JS is loading
console.log('%c[City2048] JS v6 loaded', 'color:#4ade80;font-weight:bold;font-size:14px');
import './styles/tokens.css';
import { initAnalytics } from './core/Analytics.js';
initAnalytics();

if (new URLSearchParams(location.search).has('reset')) {
  Object.keys(localStorage).filter(k => k.startsWith('city2048-')).forEach(k => localStorage.removeItem(k));
  location.replace(location.pathname);
}


function GameFrame({ children, scale, isDesktop }) {
  return (
    <div style={{
      width: 390, height: 844,
      transform: `scale(${scale})`, transformOrigin: 'top center',
      position: 'relative', overflow: 'hidden',
      borderRadius: isDesktop ? 48 : 0,
      boxShadow: isDesktop ? '0 0 0 1px rgba(255,255,255,0.1), 0 16px 64px rgba(0,0,0,0.7)' : 'none',
    }}>
      {children}
    </div>
  );
}

function App() {
  const [scale, setScale] = useState(1);
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    function updateScale() {
      const sw = window.innerWidth / 390;
      const sh = window.innerHeight / 844;
      const s = Math.min(sw, sh, 1);
      setScale(s);
      setIsDesktop(window.innerWidth > 500);
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        width: '100vw', height: '100vh',
        paddingTop: isDesktop ? `max(0px, calc(50vh - ${844 * scale / 2}px))` : 'env(safe-area-inset-top, 0px)',
        background: 'linear-gradient(180deg, var(--bg-from, #0a0a14) 0%, var(--bg-to, #0a0a14) 100%)', boxSizing: 'border-box',
      }}>
        <GameFrame scale={scale} isDesktop={isDesktop}>
          <CityGame />
        </GameFrame>
      </div>
  );
}

// Defer render until all ES modules finish initialising.
// Without this, React's MessageChannel scheduler can fire a component render
// before circular-chunk dependencies finish evaluating → TDZ errors.
setTimeout(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
}, 0);
