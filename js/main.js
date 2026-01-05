// ============================================
// VARIABLES GLOBALES
// ============================================
var board = null;
var game = new Chess();
var playerColor = 'white';
var difficulty = 3;
var gameInProgress = true;
var lastMove = { from: null, to: null };
var moveHistory = [];
var capturedPieces = { white: [], black: [] };
var soundEnabled = true;

// Reloj de ajedrez
var whiteTime = 600; // segundos
var blackTime = 600;
var clockInterval = null;
var activePlayer = 'white';

// ============================================
// VALORES DE LAS PIEZAS
// ============================================
var pieceValues = {
    'p': 100, 'n': 320, 'b': 330,
    'r': 500, 'q': 900, 'k': 20000
};

var pawnTable = [
    0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 25, 25, 10,  5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-20,-20, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
];

var knightTable = [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
];

// ============================================
// SÍMBOLOS UNICODE DE PIEZAS
// ============================================
var pieceSymbols = {
    'wP': '♙', 'wN': '♘', 'wB': '♗', 'wR': '♖', 'wQ': '♕', 'wK': '♔',
    'bP': '♟', 'bN': '♞', 'bB': '♝', 'bR': '♜', 'bQ': '♛', 'bK': '♚'
};

// ============================================
// SISTEMA DE SONIDOS
// ============================================
var sounds = {
    move: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAAA='),
    capture: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAAA='),
    check: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAAA='),
    gameOver: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAAA=')
};

function playSound(type) {
    if (soundEnabled && sounds[type]) {
        sounds[type].currentTime = 0;
        sounds[type].play().catch(e => console.log('Audio playback failed'));
    }
}

// ============================================
// CONFIGURACIÓN DEL TABLERO
// ============================================
var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

function onDragStart(source, piece, position, orientation) {
    if (game.game_over() || !gameInProgress) return false;

    if ((playerColor === 'white' && piece.search(/^b/) !== -1) ||
        (playerColor === 'black' && piece.search(/^w/) !== -1)) {
        return false;
    }

    if ((game.turn() === 'w' && playerColor !== 'white') ||
        (game.turn() === 'b' && playerColor !== 'black')) {
        return false;
    }
}

function onDrop(source, target) {
    removeHighlights();

    var capturedPiece = game.get(target);
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    // Guardar movimiento en historial
    moveHistory.push({
        san: move.san,
        from: move.from,
        to: move.to,
        fen: game.fen()
    });

    // Registrar pieza capturada
    if (move.captured) {
        var color = move.color === 'w' ? 'black' : 'white';
        capturedPieces[color].push(move.captured);
        updateCapturedPieces();
        playSound('capture');
    } else {
        playSound('move');
    }

    lastMove = { from: source, to: target };
    highlightSquare(source);
    highlightSquare(target);

    updateMoveHistory();
    updateStatistics();
    updateStatus();

    if (game.in_check()) {
        playSound('check');
    }

    // Pausar el reloj mientras la IA piensa
    pauseClock();

    if (!game.game_over()) {
        window.setTimeout(makeAIMove, 250);
    } else {
        pauseClock();
        playSound('gameOver');
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

// ============================================
// MOTOR IA (MINIMAX)
// ============================================
function evaluateBoard(game) {
    var board = game.board();
    var totalEvaluation = 0;

    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalEvaluation += getPieceValue(board[i][j], i, j);
        }
    }
    return totalEvaluation;
}

function getPieceValue(piece, x, y) {
    if (piece === null) return 0;

    var absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x, y);
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
}

function getAbsoluteValue(piece, isWhite, x, y) {
    if (piece.type === 'p') {
        return pieceValues['p'] + (isWhite ? pawnTable[63 - (x * 8 + y)] : pawnTable[x * 8 + y]);
    } else if (piece.type === 'n') {
        return pieceValues['n'] + knightTable[x * 8 + y];
    } else {
        return pieceValues[piece.type];
    }
}

function minimax(depth, game, alpha, beta, isMaximisingPlayer) {
    if (depth === 0) {
        return -evaluateBoard(game);
    }

    var moves = game.moves();

    if (isMaximisingPlayer) {
        var bestMove = -9999;
        for (var i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) return bestMove;
        }
        return bestMove;
    } else {
        var bestMove = 9999;
        for (var i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) return bestMove;
        }
        return bestMove;
    }
}

function calculateBestMove(depth) {
    var moves = game.moves();
    var bestMove = null;
    var bestValue = -9999;

    for (var i = 0; i < moves.length; i++) {
        var move = moves[i];
        game.move(move);
        var boardValue = minimax(depth - 1, game, -10000, 10000, false);
        game.undo();
        if (boardValue >= bestValue) {
            bestValue = boardValue;
            bestMove = move;
        }
    }
    return bestMove;
}

