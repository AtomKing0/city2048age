const size = BOARD_SIZE;
const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const coinsEl = document.getElementById("coins");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const soundBtn = document.getElementById("soundBtn");
const undoBtn = document.getElementById("undoBtn");
const removeBtn = document.getElementById("removeBtn");
const restartBtn = document.getElementById("restartBtn");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalAction = document.getElementById("modalAction");
const closeModal = document.getElementById("closeModal");

let board = [];
let score = 0;
let best = Number(localStorage.getItem("city2048Best") || 0);
let coins = 2600;
let undoSnapshot = null;
let removeMode = false;
let isAnimating = false;
let soundEnabled = true;
let modalActionHandler = null;
let ignoreNextBoardClick = false;

const demoStartBoard = [
  [2, 4, 8, 0],
  [4, 16, 0, 0],
  [8, 32, 64, 0],
  [0, 0, 0, 0],
];

const buildings = {
  2: {
    name: "tent",
    svg: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path class="ground" d="M18 82h64" />
        <path class="tent-left" d="M50 16 16 82h38Z" />
        <path class="tent-right" d="M50 16 84 82H54Z" />
        <path class="tent-door" d="M50 42 36 82h28Z" />
        <path class="line" d="M50 16v66M16 82h68" />
      </svg>
    `,
  },
  4: {
    name: "hut",
    svg: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path class="ground" d="M18 84h64" />
        <path class="roof warm" d="M50 20 15 52h70Z" />
        <path class="wall tan" d="M26 51h48v32H26Z" />
        <path class="door detail" d="M43 62h14v21H43Z" />
      </svg>
    `,
  },
  8: {
    name: "house",
    svg: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path class="ground" d="M15 84h70" />
        <path class="roof red" d="M50 14 12 48h76Z" />
        <path class="wall cream" d="M23 47h54v37H23Z" />
        <path class="door detail" d="M43 62h14v22H43Z" />
        <path class="window red-window detail" d="M31 58h11v11H31Zm27 0h11v11H58Z" />
      </svg>
    `,
  },
  16: {
    name: "shop",
    svg: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path class="ground" d="M14 84h72" />
        <path class="wall cream" d="M22 43h56v41H22Z" />
        <path class="shop-top" d="M20 25h60v20H20Z" />
        <path class="awning a1 detail" d="M18 42h16v13H18Z" />
        <path class="awning a2 detail" d="M34 42h16v13H34Z" />
        <path class="awning a1 detail" d="M50 42h16v13H50Z" />
        <path class="awning a2 detail" d="M66 42h16v13H66Z" />
        <path class="door blue-door detail" d="M42 62h16v22H42Z" />
      </svg>
    `,
  },
  32: {
    name: "apartment",
    svg: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path class="ground" d="M18 86h64" />
        <path class="building-blue" d="M25 18h50v68H25Z" />
        <path class="roof cap" d="M22 18h56v10H22Z" />
        <path class="grid-windows detail" d="M35 36h9v9h-9Zm21 0h9v9h-9ZM35 54h9v9h-9Zm21 0h9v9h-9ZM35 72h9v8h-9Zm21 0h9v8h-9Z" />
      </svg>
    `,
  },
  64: {
    name: "tower",
    svg: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path class="ground" d="M17 87h66" />
        <path class="tower-body" d="M42 12h32l-8 75H33Z" />
        <path class="tower-side" d="M27 34h19l-5 53H23Z" />
        <path class="tower-windows" d="M48 29h12M47 45h12M45 61h12M43 77h12" />
      </svg>
    `,
  },
  128: {
    name: "sky",
    svg: `
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <path class="ground" d="M14 88h72" />
        <path class="sky-back" d="M18 45h20v43H18Z" />
        <path class="sky-main" d="M39 14h30v74H39Z" />
        <path class="sky-top" d="M49 5 69 14H39Z" />
        <path class="sky-side" d="M68 31h18v57H68Z" />
        <path class="sky-windows" d="M48 27h5m8 0h5M48 40h5m8 0h5M48 53h5m8 0h5M48 66h5m8 0h5M25 56h5m-5 12h5m48-23h4m-4 12h4m-4 12h4" />
      </svg>
    `,
  },
};

