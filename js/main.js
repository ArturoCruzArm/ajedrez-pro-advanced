// ============================================
// VARIABLES GLOBALES
// ============================================
var board = null;
var game = new Chess();
var playerColor = 'white';
var difficulty = 3; // 1-5, donde 5 es el más difícil
var gameInProgress = true;
var lastMove = { from: null, to: null };

// ============================================
// VALORES DE LAS PIEZAS
// ============================================
var pieceValues = {
    'p': 100,
    'n': 320,
    'b': 330,
    'r': 500,
    'q': 900,
    'k': 20000
};

// Tablas de posición para mejorar la evaluación
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
    // No permitir mover si el juego terminó
    if (game.game_over()) return false;

    // No permitir mover si no está en progreso
    if (!gameInProgress) return false;

    // Solo permitir mover piezas del color del jugador
    if ((playerColor === 'white' && piece.search(/^b/) !== -1) ||
        (playerColor === 'black' && piece.search(/^w/) !== -1)) {
        return false;
    }

    // Solo permitir mover en el turno correcto
    if ((game.turn() === 'w' && playerColor !== 'white') ||
        (game.turn() === 'b' && playerColor !== 'black')) {
        return false;
    }
}

function onDrop(source, target) {
    removeHighlights();

    // Ver si el movimiento es legal
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Siempre promocionar a reina
    });

    // Movimiento ilegal
    if (move === null) return 'snapback';

    // Guardar el último movimiento para resaltarlo
    lastMove = { from: source, to: target };

    // Resaltar el último movimiento
    highlightSquare(source);
    highlightSquare(target);

    // Actualizar estado
    updateStatus();

    // Si el juego continúa, hacer movimiento de la IA
    if (!game.game_over()) {
        window.setTimeout(makeAIMove, 250);
    }
}

function onSnapEnd() {
    board.position(game.fen());
}

// ============================================
// LÓGICA DE LA IA
// ============================================

// Evaluar la posición del tablero
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

// Obtener el valor de una pieza en una posición
function getPieceValue(piece, x, y) {
    if (piece === null) {
        return 0;
    }

    var absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x, y);
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
}

// Obtener el valor absoluto de una pieza considerando su posición
function getAbsoluteValue(piece, isWhite, x, y) {
    if (piece.type === 'p') {
        return pieceValues['p'] + (isWhite ? pawnTable[63 - (x * 8 + y)] : pawnTable[x * 8 + y]);
    } else if (piece.type === 'n') {
        return pieceValues['n'] + knightTable[x * 8 + y];
    } else {
        return pieceValues[piece.type];
    }
}

// Algoritmo Minimax con poda alfa-beta
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
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    } else {
        var bestMove = 9999;
        for (var i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    }
}

// Calcular el mejor movimiento para la IA
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

// Hacer el movimiento de la IA
function makeAIMove() {
    if (game.game_over()) {
        updateStatus();
        return;
    }

    // Mostrar indicador de pensamiento
    $('#thinkingIndicator').show();
    gameInProgress = false;

    // Usar setTimeout para no bloquear la UI
    window.setTimeout(function() {
        var depth = difficulty; // La profundidad depende de la dificultad
        var bestMove = calculateBestMove(depth);

        if (bestMove) {
            var move = game.move(bestMove);
            board.position(game.fen());

            // Guardar y resaltar el último movimiento
            lastMove = { from: move.from, to: move.to };
            removeHighlights();
            highlightSquare(move.from);
            highlightSquare(move.to);
        }

        // Ocultar indicador de pensamiento
        $('#thinkingIndicator').hide();
        gameInProgress = true;

        updateStatus();
    }, 200);
}

// ============================================
// ACTUALIZACIÓN DE ESTADO
// ============================================
function updateStatus() {
    var status = '';
    var turnText = '';

    if (game.turn() === 'w') {
        turnText = 'Turno: Blancas';
    } else {
        turnText = 'Turno: Negras';
    }

    if (game.in_checkmate()) {
        status = '¡Jaque mate! Ganan ' + (game.turn() === 'w' ? 'las negras' : 'las blancas');
        gameInProgress = false;
        $('#gameStatus').removeClass('alert-warning').addClass('alert-danger').show().html(status);
    } else if (game.in_draw()) {
        status = '¡Empate!';
        gameInProgress = false;
        $('#gameStatus').removeClass('alert-warning').addClass('alert-info').show().html(status);
    } else if (game.in_stalemate()) {
        status = '¡Tablas por ahogado!';
        gameInProgress = false;
        $('#gameStatus').removeClass('alert-warning').addClass('alert-info').show().html(status);
    } else if (game.in_threefold_repetition()) {
        status = '¡Tablas por triple repetición!';
        gameInProgress = false;
        $('#gameStatus').removeClass('alert-warning').addClass('alert-info').show().html(status);
    } else if (game.insufficient_material()) {
        status = '¡Tablas por material insuficiente!';
        gameInProgress = false;
        $('#gameStatus').removeClass('alert-warning').addClass('alert-info').show().html(status);
    } else if (game.in_check()) {
        status = '¡Jaque!';
        $('#gameStatus').removeClass('alert-danger alert-info').addClass('alert-warning').show().html(status);
    } else {
        $('#gameStatus').hide();
    }

    $('#turnIndicator').html(turnText);
}

// ============================================
// RESALTADO DE CUADROS
// ============================================
function removeHighlights() {
    $('#board .square-55d63').removeClass('highlight-last-move');
}

function highlightSquare(square) {
    var $square = $('#board .square-' + square);
    $square.addClass('highlight-last-move');
}

// ============================================
// CONTROLES DE INTERFAZ
// ============================================
function newGame() {
    game.reset();
    board.start();
    gameInProgress = true;
    lastMove = { from: null, to: null };
    removeHighlights();
    $('#gameStatus').hide();
    updateStatus();

    // Si el jugador es negras, la IA mueve primero
    if (playerColor === 'black') {
        window.setTimeout(makeAIMove, 500);
    }
}

function setDifficulty(level) {
    difficulty = parseInt(level);
}

function setPlayerColor(color) {
    playerColor = color;
    board.orientation(color);
}

function flipBoard() {
    board.flip();
}

// ============================================
// INICIALIZACIÓN
// ============================================
$(document).ready(function() {
    // Inicializar tablero
    board = Chessboard('board', config);

    // Configurar event listeners
    $('#newGameBtn').on('click', newGame);

    $('#difficultySelect').on('change', function() {
        setDifficulty($(this).val());
    });

    $('#colorSelect').on('change', function() {
        var newColor = $(this).val();
        playerColor = newColor;
        board.orientation(newColor);
        newGame();
    });

    $('#flipBoardBtn').on('click', flipBoard);

    // Actualizar estado inicial
    updateStatus();

    console.log('Juego de ajedrez inicializado correctamente');
});