function makeAIMove() {
    if (game.game_over()) {
        updateStatus();
        return;
    }

    $('#thinkingIndicator').show();
    gameInProgress = false;

    window.setTimeout(function() {
        var capturedPiece = null;
        var targetSquare = null;

        // Obtener información antes del movimiento
        var moves = game.moves({ verbose: true });
        var depth = difficulty;
        var bestMove = calculateBestMove(depth);

        if (bestMove) {
            // Buscar el movimiento detallado
            for (var i = 0; i < moves.length; i++) {
                if (moves[i].san === bestMove) {
                    targetSquare = moves[i].to;
                    capturedPiece = game.get(targetSquare);
                    break;
                }
            }

            var move = game.move(bestMove);
            board.position(game.fen());

            // Registrar pieza capturada
            if (move.captured) {
                var color = move.color === 'w' ? 'black' : 'white';
                capturedPieces[color].push(move.captured);
                updateCapturedPieces();
                playSound('capture');
            } else {
                playSound('move');
            }

            // Agregar al historial
            moveHistory.push({
                san: move.san,
                from: move.from,
                to: move.to,
                fen: game.fen()
            });

            lastMove = { from: move.from, to: move.to };
            removeHighlights();
            highlightSquare(move.from);
            highlightSquare(move.to);

            updateMoveHistory();
            updateStatistics();
        }

        $('#thinkingIndicator').hide();
        gameInProgress = true;

        updateStatus();

        if (game.in_check()) {
            playSound('check');
        }

        if (game.game_over()) {
            pauseClock();
            playSound('gameOver');
        } else {
            // Iniciar el reloj del jugador después del movimiento de la IA
            switchClock();
        }
    }, 200);
}

// ============================================
// RELOJ DE AJEDREZ
// ============================================
function startClock() {
    pauseClock();
    clockInterval = setInterval(updateClock, 1000);
    updateClockDisplay();
}

function pauseClock() {
    if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
    }
    $('.player-clock').removeClass('active');
}

function switchClock() {
    activePlayer = game.turn() === 'w' ? 'white' : 'black';

    // Verificar que el control de tiempo no sea "Sin límite"
    var timeControl = parseInt($('#timeControl').val());
    if (timeControl > 0) {
        startClock();
    }

    $('.player-clock').removeClass('active');
    if (activePlayer === 'white') {
        $('.white-clock').addClass('active');
    } else {
        $('.black-clock').addClass('active');
    }
}

function updateClock() {
    if (!gameInProgress || game.game_over()) {
        pauseClock();
        return;
    }

    if (activePlayer === 'white') {
        whiteTime--;
        if (whiteTime <= 0) {
            whiteTime = 0;
            pauseClock();
            gameInProgress = false;
            $('#gameStatus').removeClass('alert-warning').addClass('alert-danger')
                .show().html('<i class="bi bi-clock-fill"></i> ¡Tiempo agotado! Ganan las negras');
            playSound('gameOver');
        }
    } else {
        blackTime--;
        if (blackTime <= 0) {
            blackTime = 0;
            pauseClock();
            gameInProgress = false;
            $('#gameStatus').removeClass('alert-warning').addClass('alert-danger')
                .show().html('<i class="bi bi-clock-fill"></i> ¡Tiempo agotado! Ganan las blancas');
            playSound('gameOver');
        }
    }

    updateClockDisplay();
}

function updateClockDisplay() {
    $('#whiteClock').text(formatTime(whiteTime));
    $('#blackClock').text(formatTime(blackTime));

    // Advertencia de tiempo bajo (menos de 30 segundos)
    if (whiteTime <= 30) {
        $('.white-clock').addClass('time-low');
    } else {
        $('.white-clock').removeClass('time-low');
    }

    if (blackTime <= 30) {
        $('.black-clock').addClass('time-low');
    } else {
        $('.black-clock').removeClass('time-low');
    }
}

function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

