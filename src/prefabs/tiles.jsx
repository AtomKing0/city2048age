import { AGES, BUILDING_PNGS, AGE_BUILDING_PNGS, TILE_NUMBERS } from '../config/ages.js';

export { AGES, BUILDING_PNGS, AGE_BUILDING_PNGS, TILE_NUMBERS };

export function getBuildingPng(ageId, level) {
  const pngs = AGE_BUILDING_PNGS[ageId] ?? BUILDING_PNGS;
  return pngs[Math.min(level - 1, pngs.length - 1)];
}

export function TileSVG({ level, palette, ageId, size = 64 }) {
  const [body, accent, shadow] = palette;
  const lvl = Math.max(1, Math.min(14, level));

  const drawn = (() => {
    switch (lvl) {
      case 1:
        return (<>
          <polygon points="20,75 80,75 50,30" fill={body} />
          <polygon points="20,75 80,75 50,30" fill="none" stroke={shadow} strokeWidth="3" strokeLinejoin="round" />
          <line x1="50" y1="30" x2="50" y2="75" stroke={accent} strokeWidth="3" />
          <polygon points="40,75 50,55 60,75" fill={accent} />
        </>);
      case 2:
        return (<>
          <rect x="22" y="48" width="56" height="32" fill={body} stroke={shadow} strokeWidth="3" rx="3" />
          <polygon points="16,50 84,50 50,22" fill={accent} stroke={shadow} strokeWidth="3" strokeLinejoin="round" />
          <rect x="44" y="58" width="12" height="22" fill={shadow} rx="2" />
        </>);
      case 3:
        return (<>
          <rect x="20" y="42" width="60" height="40" fill={body} stroke={shadow} strokeWidth="3" rx="3" />
          <polygon points="14,46 86,46 50,16" fill={accent} stroke={shadow} strokeWidth="3" strokeLinejoin="round" />
          <rect x="44" y="58" width="12" height="24" fill={shadow} rx="2" />
          <rect x="28" y="54" width="10" height="10" fill={accent} stroke={shadow} strokeWidth="2" rx="1" />
          <rect x="62" y="54" width="10" height="10" fill={accent} stroke={shadow} strokeWidth="2" rx="1" />
        </>);
      case 4:
        return (<>
          <rect x="18" y="38" width="64" height="44" fill={body} stroke={shadow} strokeWidth="3" rx="3" />
          <polygon points="12,42 88,42 50,12" fill={accent} stroke={shadow} strokeWidth="3" strokeLinejoin="round" />
          <rect x="44" y="56" width="12" height="26" fill={shadow} rx="2" />
          <rect x="26" y="50" width="10" height="10" fill={accent} stroke={shadow} strokeWidth="2" rx="1" />
          <rect x="64" y="50" width="10" height="10" fill={accent} stroke={shadow} strokeWidth="2" rx="1" />
          <line x1="28" y1="68" x2="42" y2="68" stroke={shadow} strokeWidth="1.5" opacity="0.6"/>
          <line x1="58" y1="68" x2="72" y2="68" stroke={shadow} strokeWidth="1.5" opacity="0.6"/>
        </>);
      case 5:
        return (<>
          <rect x="22" y="32" width="56" height="50" fill={body} stroke={shadow} strokeWidth="3" rx="3" />
          <polygon points="18,36 82,36 50,12" fill={accent} stroke={shadow} strokeWidth="3" strokeLinejoin="round" />
          <rect x="44" y="60" width="12" height="22" fill={shadow} rx="2" />
          <rect x="28" y="42" width="9" height="9" fill={accent} stroke={shadow} strokeWidth="1.5" />
          <rect x="44" y="42" width="9" height="9" fill={accent} stroke={shadow} strokeWidth="1.5" />
          <rect x="60" y="42" width="9" height="9" fill={accent} stroke={shadow} strokeWidth="1.5" />
          <rect x="28" y="56" width="9" height="9" fill={accent} stroke={shadow} strokeWidth="1.5" />
          <rect x="60" y="56" width="9" height="9" fill={accent} stroke={shadow} strokeWidth="1.5" />
        </>);
      case 6:
        return (<>
          <rect x="20" y="22" width="60" height="60" fill={body} stroke={shadow} strokeWidth="3" rx="3" />
          <rect x="18" y="20" width="64" height="6" fill={accent} stroke={shadow} strokeWidth="3" />
          {[0,1,2,3].map(r => [0,1,2].map(c => (
            <rect key={r+'-'+c} x={28+c*16} y={30+r*12} width="10" height="7" fill={accent} stroke={shadow} strokeWidth="1.5" rx="1" />
          )))}
          <rect x="44" y="74" width="12" height="8" fill={shadow} />
        </>);
      case 7:
        return (<>
          <rect x="22" y="18" width="56" height="64" fill={body} stroke={shadow} strokeWidth="3" rx="2" />
          <rect x="22" y="18" width="56" height="6" fill={accent} stroke={shadow} strokeWidth="2" />
          {[0,1,2,3,4].map(r => [0,1,2].map(c => (
            <rect key={r+'-'+c} x={28+c*16} y={28+r*10} width="10" height="6" fill={accent} stroke={shadow} strokeWidth="1" rx="1" />
          )))}
          <line x1="50" y1="18" x2="50" y2="8" stroke={shadow} strokeWidth="2" />
          <circle cx="50" cy="7" r="2.5" fill={accent} />
        </>);
      case 8:
        return (<>
          <rect x="34" y="8" width="32" height="74" fill={body} stroke={shadow} strokeWidth="3" rx="2" />
          <rect x="22" y="32" width="56" height="50" fill={body} stroke={shadow} strokeWidth="3" rx="2" />
          {[0,1,2,3].map(r => [0,1].map(c => (
            <rect key={'a'+r+c} x={40+c*12} y={14+r*10} width="8" height="6" fill={accent} stroke={shadow} strokeWidth="1" rx="1" />
          )))}
          {[0,1,2,3].map(r => [0,1,2,3].map(c => (
            <rect key={'b'+r+c} x={28+c*12} y={38+r*10} width="8" height="6" fill={accent} stroke={shadow} strokeWidth="1" rx="1" />
          )))}
          <line x1="50" y1="8" x2="50" y2="0" stroke={shadow} strokeWidth="2"/>
        </>);
      case 9:
        return (<>
          <polygon points="38,10 62,10 66,82 34,82" fill={body} stroke={shadow} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="38,10 62,10 58,4 42,4" fill={accent} stroke={shadow} strokeWidth="2" />
          {[0,1,2,3,4,5,6].map(r => (
            <rect key={r} x="42" y={16+r*9} width="16" height="5" fill={accent} stroke={shadow} strokeWidth="1" rx="1" />
          ))}
          <line x1="50" y1="4" x2="50" y2="-4" stroke={shadow} strokeWidth="2"/>
        </>);
      case 10:
        return (<>
          <polygon points="46,14 54,14 60,82 40,82" fill={body} stroke={shadow} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="46,14 54,14 50,2" fill={accent} stroke={shadow} strokeWidth="2" />
          <circle cx="50" cy="22" r="4" fill={accent} stroke={shadow} strokeWidth="1.5"/>
          <circle cx="50" cy="38" r="6" fill={accent} stroke={shadow} strokeWidth="1.5"/>
          <circle cx="50" cy="58" r="8" fill={accent} stroke={shadow} strokeWidth="1.5"/>
          <line x1="50" y1="2" x2="50" y2="-6" stroke={shadow} strokeWidth="2"/>
        </>);
      case 11:
        return (<>
          <rect x="20" y="22" width="22" height="60" fill={body} stroke={shadow} strokeWidth="3" rx="2" />
          <rect x="58" y="14" width="22" height="68" fill={body} stroke={shadow} strokeWidth="3" rx="2" />
          <polygon points="20,22 42,22 31,12" fill={accent} stroke={shadow} strokeWidth="2" />
          <polygon points="58,14 80,14 69,4" fill={accent} stroke={shadow} strokeWidth="2" />
          {[0,1,2,3,4].map(r => (<g key={r}>
            <rect x="24" y={28+r*10} width="14" height="6" fill={accent} stroke={shadow} strokeWidth="1" rx="1" />
            <rect x="62" y={20+r*10} width="14" height="6" fill={accent} stroke={shadow} strokeWidth="1" rx="1" />
          </g>))}
          <rect x="42" y="58" width="16" height="2" fill={accent} stroke={shadow} strokeWidth="0.5"/>
        </>);
      case 12:
        return (<>
          <polygon points="30,82 70,82 78,40 50,8 22,40" fill={body} stroke={shadow} strokeWidth="3" strokeLinejoin="round" />
          <polygon points="50,8 78,40 50,40" fill={accent} opacity="0.85" />
          <polygon points="50,8 22,40 50,40" fill={accent} opacity="0.55" />
          <line x1="50" y1="8" x2="50" y2="82" stroke={shadow} strokeWidth="2" opacity="0.7"/>
          <line x1="22" y1="40" x2="78" y2="40" stroke={shadow} strokeWidth="2" opacity="0.7"/>
          <circle cx="50" cy="60" r="4" fill={accent} stroke={shadow} strokeWidth="1.5"/>
        </>);
      case 13:
        return (<>
          {[0,1,2,3,4,5,6,7].map(i => {
            const a = (i*Math.PI*2)/8;
            const x1 = 50 + Math.cos(a)*8;
            const y1 = 22 + Math.sin(a)*8;
            const x2 = 50 + Math.cos(a)*22;
            const y2 = 22 + Math.sin(a)*22;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="3" strokeLinecap="round"/>;
          })}
          <circle cx="50" cy="22" r="9" fill={accent} stroke={shadow} strokeWidth="2"/>
          <rect x="32" y="48" width="36" height="34" fill={body} stroke={shadow} strokeWidth="3" rx="3" />
          <rect x="44" y="60" width="12" height="22" fill={shadow} rx="2"/>
          <rect x="36" y="52" width="8" height="6" fill={accent} stroke={shadow} strokeWidth="1"/>
          <rect x="56" y="52" width="8" height="6" fill={accent} stroke={shadow} strokeWidth="1"/>
        </>);
      case 14:
        return (<>
          <circle cx="50" cy="50" r="40" fill={accent} opacity="0.18"/>
          <circle cx="50" cy="50" r="28" fill={accent} opacity="0.32"/>
          <polygon points="20,70 80,70 80,40 65,55 50,30 35,55 20,40" fill={accent} stroke={shadow} strokeWidth="3" strokeLinejoin="round" />
          <rect x="20" y="68" width="60" height="14" fill={body} stroke={shadow} strokeWidth="3" rx="2"/>
          <circle cx="50" cy="30" r="4" fill={body} stroke={shadow} strokeWidth="2"/>
          <circle cx="35" cy="55" r="3" fill={body} stroke={shadow} strokeWidth="2"/>
          <circle cx="65" cy="55" r="3" fill={body} stroke={shadow} strokeWidth="2"/>
          <rect x="44" y="74" width="12" height="8" fill={shadow}/>
        </>);
      default: return null;
    }
  })();

  return (
    <svg width={size} height={size} viewBox="-4 -8 108 108" style={{ display: 'block', overflow: 'visible' }}>
      {drawn}
    </svg>
  );
}

