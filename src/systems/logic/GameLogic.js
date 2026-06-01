export const SIZE = 4;

let __id = 1;

export function emptyGrid() {
  return Array(SIZE).fill(null).map(() => Array(SIZE).fill(null));
}

export function newTile(level, r, c) {
  return { id: __id++, level, r, c, justSpawned: true };
}

export function spawnRandom(grid) {
  const empties = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (!grid[r][c]) empties.push([r, c]);
  }
  if (empties.length === 0) return grid;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const level = Math.random() < 0.9 ? 1 : 2;
  const g = grid.map(row => row.slice());
  g[r][c] = newTile(level, r, c);
  return g;
}

export function cloneGrid(g) {
  return g.map(row => row.map(t => t ? { ...t, justSpawned: false, justMerged: false } : null));
}

export function move(grid, dir) {
  const g = cloneGrid(grid);
  let moved = false;
  let scoreGained = 0;
  let mergedCount = 0;
  let highest = 0;

  function processLine(line) {
    const filtered = line.filter(t => t);
    const out = [];
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i].level === filtered[i + 1].level) {
        const merged = newTile(filtered[i].level + 1, 0, 0);
        merged.justMerged = true;
        merged.fromIds = [filtered[i].id, filtered[i + 1].id];
        out.push(merged);
        scoreGained += Math.pow(2, filtered[i].level + 1);
        mergedCount++;
        if (merged.level > highest) highest = merged.level;
        i += 2;
      } else {
        out.push({ ...filtered[i], justMerged: false });
        i++;
      }
    }
    while (out.length < SIZE) out.push(null);
    return out;
  }

  for (let i = 0; i < SIZE; i++) {
    let line;
    if (dir === 'left') line = g[i].slice();
    else if (dir === 'right') line = g[i].slice().reverse();
    else if (dir === 'up') line = [g[0][i], g[1][i], g[2][i], g[3][i]];
    else line = [g[3][i], g[2][i], g[1][i], g[0][i]];

    const before = line.map(t => t ? t.id : null).join(',');
    const processed = processLine(line);
    const after = processed.map(t => t ? t.id : null).join(',');
    if (before !== after) moved = true;

    if (dir === 'left') {
      for (let c = 0; c < SIZE; c++) { g[i][c] = processed[c]; if (g[i][c]) { g[i][c].r = i; g[i][c].c = c; } }
    } else if (dir === 'right') {
      for (let c = 0; c < SIZE; c++) { g[i][SIZE - 1 - c] = processed[c]; if (g[i][SIZE - 1 - c]) { g[i][SIZE - 1 - c].r = i; g[i][SIZE - 1 - c].c = SIZE - 1 - c; } }
    } else if (dir === 'up') {
      for (let r = 0; r < SIZE; r++) { g[r][i] = processed[r]; if (g[r][i]) { g[r][i].r = r; g[r][i].c = i; } }
    } else {
      for (let r = 0; r < SIZE; r++) { g[SIZE - 1 - r][i] = processed[r]; if (g[SIZE - 1 - r][i]) { g[SIZE - 1 - r][i].r = SIZE - 1 - r; g[SIZE - 1 - r][i].c = i; } }
    }
  }

  return { grid: g, moved, scoreGained, mergedCount, highest };
}

export function canMove(grid) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (!grid[r][c]) return true;
    const lvl = grid[r][c].level;
    if (r + 1 < SIZE && grid[r + 1][c] && grid[r + 1][c].level === lvl) return true;
    if (c + 1 < SIZE && grid[r][c + 1] && grid[r][c + 1].level === lvl) return true;
  }
  return false;
}

export function highestLevel(grid) {
  let h = 0;
  for (const row of grid) for (const t of row) if (t && t.level > h) h = t.level;
  return h;
}

export function nextId() {
  return __id++;
}