function buildingFor(value) {
  const levels = Object.keys(buildings).map(Number).sort((a, b) => a - b);
  let selected = levels[0];
  for (const level of levels) {
    if (value >= level) selected = level;
  }
  return buildings[selected];
}

function displayLevel(value) {
  return Math.max(1, Math.round(Math.log2(value)));
}

function emptyBoard() {
  return createEmptyBoard(size);
}

function cloneState() {
  return {
    board: board.map((row) => [...row]),
    score,
  };
}

function restoreState(state) {
  board = state.board.map((row) => [...row]);
  score = state.score;
  removeMode = false;
  render();
}

function startGame() {
  board = demoStartBoard.map((row) => [...row]);
  score = 0;
  undoSnapshot = null;
  removeMode = false;
  render();
}

function availableCells() {
  const cells = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (!board[r][c]) cells.push([r, c]);
    }
  }
  return cells;
}

function spawnTile() {
  const cells = availableCells();
  if (!cells.length) return null;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  board[r][c] = Math.random() < 0.86 ? 2 : 4;
  return [r, c];
}

function planLineMoves(entries, reverse = false) {
  const source = reverse ? [...entries].reverse() : [...entries];
  const occupied = source.filter((entry) => entry.value);
  const output = [];
  const moves = [];
  const mergedCells = [];
  let gained = 0;

  for (let i = 0; i < occupied.length; i += 1) {
    const first = occupied[i];
    const second = occupied[i + 1];
    const destLineIndex = output.length;

    if (second && first.value === second.value) {
      const mergedValue = first.value * 2;
      output.push({ value: mergedValue });
      gained += mergedValue;
      moves.push({ from: first.index, to: destLineIndex, value: first.value, merged: true });
      moves.push({ from: second.index, to: destLineIndex, value: second.value, merged: true });
      mergedCells.push(destLineIndex);
      i += 1;
    } else {
      output.push({ value: first.value });
      moves.push({ from: first.index, to: destLineIndex, value: first.value, merged: false });
    }
  }

  while (output.length < size) output.push({ value: 0 });

  if (reverse) {
    const flip = (index) => size - 1 - index;
    return {
      line: output.reverse().map((entry) => entry.value),
      moves: moves.map((moveItem) => ({ ...moveItem, to: flip(moveItem.to) })),
      mergedCells: mergedCells.map(flip),
      gained,
    };
  }

  return {
    line: output.map((entry) => entry.value),
    moves,
    mergedCells,
    gained,
  };
}

function planMove(direction) {
  const nextBoard = emptyBoard();
  const animations = [];
  const mergedCells = [];
  let gained = 0;

  if (direction === "left" || direction === "right") {
    for (let r = 0; r < size; r += 1) {
      const entries = board[r].map((value, index) => ({ value, index }));
      const result = planLineMoves(entries, direction === "right");
      nextBoard[r] = result.line;
      gained += result.gained;
      result.moves.forEach((moveItem) => {
        animations.push({
          from: [r, moveItem.from],
          to: [r, moveItem.to],
          value: moveItem.value,
          merged: moveItem.merged,
        });
      });
      result.mergedCells.forEach((c) => mergedCells.push([r, c]));
    }
  } else {
    for (let c = 0; c < size; c += 1) {
      const entries = board.map((row, index) => ({ value: row[c], index }));
      const result = planLineMoves(entries, direction === "down");
      gained += result.gained;
      result.line.forEach((value, r) => {
        nextBoard[r][c] = value;
      });
      result.moves.forEach((moveItem) => {
        animations.push({
          from: [moveItem.from, c],
          to: [moveItem.to, c],
          value: moveItem.value,
          merged: moveItem.merged,
        });
      });
      result.mergedCells.forEach((r) => mergedCells.push([r, c]));
    }
  }

  const changed = JSON.stringify(board) !== JSON.stringify(nextBoard);
  return { board: nextBoard, gained, changed, animations, mergedCells };
}

function tileHtml(value) {
  const buildingData = buildingFor(value);
  return `
    <span class="badge">${displayLevel(value)}</span>
    <span class="building building-${buildingData.name}">${buildingData.svg}</span>
  `;
}

function cellSelector([r, c]) {
  return `.cell[data-row="${r}"][data-col="${c}"]`;
}

