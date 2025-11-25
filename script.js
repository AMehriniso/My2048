(function () {
    'use strict';

    const SIZE = 4;
    const GAME_STATE_KEY = 'gameState2048';
    const LEADERBOARD_KEY = 'leaderboard2048';

    let board = [];
    let score = 0;
    let bestScore = 0;
    let gameOver = false;
    let undoStack = [];

    const gridContainer = document.getElementById('grid-container');
    const uiContainer = document.getElementById('ui-container');
    const gameContainer = document.getElementById('game-container');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const overlayContent = document.getElementById('overlay-content');
    const mobileControls = document.getElementById('mobile-controls');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const leaderboardContent = document.getElementById('leaderboard-content');

    let scoreEl;
    let bestScoreEl;
    let newGameBtn;
    let undoBtn;
    let showLeaderboardBtn;

    let gameOverMessage;
    let nameInputBlock;
    let playerNameInput;
    let saveScoreBtn;
    let saveResultMessage;
    let restartBtn;

    let leaderboardBody;
    let closeLeaderboardBtn;

    initGame();

    function initGame() {
        buildStaticUI();
        createGridCells();
        loadLeaderboard();
        loadGameStateOrStartNew();
        attachEventListeners();
        renderBoard();
        updateScoreUI();
        updateUndoButton();
        updateControlsVisibility();
    }


    function buildStaticUI() {
        clearElement(uiContainer);
        clearElement(overlayContent);
        clearElement(mobileControls);
        clearElement(leaderboardContent);

        const topRow = document.createElement('div');
        topRow.classList.add('top-row');

        const scoresWrapper = document.createElement('div');
        scoresWrapper.classList.add('scores');

        const scoreBox = document.createElement('div');
        scoreBox.classList.add('score-box');
        const scoreLabel = document.createElement('span');
        scoreLabel.classList.add('score-label');
        scoreLabel.textContent = 'Счёт';
        scoreEl = document.createElement('span');
        scoreEl.classList.add('score-value');
        scoreEl.id = 'score';
        scoreEl.textContent = '0';
        scoreBox.appendChild(scoreLabel);
        scoreBox.appendChild(scoreEl);

        const bestBox = document.createElement('div');
        bestBox.classList.add('score-box');
        const bestLabel = document.createElement('span');
        bestLabel.classList.add('score-label');
        bestLabel.textContent = 'Рекорд';
        bestScoreEl = document.createElement('span');
        bestScoreEl.classList.add('score-value');
        bestScoreEl.id = 'best-score';
        bestScoreEl.textContent = '0';
        bestBox.appendChild(bestLabel);
        bestBox.appendChild(bestScoreEl);

        scoresWrapper.appendChild(scoreBox);
        scoresWrapper.appendChild(bestBox);

        const buttonsWrapper = document.createElement('div');
        buttonsWrapper.classList.add('top-buttons');

        newGameBtn = createButton('Новая игра', 'new-game', ['btn']);
        undoBtn = createButton('Отмена', 'undo-move', ['btn']);
        showLeaderboardBtn = createButton('Лидеры', 'show-leaderboard', ['btn']);

        buttonsWrapper.appendChild(newGameBtn);
        buttonsWrapper.appendChild(undoBtn);
        buttonsWrapper.appendChild(showLeaderboardBtn);

        topRow.appendChild(scoresWrapper);
        topRow.appendChild(buttonsWrapper);

        uiContainer.appendChild(topRow);

        gameOverMessage = document.createElement('p');
        gameOverMessage.id = 'game-over-message';

        nameInputBlock = document.createElement('div');
        nameInputBlock.id = 'name-input-block';

        const nameLabel = document.createElement('label');
        nameLabel.classList.add('name-label');
        nameLabel.textContent = 'Ваше имя:';

        playerNameInput = document.createElement('input');
        playerNameInput.id = 'player-name';
        playerNameInput.type = 'text';
        playerNameInput.maxLength = 20;
        playerNameInput.setAttribute('autocomplete', 'off');

        nameLabel.appendChild(playerNameInput);
        nameInputBlock.appendChild(nameLabel);

        saveScoreBtn = createButton('Сохранить результат', 'save-score-btn', ['btn']);
        nameInputBlock.appendChild(saveScoreBtn);

        saveResultMessage = document.createElement('p');
        saveResultMessage.id = 'save-result-message';
        saveResultMessage.classList.add('hidden');

        restartBtn = createButton('Начать заново', 'restart-btn', ['btn', 'btn-primary']);

        overlayContent.appendChild(gameOverMessage);
        overlayContent.appendChild(nameInputBlock);
        overlayContent.appendChild(saveResultMessage);
        overlayContent.appendChild(restartBtn);

        const rowUp = document.createElement('div');
        rowUp.classList.add('mobile-controls-row');
        const rowMiddle = document.createElement('div');
        rowMiddle.classList.add('mobile-controls-row');

        const btnUp = createControlButton('↑', 'up');
        const btnLeft = createControlButton('←', 'left');
        const btnDown = createControlButton('↓', 'down');
        const btnRight = createControlButton('→', 'right');

        rowUp.appendChild(btnUp);
        rowMiddle.appendChild(btnLeft);
        rowMiddle.appendChild(btnDown);
        rowMiddle.appendChild(btnRight);

        mobileControls.appendChild(rowUp);
        mobileControls.appendChild(rowMiddle);

        const lbTitle = document.createElement('h2');
        lbTitle.textContent = 'Таблица лидеров';

        const table = document.createElement('table');
        table.classList.add('leaders-table');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['#', 'Имя', 'Очки', 'Дата'];
        for (let i = 0; i < headers.length; i++) {
            const th = document.createElement('th');
            th.textContent = headers[i];
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);

        leaderboardBody = document.createElement('tbody');
        leaderboardBody.id = 'leaderboard-body';

        table.appendChild(thead);
        table.appendChild(leaderboardBody);

        closeLeaderboardBtn = createButton('Закрыть', 'close-leaderboard', ['btn']);

        leaderboardContent.appendChild(lbTitle);
        leaderboardContent.appendChild(table);
        leaderboardContent.appendChild(closeLeaderboardBtn);
    }

    function createGridCells() {
        clearElement(gridContainer);

        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = String(row);
                cell.dataset.col = String(col);
                gridContainer.appendChild(cell);
            }
        }
    }

    function createEmptyBoard() {
        const b = [];
        for (let i = 0; i < SIZE; i++) {
            const row = [];
            for (let j = 0; j < SIZE; j++) {
                row.push(0);
            }
            b.push(row);
        }
        return b;
    }

    function loadGameStateOrStartNew() {
        const raw = window.localStorage.getItem(GAME_STATE_KEY);
        if (raw) {
            try {
                const saved = JSON.parse(raw);
                if (saved && Array.isArray(saved.board) && saved.board.length === SIZE) {
                    board = saved.board;
                    score = saved.score || 0;
                    gameOver = !!saved.gameOver;

                    undoStack = [];
                    if (saved.lastUndo &&
                        Array.isArray(saved.lastUndo.board) &&
                        saved.lastUndo.board.length === SIZE) {
                        undoStack.push({
                            board: saved.lastUndo.board,
                            score: saved.lastUndo.score || 0
                        });
                    }

                    if (gameOver) {
                        showGameOverOverlay(false);
                    }
                    return;
                }
            } catch (e) {
            }
        }
        startNewGame();
    }

    function startNewGame() {
        board = createEmptyBoard();
        score = 0;
        gameOver = false;
        undoStack = [];

        hideGameOverOverlay();

        addRandomTiles(randomInt(1, 3));
        saveGameState();
        renderBoard();
        updateScoreUI();
        updateUndoButton();
        updateControlsVisibility();
    }

    function renderBoard(popPositions) {
        const children = gridContainer.children;
        for (let i = 0; i < children.length; i++) {
            const cell = children[i];
            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);
            const value = board[row][col];

            cell.classList.remove(
                'tile-0', 'tile-2', 'tile-4', 'tile-8', 'tile-16', 'tile-32',
                'tile-64', 'tile-128', 'tile-256', 'tile-512', 'tile-1024', 'tile-2048', 'pop'
            );

            const tileClass = 'tile-' + (value || 0);
            cell.classList.add(tileClass);

            cell.textContent = value ? String(value) : '';

            if (popPositions && containsPosition(popPositions, row, col) && value) {
                cell.classList.add('pop');
            }
        }
    }

    function containsPosition(list, row, col) {
        if (!list) return false;
        for (let i = 0; i < list.length; i++) {
            const p = list[i];
            if (p.row === row && p.col === col) return true;
        }
        return false;
    }

    function updateScoreUI() {
        if (scoreEl) {
            scoreEl.textContent = String(score);
        }
        if (bestScoreEl) {
            bestScoreEl.textContent = String(bestScore);
        }
    }

    function updateUndoButton() {
        if (!undoBtn) return;
        if (gameOver || undoStack.length === 0) {
            undoBtn.disabled = true;
        } else {
            undoBtn.disabled = false;
        }
    }

    function updateControlsVisibility() {
        const overlayVisible = !gameOverOverlay.classList.contains('hidden');
        const leaderboardVisible = !leaderboardModal.classList.contains('hidden');

        if (overlayVisible || leaderboardVisible) {
            if (!mobileControls.classList.contains('hidden')) {
                mobileControls.classList.add('hidden');
            }
        } else {
            mobileControls.classList.remove('hidden');
        }
    }

    function handleMove(direction) {
        if (gameOver) return;

        const prevBoard = cloneBoard(board);
        const prevScore = score;

        const moveResult = move(direction);
        if (!moveResult.moved) {
            return;
        }

        undoStack.push({
            board: prevBoard,
            score: prevScore
        });
        if (undoStack.length > 20) {
            undoStack.shift();
        }

        const newTilesCount = randomInt(1, 2);
        const newTilePositions = addRandomTiles(newTilesCount);

        if (!hasMoves()) {
            gameOver = true;
            showGameOverOverlay(true);
        }

        saveGameState();
        renderBoard(newTilePositions);
        updateScoreUI();
        updateUndoButton();
        updateControlsVisibility();
    }

    function move(direction) {
        let moved = false;
        let gainedTotal = 0;

        if (direction === 'left' || direction === 'right') {
            for (let row = 0; row < SIZE; row++) {
                let line = board[row].slice();
                if (direction === 'right') {
                    line.reverse();
                }

                const result = mergeLineCascading(line);
                let newLine = result.newLine;
                gainedTotal += result.gained;
                if (direction === 'right') {
                    newLine = newLine.slice().reverse();
                }

                if (!arraysEqual(board[row], newLine)) {
                    board[row] = newLine;
                    moved = true;
                }
            }
        } else if (direction === 'up' || direction === 'down') {
            for (let col = 0; col < SIZE; col++) {
                const line = [];
                for (let row = 0; row < SIZE; row++) {
                    line.push(board[row][col]);
                }

                if (direction === 'down') {
                    line.reverse();
                }

                const result = mergeLineCascading(line);
                let newLine = result.newLine;
                gainedTotal += result.gained;
                if (direction === 'down') {
                    newLine = newLine.slice().reverse();
                }

                for (let row = 0; row < SIZE; row++) {
                    if (board[row][col] !== newLine[row]) {
                        board[row][col] = newLine[row];
                        moved = true;
                    }
                }
            }
        }

        score += gainedTotal;
        return { moved: moved, gained: gainedTotal };
    }

    function mergeLineCascading(originalLine) {
        let line = originalLine.slice();
        let gained = 0;
        let moved = false;

        function compress(arr) {
            const filtered = [];
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] !== 0) filtered.push(arr[i]);
            }
            while (filtered.length < SIZE) {
                filtered.push(0);
            }
            return filtered;
        }

        let compressed = compress(line);
        if (!arraysEqual(compressed, line)) {
            moved = true;
            line = compressed;
        }

        let mergedInPass;
        do {
            mergedInPass = false;
            for (let i = 0; i < SIZE - 1; i++) {
                if (line[i] !== 0 && line[i] === line[i + 1]) {
                    line[i] = line[i] * 2;
                    line[i + 1] = 0;
                    gained += line[i];
                    mergedInPass = true;
                    moved = true;
                }
            }
            if (mergedInPass) {
                const newCompressed = compress(line);
                if (!arraysEqual(newCompressed, line)) {
                    moved = true;
                    line = newCompressed;
                }
            }
        } while (mergedInPass);

        return { newLine: line, gained: gained, moved: moved };
    }

    function addRandomTiles(count) {
        const emptyCells = [];
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                if (board[row][col] === 0) {
                    emptyCells.push({ row: row, col: col });
                }
            }
        }

        const positions = [];
        const maxTiles = Math.min(count, emptyCells.length);

        for (let i = 0; i < maxTiles; i++) {
            if (emptyCells.length === 0) break;
            const idx = randomInt(0, emptyCells.length - 1);
            const cell = emptyCells[idx];

            const value = Math.random() < 0.9 ? 2 : 4;
            board[cell.row][cell.col] = value;
            positions.push({ row: cell.row, col: cell.col });

            emptyCells.splice(idx, 1);
        }

        return positions;
    }

    function hasMoves() {
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                if (board[row][col] === 0) return true;
            }
        }
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const value = board[row][col];
                if (row + 1 < SIZE && board[row + 1][col] === value) return true;
                if (col + 1 < SIZE && board[row][col + 1] === value) return true;
            }
        }
        return false;
    }

    function undoMove() {
        if (gameOver) return;
        if (undoStack.length === 0) return;

        const last = undoStack.pop();
        board = cloneBoard(last.board);
        score = last.score;

        saveGameState();
        renderBoard();
        updateScoreUI();
        updateUndoButton();
    }

    function saveGameState() {
        const lastUndo = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;

        const state = {
            board: board,
            score: score,
            gameOver: gameOver,
            lastUndo: lastUndo
        };

        try {
            window.localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
        } catch (e) {
        }
    }

    function loadLeaderboard() {
        let list = [];
        const raw = window.localStorage.getItem(LEADERBOARD_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    list = parsed;
                }
            } catch (e) {
            }
        }

        list.sort(function (a, b) {
            return (b.score || 0) - (a.score || 0);
        });

        bestScore = 0;
        for (let i = 0; i < list.length; i++) {
            if (typeof list[i].score === 'number' && list[i].score > bestScore) {
                bestScore = list[i].score;
            }
        }

        renderLeaderboard(list);
        updateScoreUI();
    }

    function saveLeaderboard(list) {
        try {
            window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list));
        } catch (e) {
        }
    }

    function addRecordToLeaderboard(name, recordScore) {
        let list = [];
        const raw = window.localStorage.getItem(LEADERBOARD_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) list = parsed;
            } catch (e) {
            }
        }

        const now = new Date();
        const record = {
            name: name || 'Безымянный',
            score: recordScore,
            date: now.toLocaleString()
        };

        list.push(record);
        list.sort(function (a, b) {
            return (b.score || 0) - (a.score || 0);
        });

        if (list.length > 10) {
            list.length = 10;
        }

        saveLeaderboard(list);
        renderLeaderboard(list);

        if (recordScore > bestScore) {
            bestScore = recordScore;
            updateScoreUI();
        }
    }

    function renderLeaderboard(list) {
        if (!leaderboardBody) return;

        clearElement(leaderboardBody);

        if (!list || list.length === 0) {
            const emptyRow = document.createElement("tr");
            const emptyCell = document.createElement("td");
    
            emptyCell.colSpan = 4;
            emptyCell.textContent = "Пока нет сохранённых рекордов";
            emptyCell.classList.add("leaders-empty"); 
    
            emptyRow.appendChild(emptyCell);
            leaderboardBody.appendChild(emptyRow);
            return;
        }
        
        for (let i = 0; i < list.length; i++) {
            const item = list[i];

            const tr = document.createElement('tr');

            const tdIdx = document.createElement('td');
            tdIdx.textContent = String(i + 1);
            tr.appendChild(tdIdx);

            const tdName = document.createElement('td');
            tdName.textContent = item.name || '';
            tr.appendChild(tdName);

            const tdScore = document.createElement('td');
            tdScore.textContent = String(item.score || 0);
            tr.appendChild(tdScore);

            const tdDate = document.createElement('td');
            tdDate.textContent = item.date || '';
            tr.appendChild(tdDate);

            leaderboardBody.appendChild(tr);
        }
    }

    function showGameOverOverlay(allowSave) {
        gameOverOverlay.classList.remove('hidden');
        saveResultMessage.classList.add('hidden');
        saveResultMessage.textContent = '';
        playerNameInput.value = '';

        if (allowSave) {
            nameInputBlock.classList.remove('hidden');
            gameOverMessage.textContent = 'Игра окончена! Введите имя, чтобы сохранить результат.';
        } else {
            nameInputBlock.classList.add('hidden');
            gameOverMessage.textContent = 'Игра окончена.';
        }

        updateControlsVisibility();
    }

    function hideGameOverOverlay() {
        if (!gameOverOverlay.classList.contains('hidden')) {
            gameOverOverlay.classList.add('hidden');
        }
        updateControlsVisibility();
    }

    function attachEventListeners() {
        document.addEventListener('keydown', function (e) {
            const key = e.key;
            if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
                e.preventDefault();
                if (key === 'ArrowLeft') handleMove('left');
                if (key === 'ArrowRight') handleMove('right');
                if (key === 'ArrowUp') handleMove('up');
                if (key === 'ArrowDown') handleMove('down');
            }
        });

        mobileControls.addEventListener('click', function (e) {
            const target = e.target;
            if (!target || !target.dataset) return;
            const dir = target.dataset.dir;
            if (!dir) return;
            handleMove(dir);
        });

        newGameBtn.addEventListener('click', function () {
            startNewGame();
        });

        undoBtn.addEventListener('click', function () {
            undoMove();
        });

        showLeaderboardBtn.addEventListener('click', function () {
            leaderboardModal.classList.remove('hidden');
            updateControlsVisibility();
        });

        closeLeaderboardBtn.addEventListener('click', function () {
            leaderboardModal.classList.add('hidden');
            updateControlsVisibility();
        });

        saveScoreBtn.addEventListener('click', function () {
            if (!gameOver) return;

            const name = playerNameInput.value.trim();
            addRecordToLeaderboard(name, score);

            nameInputBlock.classList.add('hidden');

            gameOverMessage.textContent = 'Игра окончена!';
            saveResultMessage.textContent = 'Ваш рекорд сохранён!';
            saveResultMessage.classList.remove('hidden');
        });

        restartBtn.addEventListener('click', function () {
            startNewGame();
        });
    }

    function cloneBoard(b) {
        const result = [];
        for (let i = 0; i < b.length; i++) {
            result.push(b[i].slice());
        }
        return result;
    }

    function arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    function createButton(text, id, classNames) {
        const btn = document.createElement('button');
        btn.textContent = text;
        if (id) {
            btn.id = id;
        }
        if (classNames && classNames.length) {
            for (let i = 0; i < classNames.length; i++) {
                btn.classList.add(classNames[i]);
            }
        }
        return btn;
    }

    function createControlButton(text, dir) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.classList.add('control-btn');
        btn.dataset.dir = dir;
        return btn;
    }

})();