// ============================================
// HISTORIAL DE MOVIMIENTOS
// ============================================
function updateMoveHistory() {
    var historyHTML = '';
    var moveNumber = 1;

    for (var i = 0; i < moveHistory.length; i += 2) {
        historyHTML += '<div class="move-row">';
        historyHTML += '<span class="move-number">' + moveNumber + '.</span>';
        historyHTML += '<span class="move-notation">' + moveHistory[i].san + '</span>';

        if (i + 1 < moveHistory.length) {
            historyHTML += '<span class="move-notation">' + moveHistory[i + 1].san + '</span>';
        } else {
            historyHTML += '<span></span>';
        }

        historyHTML += '</div>';
        moveNumber++;
    }

    if (historyHTML === '') {
        historyHTML = '<p class="text-muted text-center">No hay movimientos aún</p>';
    }

    $('#moveHistory').html(historyHTML);

    // Auto-scroll al final
    var historyDiv = $('#moveHistory')[0];
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// ============================================
// PIEZAS CAPTURADAS
// ============================================
function updateCapturedPieces() {
    var whiteCapturedHTML = '';
    var blackCapturedHTML = '';

    // Piezas blancas capturadas (capturadas por las negras)
    for (var i = 0; i < capturedPieces.white.length; i++) {
        var piece = 'w' + capturedPieces.white[i].toUpperCase();
        whiteCapturedHTML += '<span class="captured-piece">' + pieceSymbols[piece] + '</span>';
    }

    // Piezas negras capturadas (capturadas por las blancas)
    for (var i = 0; i < capturedPieces.black.length; i++) {
        var piece = 'b' + capturedPieces.black[i].toUpperCase();
        blackCapturedHTML += '<span class="captured-piece">' + pieceSymbols[piece] + '</span>';
    }

    $('#whiteCaptured').html(whiteCapturedHTML || '<span class="text-muted">Ninguna</span>');
    $('#blackCaptured').html(blackCapturedHTML || '<span class="text-muted">Ninguna</span>');
}

// ============================================
// ESTADÍSTICAS
// ============================================
function calculateMaterial(color) {
    var board = game.board();
    var material = 0;

    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            var piece = board[i][j];
            if (piece && piece.color === color) {
                material += pieceValues[piece.type] || 0;
            }
        }
    }

    return Math.floor(material / 100);
}

function updateStatistics() {
    $('#whiteMaterial').text(calculateMaterial('w'));
    $('#blackMaterial').text(calculateMaterial('b'));
    $('#whiteCaptures').text(capturedPieces.black.length);
    $('#blackCaptures').text(capturedPieces.white.length);
    $('#totalMoves').text(Math.ceil(moveHistory.length / 2));
}

// ============================================
// ESTADO DEL JUEGO
// ============================================
function updateStatus() {
    var turnText = game.turn() === 'w' ?
        '<i class="bi bi-hourglass-split"></i> Turno: Blancas' :
        '<i class="bi bi-hourglass-split"></i> Turno: Negras';

    if (game.in_checkmate()) {
        var winner = game.turn() === 'w' ? 'las negras' : 'las blancas';
        $('#gameStatus').removeClass('alert-warning').addClass('alert-danger')
            .show().html('<i class="bi bi-trophy-fill"></i> ¡Jaque mate! Ganan ' + winner);
        gameInProgress = false;
        $('#undoBtn').prop('disabled', true);
    } else if (game.in_draw()) {
        $('#gameStatus').removeClass('alert-warning').addClass('alert-info')
            .show().html('<i class="bi bi-hand-thumbs-up"></i> ¡Empate!');
        gameInProgress = false;
    } else if (game.in_stalemate()) {
        $('#gameStatus').removeClass('alert-warning').addClass('alert-info')
            .show().html('<i class="bi bi-hand-thumbs-up"></i> ¡Tablas por ahogado!');
        gameInProgress = false;
    } else if (game.in_threefold_repetition()) {
        $('#gameStatus').removeClass('alert-warning').addClass('alert-info')
            .show().html('<i class="bi bi-hand-thumbs-up"></i> ¡Tablas por triple repetición!');
        gameInProgress = false;
    } else if (game.insufficient_material()) {
        $('#gameStatus').removeClass('alert-warning').addClass('alert-info')
            .show().html('<i class="bi bi-hand-thumbs-up"></i> ¡Tablas por material insuficiente!');
        gameInProgress = false;
    } else if (game.in_check()) {
        $('#gameStatus').removeClass('alert-danger alert-info').addClass('alert-warning')
            .show().html('<i class="bi bi-exclamation-triangle-fill"></i> ¡Jaque!');
    } else {
        $('#gameStatus').hide();
    }

    $('#turnIndicator').html(turnText);
}

// ============================================
// RESALTADO
// ============================================
function removeHighlights() {
    $('#board .square-55d63').removeClass('highlight-last-move');
}

function highlightSquare(square) {
    $('#board .square-' + square).addClass('highlight-last-move');
}