function animateMovement(animations) {
  return new Promise((resolve) => {
    const moving = animations.filter((animation) => animation.value && (
      animation.from[0] !== animation.to[0] || animation.from[1] !== animation.to[1] || animation.merged
    ));

    if (!moving.length) {
      resolve();
      return;
    }

    const boardRect = boardEl.getBoundingClientRect();
    const movingSourceKeys = new Set(moving.map((animation) => animation.from.join(",")));
    const ghosts = moving.map((animation) => {
      const fromCell = boardEl.querySelector(cellSelector(animation.from));
      const toCell = boardEl.querySelector(cellSelector(animation.to));
      const fromRect = fromCell.getBoundingClientRect();
      const toRect = toCell.getBoundingClientRect();
      const ghost = document.createElement("span");
      ghost.className = `tile tile-ghost level-${animation.value}${animation.merged ? " ghost-merge" : ""}`;
      ghost.innerHTML = tileHtml(animation.value);
      ghost.style.left = `${fromRect.left - boardRect.left}px`;
      ghost.style.top = `${fromRect.top - boardRect.top}px`;
      ghost.style.width = `${fromRect.width}px`;
      ghost.style.height = `${fromRect.height}px`;
      ghost.style.setProperty("--tx", `${toRect.left - fromRect.left}px`);
      ghost.style.setProperty("--ty", `${toRect.top - fromRect.top}px`);
      boardEl.append(ghost);
      return ghost;
    });

    boardEl.classList.add("is-moving");
    movingSourceKeys.forEach((key) => {
      const [r, c] = key.split(",");
      const sourceTile = boardEl.querySelector(cellSelector([r, c]))?.querySelector(".tile:not(.tile-ghost)");
      sourceTile?.classList.add("anim-source-hidden");
    });

    requestAnimationFrame(() => {
      ghosts.forEach((ghost) => ghost.classList.add("tile-ghost-run"));
    });

    window.setTimeout(() => {
      boardEl.classList.remove("is-moving");
      resolve();
    }, 205);
  });
}

async function move(direction) {
  if (removeMode || isAnimating) return;
  const snapshot = cloneState();
  const result = planMove(direction);

  if (result.changed) {
    isAnimating = true;
    undoSnapshot = snapshot;
    await animateMovement(result.animations);
    board = result.board.map((row) => [...row]);
    score += result.gained;
    best = Math.max(best, score);
    localStorage.setItem("city2048Best", String(best));
    const spawnedCell = spawnTile();
    render({ mergedCells: result.mergedCells, spawnedCell });
    window.setTimeout(() => {
      isAnimating = false;
      if (!canMove()) showModal("No More Move", "되돌리기, 블록 제거, 광고 보상 또는 다시 시작을 사용할 수 있습니다.");
    }, 150);
  }
}

function canMove() {
  return canMoveBoard(board);
}

function hasRemovableTile() {
  return board.some((row) => row.some(Boolean));
}

function render(effects = {}) {
  const mergedSet = new Set((effects.mergedCells || []).map((cell) => cell.join(",")));
  const spawnedKey = effects.spawnedCell?.join(",");
  boardEl.innerHTML = "";
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.dataset.row = r;
      cell.dataset.col = c;
      const value = board[r][c];
      if (value) {
        const tile = document.createElement("span");
        const effectClass = [
          mergedSet.has(`${r},${c}`) ? "tile-merged" : "",
          spawnedKey === `${r},${c}` ? "tile-spawned" : "",
        ].filter(Boolean).join(" ");
        tile.className = `tile level-${value} ${removeMode ? "selectable" : ""} ${effectClass}`;
        tile.innerHTML = tileHtml(value);
        cell.append(tile);
      }
      boardEl.append(cell);
    }
  }

  const progress = Math.min(14, Math.max(1, Math.floor(Math.log2(Math.max(...board.flat(), 2)))));
  progressText.textContent = `${progress}/14`;
  progressFill.style.width = `${Math.min(94, (progress / 14) * 100)}%`;
  scoreEl.textContent = score.toLocaleString();
  bestEl.textContent = best.toLocaleString();
  coinsEl.textContent = coins.toLocaleString();
  undoBtn.disabled = !undoSnapshot || coins < 50;
  removeBtn.disabled = coins < 100 || !hasRemovableTile();
  removeBtn.classList.toggle("active", removeMode);
  boardEl.classList.toggle("remove-mode", removeMode);
  soundBtn.classList.toggle("muted", !soundEnabled);
  soundBtn.setAttribute("aria-label", soundEnabled ? "sound on" : "sound off");
}

