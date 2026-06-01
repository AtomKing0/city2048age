import { memo } from 'react';

const CELL = 76;
const GAP = 7;
const SIZE = 4;
const BOARD_PX = SIZE * CELL + (SIZE + 1) * GAP;

export const Board = memo(function Board({ ageData, canvasRef, removeMode, wandMode, onBoardClick }) {
  const outline = wandMode
    ? '3px solid #A040E0'
    : removeMode
      ? '3px solid var(--brand-orange-400)'
      : 'none';
  const cursor = (removeMode || wandMode) ? 'crosshair' : 'default';

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={onBoardClick}
        style={{
          width: BOARD_PX,
          height: BOARD_PX,
          background: ageData.boardBg,
          borderRadius: 16,
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4), 0 4px 20px rgba(0,0,0,0.5)',
          position: 'relative',
          touchAction: 'none',
          userSelect: 'none',
          outline,
          outlineOffset: 4,
          cursor,
        }}
      >
        {/* Empty cell grid (DOM, styled per age) */}
        {Array.from({ length: SIZE * SIZE }).map((_, i) => {
          const r = Math.floor(i / SIZE);
          const c = i % SIZE;
          return (
            <div key={i} style={{
              position: 'absolute',
              left: GAP + c * (CELL + GAP),
              top: GAP + r * (CELL + GAP),
              width: CELL,
              height: CELL,
              background: ageData.boardCell,
              borderRadius: 14,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            }} />
          );
        })}

        {/* PixiJS canvas — transparent bg, sits above cells */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: 22,
          }}
        />
      </div>
    </div>
  );
});