// ============================================
// FUNCIONES DE CONTROL
// ============================================
function newGame() {
    pauseClock();

    game.reset();
    board.start();
    gameInProgress = true;
    moveHistory = [];
    capturedPieces = { white: [], black: [] };
    lastMove = { from: null, to: null };

    var timeControl = parseInt($('#timeControl').val());
    whiteTime = timeControl;
    blackTime = timeControl;
    activePlayer = 'white';

    removeHighlights();
    updateMoveHistory();
    updateCapturedPieces();
    updateStatistics();
    updateClockDisplay();
    $('#gameStatus').hide();
    $('#undoBtn').prop('disabled', false);
    updateStatus();

    $('.player-clock').removeClass('active time-low');

    if (playerColor === 'black') {
        window.setTimeout(function() {
            makeAIMove();
        }, 500);
    } else if (timeControl > 0) {
        startClock();
        $('.white-clock').addClass('active');
    }
}

function undoMove() {
    if (moveHistory.length < 2) return;

    // Deshacer el movimiento de la IA
    game.undo();
    moveHistory.pop();

    // Deshacer el movimiento del jugador
    game.undo();
    var playerMove = moveHistory.pop();

    // Actualizar tablero
    board.position(game.fen());

    // Recalcular piezas capturadas
    recalculateCapturedPieces();

    removeHighlights();
    updateMoveHistory();
    updateCapturedPieces();
    updateStatistics();
    updateStatus();

    gameInProgress = true;
}

function recalculateCapturedPieces() {
    capturedPieces = { white: [], black: [] };

    for (var i = 0; i < moveHistory.length; i++) {
        var fen = moveHistory[i].fen;
        var tempGame = new Chess(fen);
        var history = tempGame.history({ verbose: true });

        for (var j = 0; j < history.length; j++) {
            if (history[j].captured) {
                var color = history[j].color === 'w' ? 'black' : 'white';
                capturedPieces[color].push(history[j].captured);
            }
        }
    }
}

function flipBoard() {
    board.flip();
}

function changeTheme(theme) {
    $('body').attr('data-theme', theme);
}

// ============================================
// GUARDAR/CARGAR PARTIDA
// ============================================
function saveGame() {
    var gameData = {
        fen: game.fen(),
        moveHistory: moveHistory,
        capturedPieces: capturedPieces,
        whiteTime: whiteTime,
        blackTime: blackTime,
        playerColor: playerColor,
        difficulty: difficulty
    };

    localStorage.setItem('chessGameSave', JSON.stringify(gameData));
    alert('Partida guardada exitosamente!');
}

function loadGame() {
    var savedData = localStorage.getItem('chessGameSave');

    if (!savedData) {
        alert('No hay partida guardada');
        return;
    }

    try {
        var gameData = JSON.parse(savedData);

        pauseClock();

        game.load(gameData.fen);
        board.position(gameData.fen);
        moveHistory = gameData.moveHistory || [];
        capturedPieces = gameData.capturedPieces || { white: [], black: [] };
        whiteTime = gameData.whiteTime || 600;
        blackTime = gameData.blackTime || 600;
        playerColor = gameData.playerColor || 'white';
        difficulty = gameData.difficulty || 3;

        gameInProgress = !game.game_over();

        updateMoveHistory();
        updateCapturedPieces();
        updateStatistics();
        updateClockDisplay();
        updateStatus();

        $('#colorSelect').val(playerColor);
        $('#difficultySelect').val(difficulty);

        alert('Partida cargada exitosamente!');
    } catch (e) {
        alert('Error al cargar la partida');
    }
}

// ============================================
// EXPORTAR PGN
// ============================================
function exportToPGN() {
    var pgn = game.pgn();
    var blob = new Blob([pgn], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'partida_ajedrez_' + Date.now() + '.pgn';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// INICIALIZACIÓN
// ============================================
$(document).ready(function() {
    board = Chessboard('board', config);

    // Event listeners
    $('#newGameBtn').on('click', newGame);
    $('#undoBtn').on('click', undoMove);
    $('#flipBoardBtn').on('click', flipBoard);
    $('#saveGameBtn').on('click', saveGame);
    $('#loadGameBtn').on('click', loadGame);
    $('#exportPGNBtn').on('click', exportToPGN);

    $('#difficultySelect').on('change', function() {
        difficulty = parseInt($(this).val());
    });

    $('#colorSelect').on('change', function() {
        playerColor = $(this).val();
        board.orientation(playerColor);
        newGame();
    });

    $('#timeControl').on('change', function() {
        var time = parseInt($(this).val());
        whiteTime = time;
        blackTime = time;
        updateClockDisplay();
    });

    $('#themeSelect').on('change', function() {
        changeTheme($(this).val());
    });

    $('#soundToggle').on('change', function() {
        soundEnabled = $(this).is(':checked');
    });

    // Inicializar
    changeTheme('classic');
    updateStatus();
    updateStatistics();
    updateClockDisplay();

    console.log('Ajedrez Pro inicializado correctamente');
});
