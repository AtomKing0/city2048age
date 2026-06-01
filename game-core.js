const BOARD_SIZE = 4;

function createEmptyBoard(size = BOARD_SIZE) {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function compressLine(line) {
  const input = line.filter(Boolean);
  const output = [];
  let gained = 0;

  for (let i = 0; i < input.length; i += 1) {
    if (input[i] === input[i + 1]) {
      const merged = input[i] * 2;
      output.push(merged);
      gained += merged;
      i += 1;
    } else {
      output.push(input[i]);
    }
  }

  while (output.length < line.length) output.push(0);
  return { line: output, gained };
}

function moveBoard(board, direction) {
  const size = board.length;
  const nextBoard = cloneBoard(board);
  let gained = 0;

  if (direction === "left" || direction === "right") {
    for (let r = 0; r < size; r += 1) {
      const source = direction === "right" ? [...nextBoard[r]].reverse() : [...nextBoard[r]];
      const result = compressLine(source);
      gained += result.gained;
      nextBoard[r] = direction === "right" ? result.line.reverse() : result.line;
    }
  } else {
    for (let c = 0; c < size; c += 1) {
      const column = [];
      for (let r = 0; r < size; r += 1) column.push(nextBoard[r][c]);
      const source = direction === "down" ? column.reverse() : column;
      const result = compressLine(source);
      gained += result.gained;
      const next = direction === "down" ? result.line.reverse() : result.line;
      for (let r = 0; r < size; r += 1) nextBoard[r][c] = next[r];
    }
  }

  const changed = JSON.stringify(board) !== JSON.stringify(nextBoard);
  return { board: nextBoard, gained, changed };
}

function availableCells(board) {
  const cells = [];
  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board[r].length; c += 1) {
      if (!board[r][c]) cells.push([r, c]);
    }
  }
  return cells;
}

function canMoveBoard(board) {
  if (availableCells(board).length) return true;
  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board[r].length; c += 1) {
      if (board[r][c] === board[r + 1]?.[c] || board[r][c] === board[r][c + 1]) return true;
    }
  }
  return false;
}

if (typeof module !== "undefined") {
  module.exports = {
    BOARD_SIZE,
    createEmptyBoard,
    cloneBoard,
    compressLine,
    moveBoard,
    availableCells,
    canMoveBoard,
  };
}
