const assert = require("node:assert/strict");
const {
  compressLine,
  moveBoard,
  canMoveBoard,
  availableCells,
} = require("./game-core");

assert.deepEqual(compressLine([2, 2, 0, 0]), { line: [4, 0, 0, 0], gained: 4 });
assert.deepEqual(compressLine([2, 2, 2, 2]), { line: [4, 4, 0, 0], gained: 8 });
assert.deepEqual(compressLine([2, 0, 2, 4]), { line: [4, 4, 0, 0], gained: 4 });

let result = moveBoard([
  [2, 2, 0, 0],
  [4, 0, 4, 0],
  [2, 4, 8, 16],
  [0, 0, 0, 0],
], "left");

assert.equal(result.changed, true);
assert.equal(result.gained, 12);
assert.deepEqual(result.board, [
  [4, 0, 0, 0],
  [8, 0, 0, 0],
  [2, 4, 8, 16],
  [0, 0, 0, 0],
]);

result = moveBoard([
  [2, 0, 0, 0],
  [2, 0, 0, 0],
  [4, 0, 0, 0],
  [4, 0, 0, 0],
], "down");

assert.equal(result.changed, true);
assert.equal(result.gained, 12);
assert.deepEqual(result.board, [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [4, 0, 0, 0],
  [8, 0, 0, 0],
]);

assert.equal(canMoveBoard([
  [2, 4, 2, 4],
  [4, 2, 4, 2],
  [2, 4, 2, 4],
  [4, 2, 4, 2],
]), false);

assert.equal(canMoveBoard([
  [2, 4, 2, 4],
  [4, 2, 4, 2],
  [2, 4, 2, 4],
  [4, 2, 4, 4],
]), true);

assert.equal(availableCells([
  [2, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 4],
]).length, 14);

console.log("game-core tests passed");