function showModal(title, body, actionLabel = "확인", onAction = null) {
  modalTitle.textContent = title;
  modalBody.textContent = body;
  modalAction.textContent = actionLabel;
  modalActionHandler = onAction;
  if (!modal.open) modal.showModal();
}

undoBtn.addEventListener("click", () => {
  if (!undoSnapshot || coins < 50) return;
  coins -= 50;
  restoreState(undoSnapshot);
  undoSnapshot = null;
  render();
});

removeBtn.addEventListener("click", () => {
  if (coins < 100 || !hasRemovableTile()) {
    showModal("코인 부족", "블록 제거에는 코인 100개가 필요합니다.");
    return;
  }
  removeMode = !removeMode;
  render();
});

function removeTileFromCell(cell) {
  if (!cell || !removeMode) return;
  const r = Number(cell.dataset.row);
  const c = Number(cell.dataset.col);
  if (!board[r][c]) return;
  undoSnapshot = cloneState();
  board = board.map((row, rowIndex) => row.map((value, colIndex) => (rowIndex === r && colIndex === c ? 0 : value)));
  coins -= 100;
  removeMode = false;
  render();
}

boardEl.addEventListener("click", (event) => {
  if (ignoreNextBoardClick) {
    ignoreNextBoardClick = false;
    return;
  }
  const cell = event.target.closest(".cell");
  removeTileFromCell(cell);
});

restartBtn.addEventListener("click", () => {
  showModal("다시 시작", "현재 보드를 초기화하고 새 게임을 시작합니다.", "다시 시작", () => {
    startGame();
    modal.close();
  });
});

soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  render();
});

document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => move(button.dataset.dir));
});

window.addEventListener("keydown", (event) => {
  const map = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };
  if (map[event.key]) {
    event.preventDefault();
    move(map[event.key]);
  }
});

let touchStart = null;
let pointerStart = null;

function directionFromDelta(dx, dy) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return null;
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
}

function handleDragEnd(start, end) {
  const direction = directionFromDelta(end[0] - start[0], end[1] - start[1]);
  if (direction) move(direction);
}

boardEl.addEventListener("pointerdown", (event) => {
  pointerStart = [event.clientX, event.clientY];
  boardEl.setPointerCapture?.(event.pointerId);
  event.preventDefault();
});

boardEl.addEventListener("pointerup", (event) => {
  if (!pointerStart) return;
  const start = pointerStart;
  pointerStart = null;
  if (removeMode) {
    const dx = event.clientX - start[0];
    const dy = event.clientY - start[1];
    if (!directionFromDelta(dx, dy)) {
      removeTileFromCell(event.target.closest(".cell"));
      ignoreNextBoardClick = true;
    }
  } else {
    handleDragEnd(start, [event.clientX, event.clientY]);
  }
  event.preventDefault();
});

boardEl.addEventListener("pointercancel", () => {
  pointerStart = null;
});

boardEl.addEventListener("touchstart", (event) => {
  if (window.PointerEvent) return;
  const touch = event.changedTouches[0];
  touchStart = [touch.clientX, touch.clientY];
  event.preventDefault();
}, { passive: false });

boardEl.addEventListener("touchend", (event) => {
  if (window.PointerEvent) return;
  if (!touchStart) return;
  const touch = event.changedTouches[0];
  const start = touchStart;
  touchStart = null;
  if (removeMode) {
    const dx = touch.clientX - start[0];
    const dy = touch.clientY - start[1];
    if (!directionFromDelta(dx, dy)) {
      removeTileFromCell(document.elementFromPoint(touch.clientX, touch.clientY)?.closest(".cell"));
    }
  } else {
    handleDragEnd(start, [touch.clientX, touch.clientY]);
  }
  event.preventDefault();
}, { passive: false });

closeModal.addEventListener("click", () => modal.close());
modalAction.addEventListener("click", () => {
  if (modalActionHandler) {
    modalActionHandler();
    modalActionHandler = null;
    return;
  }
  modal.close();
});

startGame();