export function BuildingTile({ level, age, style = 'png', justMerged = false, justSpawned = false, size = 64, badgeScale = 1 }) {
  const ageData = AGES[age] || AGES.classic;
  const palette = ageData.tilePalette[level - 1] || ageData.tilePalette[0];
  const [body, accent, shadow] = palette;
  const name = ageData.names[level - 1];
  const num = TILE_NUMBERS[level - 1] || level;
  const tileBg = (style === 'silhouette' || style === 'png') ? '#FFF8EC' : body;
  const numFontSize = num >= 1000 ? 14 : num >= 100 ? 15 : 17;
  const numPadding = num >= 1000 ? '0 6px' : '0 8px';

  return (
    <div className={`btile ${justMerged ? 'merged' : ''} ${justSpawned ? 'spawned' : ''}`} style={{
      width: '100%', height: '100%',
      background: tileBg,
      borderRadius: 12,
      boxShadow: `0 3px 0 ${shadow}, 0 5px 8px rgba(58,30,14,0.25), inset 0 1px 0 rgba(255,255,255,0.5)`,
      border: `2px solid ${shadow}`,
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: 3,
        minWidth: 27, height: 24, padding: numPadding,
        background: accent, color: '#FFF8EC',
        borderRadius: 14, fontSize: numFontSize, fontWeight: 800,
        fontFamily: 'var(--font-display)',
        fontVariantNumeric: 'tabular-nums',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${shadow}`,
        boxShadow: '0 1px 0 rgba(58,30,14,0.3)',
        lineHeight: 1,
        zIndex: 2,
        ...(badgeScale !== 1 && { transform: `scale(${badgeScale})`, transformOrigin: 'top left' }),
      }}>{num}</div>

      {style === 'png' ? (
        <img
          src={getBuildingPng(age, level)}
          alt={name}
          decoding="sync"
          draggable={false}
          style={{
            width: '92%', height: '92%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 2px rgba(58,30,14,0.25))',
            pointerEvents: 'none',
          }}
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
        />
      ) : style === 'emoji' ? (
        <div style={{ fontSize: size * 0.55, lineHeight: 1, filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.18))' }}>
          {emojiFor(level)}
        </div>
      ) : style === 'silhouette' ? (
        <div style={{ filter: `drop-shadow(0 2px 0 ${shadow})` }}>
          <SilhouetteSVG level={level} color={shadow} size={size * 0.9} />
        </div>
      ) : (
        <TileSVG level={level} palette={palette} ageId={age} size={size * 0.9} />
      )}

      {size >= 90 && (
        <div style={{
          position: 'absolute', bottom: 2, left: 4, right: 4,
          fontSize: 8, fontWeight: 700, color: shadow,
          textAlign: 'center',
          fontFamily: 'var(--font-ui)',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          opacity: 0.7,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
      )}
    </div>
  );
}

export function emojiFor(level) {
  const map = ['⛺','🛖','🏠','🏡','🏘️','🏢','🏬','🏙️','🏯','🗼','🏰','💎','🌅','👑'];
  return map[level - 1] || '⭐';
}

export function SilhouetteSVG({ level, color, size = 64 }) {
  const lvl = Math.max(1, Math.min(14, level));
  const shapes = {
    1: <polygon points="20,75 80,75 50,30" fill={color} />,
    2: <g><rect x="22" y="48" width="56" height="32" fill={color}/><polygon points="16,50 84,50 50,22" fill={color}/></g>,
    3: <g><rect x="20" y="42" width="60" height="40" fill={color}/><polygon points="14,46 86,46 50,16" fill={color}/></g>,
    4: <g><rect x="18" y="38" width="64" height="44" fill={color}/><polygon points="12,42 88,42 50,12" fill={color}/></g>,
    5: <g><rect x="22" y="32" width="56" height="50" fill={color}/><polygon points="18,36 82,36 50,12" fill={color}/></g>,
    6: <rect x="20" y="22" width="60" height="60" fill={color} rx="2"/>,
    7: <g><rect x="22" y="18" width="56" height="64" fill={color} rx="2"/><line x1="50" y1="18" x2="50" y2="6" stroke={color} strokeWidth="3"/></g>,
    8: <g><rect x="34" y="8" width="32" height="74" fill={color} rx="2"/><rect x="22" y="32" width="56" height="50" fill={color} rx="2"/></g>,
    9: <polygon points="38,10 62,10 66,82 34,82" fill={color}/>,
    10: <g><polygon points="46,14 54,14 60,82 40,82" fill={color}/><polygon points="46,14 54,14 50,2" fill={color}/></g>,
    11: <g><rect x="20" y="22" width="22" height="60" fill={color} rx="2"/><rect x="58" y="14" width="22" height="68" fill={color} rx="2"/></g>,
    12: <polygon points="30,82 70,82 78,40 50,8 22,40" fill={color}/>,
    13: <g><circle cx="50" cy="22" r="12" fill={color}/><rect x="32" y="48" width="36" height="34" fill={color} rx="3"/></g>,
    14: <g><polygon points="20,70 80,70 80,40 65,55 50,30 35,55 20,40" fill={color}/><rect x="20" y="68" width="60" height="14" fill={color} rx="2"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      {shapes[lvl]}
    </svg>
  );
}
