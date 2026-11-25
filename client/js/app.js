// Number Merge Puzzle — UI wiring.
// Uses window.NumberMerge from js/game-logic.js. Plain script, no modules.
// Defensive: never crashes on bad input or a missing logic object.

(function () {
  'use strict';

  var BEST_KEY = 'nmp-best-score';
  var WIN_VALUE = 2048;

  var NM = (typeof window !== 'undefined' && window.NumberMerge) || null;

  // --- State ---
  var board = null;
  var score = 0;
  var moves = 0;
  var best = 0;
  var previous = null; // { board, score, moves } for one-step Undo
  var winShown = false;

  // --- Elements (looked up once; missing elements are tolerated) ---
  function el(id) { return document.getElementById(id); }
  var gridEl = el('grid');
  var scoreEl = el('score');
  var bestEl = el('best-score');
  var movesEl = el('move-count');
  var undoBtn = el('undo-btn');
  var newGameBtn = el('new-game-btn');
  var winOverlay = el('win-overlay');
  var gameOverOverlay = el('game-over-overlay');
  var winScoreEl = el('win-score');
  var gameOverScoreEl = el('game-over-score');
  var keepPlayingBtn = el('keep-playing-btn');
  var winNewGameBtn = el('win-new-game-btn');
  var tryAgainBtn = el('try-again-btn');

  function loadBest() {
    try {
      var raw = window.localStorage ? window.localStorage.getItem(BEST_KEY) : null;
      var n = parseInt(raw, 10);
      best = isNaN(n) || n < 0 ? 0 : n;
    } catch (e) {
      best = 0; // localStorage unavailable (e.g. private mode) — play on.
    }
  }

  function saveBest() {
    try {
      if (window.localStorage) window.localStorage.setItem(BEST_KEY, String(best));
    } catch (e) { /* ignore storage failures */ }
  }

  function updateBestIfNeeded() {
    if (score > best) {
      best = score;
      saveBest();
    }
  }

  function show(overlay) { if (overlay) overlay.classList.remove('hidden'); }
  function hide(overlay) { if (overlay) overlay.classList.add('hidden'); }

  function tileClass(value) {
    if (value <= 0) return 'cell';
    if (value <= 2048) return 'cell tile tile-' + value;
    return 'cell tile tile-super';
  }

  function render() {
    if (!gridEl || !board) return;
    gridEl.innerHTML = '';
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 4; c++) {
        var value = (board[r] && board[r][c]) || 0;
        var cell = document.createElement('div');
        cell.className = tileClass(value);
        cell.textContent = value > 0 ? String(value) : '';
        cell.setAttribute('role', 'gridcell');
        gridEl.appendChild(cell);
      }
    }
    if (scoreEl) scoreEl.textContent = String(score);
    if (bestEl) bestEl.textContent = String(best);
    if (movesEl) movesEl.textContent = String(moves);
    if (undoBtn) undoBtn.disabled = !previous;
  }

  function newGame() {
    if (!NM) return;
    try {
      board = NM.spawnTile(NM.spawnTile(NM.createBoard()));
    } catch (e) {
      board = NM.createBoard();
    }
    score = 0;
    moves = 0;
    previous = null;
    winShown = false;
    hide(winOverlay);
    hide(gameOverOverlay);
    render();
  }

  function doMove(direction) {
    if (!NM || !board) return;
    if (direction !== 'left' && direction !== 'right' &&
        direction !== 'up' && direction !== 'down') return;
    var result;
    try {
      result = NM.move(board, direction);
    } catch (e) {
      return; // bad input must never crash the UI
    }
    if (!result || !result.moved) return;

    // Save one-step Undo state before changing the board.
    previous = {
      board: board.map(function (row) { return row.slice(); }),
      score: score,
      moves: moves
    };

    try {
      board = NM.spawnTile(result.board);
    } catch (e) {
      board = result.board;
    }
    score += result.scoreGained || 0;
    moves += 1;
    updateBestIfNeeded();
    render();

    try {
      if (!winShown && NM.hasWon(board)) {
        winShown = true;
        if (winScoreEl) winScoreEl.textContent = String(score);
        show(winOverlay);
        return;
      }
      if (NM.isGameOver(board)) {
        if (gameOverScoreEl) gameOverScoreEl.textContent = String(score);
        show(gameOverOverlay);
      }
    } catch (e) { /* overlay checks must not break the game */ }
  }

  function undo() {
    if (!previous || !board) return;
    board = previous.board.map(function (row) { return row.slice(); });
    score = previous.score;
    moves = previous.moves;
    previous = null; // one-step only: disabled until the next move
    hide(winOverlay);
    hide(gameOverOverlay);
    render();
  }

  // --- Wire up controls ---
  if (newGameBtn) newGameBtn.addEventListener('click', newGame);
  if (undoBtn) undoBtn.addEventListener('click', undo);
  if (tryAgainBtn) tryAgainBtn.addEventListener('click', newGame);
  if (winNewGameBtn) winNewGameBtn.addEventListener('click', newGame);
  if (keepPlayingBtn) {
    keepPlayingBtn.addEventListener('click', function () { hide(winOverlay); });
  }

  // On-screen arrow buttons.
  var dpadButtons = document.querySelectorAll('.dpad-btn[data-direction]');
  for (var i = 0; i < dpadButtons.length; i++) {
    dpadButtons[i].addEventListener('click', function () {
      doMove(this.getAttribute('data-direction'));
    });
  }

  // Keyboard: arrows + WASD.
  document.addEventListener('keydown', function (event) {
    if (!event || !event.key) return;
    var key = event.key.toLowerCase();
    var dir = null;
    if (key === 'arrowup' || key === 'w') dir = 'up';
    else if (key === 'arrowdown' || key === 's') dir = 'down';
    else if (key === 'arrowleft' || key === 'a') dir = 'left';
    else if (key === 'arrowright' || key === 'd') dir = 'right';
    if (dir) {
      event.preventDefault();
      doMove(dir);
    }
  });

  // Touch swipe on the grid.
  var touchStartX = null;
  var touchStartY = null;
  if (gridEl) {
    gridEl.addEventListener('touchstart', function (event) {
      if (!event.touches || !event.touches[0]) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    gridEl.addEventListener('touchend', function (event) {
      if (touchStartX === null || touchStartY === null) return;
      if (!event.changedTouches || !event.changedTouches[0]) return;
      var dx = event.changedTouches[0].clientX - touchStartX;
      var dy = event.changedTouches[0].clientY - touchStartY;
      touchStartX = null;
      touchStartY = null;
      var minSwipe = 24;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < minSwipe) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        doMove(dx > 0 ? 'right' : 'left');
      } else {
        doMove(dy > 0 ? 'down' : 'up');
      }
    }, { passive: true });
  }

  // --- Start ---
  loadBest();
  if (NM) {
    newGame();
  } else if (gridEl) {
    gridEl.textContent = 'Game could not load. Please reload the page.';
  }
})();
