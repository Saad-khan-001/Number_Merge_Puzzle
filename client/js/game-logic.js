// Number Merge Puzzle — pure game logic.
// No DOM access here. Every function returns new arrays and never
// mutates its input board, so it can be tested in Node and reused
// in the browser and in a Capacitor app.

function createBoard() {
  return [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];
}

function copyBoard(board) {
  return board.map(function (row) { return row.slice(); });
}

function boardsEqual(a, b) {
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

// Slide one row to the left, merging equal neighbours once.
// e.g. [2,2,2,0] -> [4,2,0,0] (score 4), never [8,0,0,0].
function slideRowLeft(row) {
  var tiles = row.filter(function (v) { return v !== 0; });
  var out = [];
  var score = 0;
  var i = 0;
  while (i < tiles.length) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      var merged = tiles[i] * 2;
      out.push(merged);
      score += merged;
      i += 2; // merged tile cannot merge again this move
    } else {
      out.push(tiles[i]);
      i += 1;
    }
  }
  while (out.length < 4) out.push(0);
  return { row: out, scoreGained: score };
}

function move(board, direction) {
  var safeBoard = Array.isArray(board) && board.length === 4
    ? copyBoard(board)
    : createBoard();
  // Normalise any malformed rows defensively.
  for (var r = 0; r < 4; r++) {
    if (!Array.isArray(safeBoard[r]) || safeBoard[r].length !== 4) {
      safeBoard[r] = [0, 0, 0, 0];
    }
  }

  var newBoard = createBoard();
  var totalScore = 0;

  if (direction === 'left' || direction === 'right') {
    for (var row = 0; row < 4; row++) {
      var line = safeBoard[row].slice();
      if (direction === 'right') line.reverse();
      var slid = slideRowLeft(line);
      var result = slid.row;
      if (direction === 'right') result.reverse();
      newBoard[row] = result;
      totalScore += slid.scoreGained;
    }
  } else if (direction === 'up' || direction === 'down') {
    for (var col = 0; col < 4; col++) {
      var column = [safeBoard[0][col], safeBoard[1][col], safeBoard[2][col], safeBoard[3][col]];
      if (direction === 'down') column.reverse();
      var slidCol = slideRowLeft(column);
      var colResult = slidCol.row;
      if (direction === 'down') colResult.reverse();
      for (var rr = 0; rr < 4; rr++) newBoard[rr][col] = colResult[rr];
      totalScore += slidCol.scoreGained;
    }
  } else {
    // Unknown direction: no change.
    return { board: safeBoard, scoreGained: 0, moved: false };
  }

  return {
    board: newBoard,
    scoreGained: totalScore,
    moved: !boardsEqual(safeBoard, newBoard)
  };
}

function spawnTile(board) {
  var safeBoard = Array.isArray(board) && board.length === 4
    ? copyBoard(board)
    : createBoard();
  var empty = [];
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      if (safeBoard[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return safeBoard;
  var pick = empty[Math.floor(Math.random() * empty.length)];
  safeBoard[pick[0]][pick[1]] = Math.random() < 0.9 ? 2 : 4;
  return safeBoard;
}

function canMove(board) {
  if (!Array.isArray(board) || board.length !== 4) return false;
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < 4 && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < 4 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

function hasWon(board) {
  if (!Array.isArray(board)) return false;
  for (var r = 0; r < board.length; r++) {
    if (!Array.isArray(board[r])) continue;
    for (var c = 0; c < board[r].length; c++) {
      if (board[r][c] >= 2048) return true;
    }
  }
  return false;
}

function isGameOver(board) {
  return !canMove(board);
}

const api = { createBoard, move, spawnTile, canMove, hasWon, isGameOver };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.NumberMerge = api;
