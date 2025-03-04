/**
 * BoardView - Renders the chess board UI
 */
import { FILES, RANKS, UI } from '../utils/Constants.js';

export class BoardView {
    /**
     * Create a board view
     * @param {HTMLElement} boardElement - The board container element
     */
    constructor(boardElement) {
        this.boardElement = boardElement;
        this.selectedSquare = null;
        this.possibleMoves = [];
    }

    /**
     * Render the chess board
     * @param {Board} board - The chess board
     * @param {GameState} gameState - The game state
     */
    renderBoard(board, gameState) {
        this.boardElement.innerHTML = '';

        // Get board orientation
        const orientation = gameState.boardOrientation;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // Determine actual board position based on orientation
                let actualRow = orientation === 'white' ? row : 7 - row;
                let actualCol = orientation === 'white' ? col : 7 - col;

                const square = this.createSquare(actualRow, actualCol, (row + col) % 2 === 0);

                // Add piece if present
                const piece = board.getPiece(actualRow, actualCol);
                if (piece) {
                    this.addPieceToSquare(square, piece);

                    // Highlight king if in check
                    if (piece.type === 'king' && gameState.isInCheck[piece.color]) {
                        square.classList.add(UI.SQUARE_CLASSES.CHECK);
                    }
                }

                this.boardElement.appendChild(square);
            }
        }
    }

    /**
     * Create a board square element
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     * @param {Boolean} isLight - Whether the square is light-colored
     * @returns {HTMLElement} The square element
     */
    createSquare(row, col, isLight) {
        const square = document.createElement('div');
        square.classList.add('square');

        // Set square color
        if (isLight) {
            square.classList.add(UI.SQUARE_CLASSES.LIGHT);
        } else {
            square.classList.add(UI.SQUARE_CLASSES.DARK);
        }

        // Set data attributes for position
        square.dataset.row = row;
        square.dataset.col = col;

        // Add coordinates for edge squares
        if (col === 0) {
            const rankCoord = document.createElement('div');
            rankCoord.classList.add('coordinates', 'rank');
            rankCoord.textContent = RANKS[row];
            square.appendChild(rankCoord);
        }

        if (row === 7) {
            const fileCoord = document.createElement('div');
            fileCoord.classList.add('coordinates', 'file');
            fileCoord.textContent = FILES[col];
            square.appendChild(fileCoord);
        }

        return square;
    }

    /**
     * Add a piece to a square
     * @param {HTMLElement} square - The square element
     * @param {Piece} piece - The chess piece
     */
    addPieceToSquare(square, piece) {
        const pieceElement = document.createElement('div');
        pieceElement.classList.add('piece');
        pieceElement.style.backgroundImage = `url('img/${piece.getImageName()}.png')`;
        square.appendChild(pieceElement);
    }

    /**
     * Highlight the selected piece and its possible moves
     * @param {Array} selectedPosition - [row, col] of selected piece
     * @param {Array} possibleMoves - Array of [row, col] possible moves
     */
    highlightSquares(selectedPosition, possibleMoves) {
        console.log('Highlighting squares:', selectedPosition, possibleMoves);
        this.clearHighlights();

        this.selectedSquare = selectedPosition;
        this.possibleMoves = possibleMoves;

        // Highlight selected piece
        if (selectedPosition) {
            const [row, col] = selectedPosition;
            const selectedSquare = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
            if (selectedSquare) {
                selectedSquare.classList.add(UI.SQUARE_CLASSES.HIGHLIGHTED);
            }

            // Highlight possible moves
            possibleMoves.forEach(moveData => {
                const [moveRow, moveCol] = moveData;
                const moveSquare = document.querySelector(`.square[data-row="${moveRow}"][data-col="${moveCol}"]`);
                if (moveSquare) {
                    moveSquare.classList.add(UI.SQUARE_CLASSES.POSSIBLE_MOVE);
                }
            });
        }
    }

    /**
     * Clear all highlights from the board
     */
    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove(
                UI.SQUARE_CLASSES.HIGHLIGHTED,
                UI.SQUARE_CLASSES.POSSIBLE_MOVE,
                UI.SQUARE_CLASSES.CHECK
            );
        });

        this.selectedSquare = null;
        this.possibleMoves = [];
    }

    /**
       * Highlight the last move made on the board
       * @param {Array} fromPosition - [row, col] of the start position
       * @param {Array} toPosition - [row, col] of the end position
       */
    highlightLastMove(fromPosition, toPosition) {
        // Clear any existing last move highlights first
        document.querySelectorAll(`.${UI.SQUARE_CLASSES.LAST_MOVE}`).forEach(square => {
            square.classList.remove(UI.SQUARE_CLASSES.LAST_MOVE);
        });

        if (!fromPosition || !toPosition) return;

        // Highlight the from square
        const [fromRow, fromCol] = fromPosition;
        const fromSquare = document.querySelector(`.square[data-row="${fromRow}"][data-col="${fromCol}"]`);
        if (fromSquare) {
            fromSquare.classList.add(UI.SQUARE_CLASSES.LAST_MOVE);
        }

        // Highlight the to square
        const [toRow, toCol] = toPosition;
        const toSquare = document.querySelector(`.square[data-row="${toRow}"][data-col="${toCol}"]`);
        if (toSquare) {
            toSquare.classList.add(UI.SQUARE_CLASSES.LAST_MOVE);
        }

        console.log(`Highlighted last move: ${fromRow},${fromCol} -> ${toRow},${toCol}`);
    }

    /**
     * Highlight kings in check
     * @param {GameState} gameState - The game state
     */
    highlightChecks(gameState) {
        for (const color of ['white', 'black']) {
            if (gameState.isInCheck[color]) {
                const [kingRow, kingCol] = gameState.kingPositions[color];
                const kingSquare = document.querySelector(`.square[data-row="${kingRow}"][data-col="${kingCol}"]`);
                if (kingSquare) {
                    kingSquare.classList.add(UI.SQUARE_CLASSES.CHECK);
                }
            }
        }
    }
}
