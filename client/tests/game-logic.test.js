// Tests for client/js/game-logic.js — node:test + node:assert/strict.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  createBoard,
  move,
  spawnTile,
  canMove,
  hasWon,
  isGameOver
} = require('../js/game-logic.js');

describe('createBoard', () => {
  it('returns a 4x4 board of all zeros', () => {
    const board = createBoard();
    assert.equal(board.length, 4);
    for (const row of board) {
      assert.equal(row.length, 4);
      assert.deepEqual(row, [0, 0, 0, 0]);
    }
  });
});

describe('move', () => {
  it('move left merges [2,2,0,0] into [4,0,0,0] with score 4', () => {
    const board = createBoard();
    board[0] = [2, 2, 0, 0];
    const result = move(board, 'left');
    assert.deepEqual(result.board[0], [4, 0, 0, 0]);
    assert.equal(result.scoreGained, 4);
    assert.equal(result.moved, true);
  });

  it('move right merges correctly', () => {
    const board = createBoard();
    board[0] = [0, 0, 2, 2];
    const result = move(board, 'right');
    assert.deepEqual(result.board[0], [0, 0, 0, 4]);
    assert.equal(result.scoreGained, 4);
    assert.equal(result.moved, true);
  });

  it('move right slides without merging when tiles differ', () => {
    const board = createBoard();
    board[0] = [2, 0, 0, 4];
    const result = move(board, 'right');
    assert.deepEqual(result.board[0], [0, 0, 2, 4]);
    assert.equal(result.scoreGained, 0);
    assert.equal(result.moved, true);
  });

  it('move up merges a column', () => {
    const board = createBoard();
    board[0][0] = 2;
    board[1][0] = 2;
    const result = move(board, 'up');
    assert.equal(result.board[0][0], 4);
    assert.equal(result.board[1][0], 0);
    assert.equal(result.scoreGained, 4);
    assert.equal(result.moved, true);
  });

  it('move down merges a column', () => {
    const board = createBoard();
    board[2][1] = 2;
    board[3][1] = 2;
    const result = move(board, 'down');
    assert.equal(result.board[3][1], 4);
    assert.equal(result.board[2][1], 0);
    assert.equal(result.scoreGained, 4);
    assert.equal(result.moved, true);
  });

  it('does NOT double-merge in one move: [2,2,2,0] left becomes [4,2,0,0] with score 4', () => {
    const board = createBoard();
    board[0] = [2, 2, 2, 0];
    const result = move(board, 'left');
    assert.deepEqual(result.board[0], [4, 2, 0, 0]);
    assert.equal(result.scoreGained, 4);
  });

  it('does NOT double-merge [4,4,8,0] left into [16,0,0,0]', () => {
    const board = createBoard();
    board[0] = [4, 4, 8, 0];
    const result = move(board, 'left');
    assert.deepEqual(result.board[0], [8, 8, 0, 0]);
    assert.equal(result.scoreGained, 8);
  });

  it('a move that changes nothing returns moved=false', () => {
    const board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64]
    ];
    const result = move(board, 'left');
    assert.equal(result.moved, false);
    assert.equal(result.scoreGained, 0);
    assert.deepEqual(result.board, board);
  });

  it('does not mutate its input board', () => {
    const board = createBoard();
    board[0] = [2, 2, 4, 0];
    board[1] = [0, 2, 0, 0];
    const before = JSON.parse(JSON.stringify(board));
    move(board, 'left');
    move(board, 'up');
    assert.deepEqual(board, before);
  });
});

describe('spawnTile', () => {
  it('adds exactly one tile of value 2 or 4 to an empty cell', () => {
    const board = createBoard();
    board[0][0] = 2;
    const result = spawnTile(board);
    let filled = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (result[r][c] !== 0) filled++;
        assert.ok(result[r][c] === 0 || result[r][c] === 2 || result[r][c] === 4);
      }
    }
    assert.equal(filled, 2); // original tile + exactly one new tile
    assert.equal(result[0][0], 2);
  });

  it('does not mutate the input board', () => {
    const board = createBoard();
    const before = JSON.parse(JSON.stringify(board));
    spawnTile(board);
    assert.deepEqual(board, before);
  });

  it('returns a copy unchanged when there is no empty cell', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2]
    ];
    const result = spawnTile(board);
    assert.deepEqual(result, board);
    assert.notEqual(result, board); // a copy, not the same reference
  });
});

describe('canMove / isGameOver / hasWon', () => {
  it('canMove is false on a full board with no equal neighbours', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2]
    ];
    assert.equal(canMove(board), false);
  });

  it('canMove is true when an equal pair is adjacent', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 4]
    ];
    assert.equal(canMove(board), true);
  });

  it('isGameOver is true on a full board with no equal neighbours', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2]
    ];
    assert.equal(isGameOver(board), true);
  });

  it('isGameOver is false on a board with an empty cell', () => {
    const board = createBoard();
    board[0][0] = 2;
    assert.equal(isGameOver(board), false);
    assert.equal(canMove(board), true);
  });

  it('hasWon is true with a 2048 tile and false without', () => {
    const winning = createBoard();
    winning[1][2] = 2048;
    assert.equal(hasWon(winning), true);

    const notWinning = createBoard();
    notWinning[1][2] = 1024;
    assert.equal(hasWon(notWinning), false);

    assert.equal(hasWon(createBoard()), false);
  });
});
