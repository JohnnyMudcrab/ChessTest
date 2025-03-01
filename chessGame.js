/**
 * ChessGame class - Main chess game logic
 * Handles board representation, move validation, special moves, 
 * and game state management.
 */
class ChessGame {
    constructor() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.boardOrientation = 'white'; // white at bottom
        this.currentMoveIndex = 0; // for move navigation
        this.boardStates = [this.deepCopyBoard(this.board)]; // store board states for navigation
        this.kingPositions = { white: [7, 4], black: [0, 4] }; // Store king positions for check detection
        this.isInCheck = { white: false, black: false };
        this.gameOver = false;
        this.gameStatus = '';
        
        // Special move flags
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        
        this.enPassantTarget = null; // Square that can be captured via en passant
        
        // For pawn promotion
        this.promotionPending = false;
        this.promotionMove = null;
        
        this.setupBoard();
        this.setupEventListeners();
    }
    
    /**
     * Create a deep copy of the chess board
     * @param {Array} board - 2D array representing the chess board
     * @returns {Array} - Deep copy of the board
     */
    deepCopyBoard(board) {
        return board.map(row => [...row]);
    }
    
    /**
     * Create the initial chess board with pieces in starting positions
     * @returns {Array} - 2D array representing the starting position
     */
    createInitialBoard() {
        return [
            ['rook-black', 'knight-black', 'bishop-black', 'queen-black', 'king-black', 'bishop-black', 'knight-black', 'rook-black'],
            ['pawn-black', 'pawn-black', 'pawn-black', 'pawn-black', 'pawn-black', 'pawn-black', 'pawn-black', 'pawn-black'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['pawn-white', 'pawn-white', 'pawn-white', 'pawn-white', 'pawn-white', 'pawn-white', 'pawn-white', 'pawn-white'],
            ['rook-white', 'knight-white', 'bishop-white', 'queen-white', 'king-white', 'bishop-white', 'knight-white', 'rook-white']
        ];
    }
    
    /**
     * Set up the visual chess board with pieces and coordinates
     */
    setupBoard() {
        const chessboard = document.getElementById('chessboard');
        chessboard.innerHTML = '';
        
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        
        // Mapping function to convert our piece names to standard notation
        const getPieceImage = (piece) => {
            if (!piece) return null;
            
            const pieceMap = {
                'pawn-white': 'wP', 'rook-white': 'wR', 'knight-white': 'wN', 
                'bishop-white': 'wB', 'queen-white': 'wQ', 'king-white': 'wK',
                'pawn-black': 'bP', 'rook-black': 'bR', 'knight-black': 'bN', 
                'bishop-black': 'bB', 'queen-black': 'bQ', 'king-black': 'bK'
            };
            
            return pieceMap[piece];
        };
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.classList.add('square');
                
                // Determine actual board position based on orientation
                let actualRow = this.boardOrientation === 'white' ? row : 7 - row;
                let actualCol = this.boardOrientation === 'white' ? col : 7 - col;
                
                // Set square color
                if ((row + col) % 2 === 0) {
                    square.classList.add('light');
                } else {
                    square.classList.add('dark');
                }
                
                // Set data attributes for position
                square.dataset.row = actualRow;
                square.dataset.col = actualCol;
                
                // Add coordinates
                if (col === 0) {
                    const rankCoord = document.createElement('div');
                    rankCoord.classList.add('coordinates', 'rank');
                    rankCoord.textContent = ranks[actualRow];
                    square.appendChild(rankCoord);
                }
                
                if (row === 7) {
                    const fileCoord = document.createElement('div');
                    fileCoord.classList.add('coordinates', 'file');
                    fileCoord.textContent = files[actualCol];
                    square.appendChild(fileCoord);
                }
                
                // Add piece if present
                const piece = this.board[actualRow][actualCol];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.classList.add('piece');
                    const pieceFileName = getPieceImage(piece);
                    pieceElement.style.backgroundImage = `url('img/${pieceFileName}.png')`;
                    square.appendChild(pieceElement);
                    
                    // Highlight king if in check
                    if (piece === 'king-white' && this.isInCheck.white) {
                        square.classList.add('check');
                    }
                    if (piece === 'king-black' && this.isInCheck.black) {
                        square.classList.add('check');
                    }
                }
                
                chessboard.appendChild(square);
            }
        }
        
        this.updateTurnIndicator();
        this.updateCapturedPieces();
        this.updateGameStatus();
    }
    
    /**
     * Set up event listeners for user interactions
     */
    setupEventListeners() {
        const chessboard = document.getElementById('chessboard');
        chessboard.addEventListener('click', (e) => {
            if (this.gameOver || this.promotionPending) return;
            
            const square = e.target.closest('.square');
            if (!square) return;
            
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            this.handleSquareClick(row, col);
        });
        
        document.getElementById('new-game').addEventListener('click', () => {
            this.resetGame();
        });
        
        document.getElementById('flip-board').addEventListener('click', () => {
            this.flipBoard();
        });
        
        document.getElementById('first-move').addEventListener('click', () => {
            this.goToMove(0);
        });
        
        document.getElementById('prev-move').addEventListener('click', () => {
            this.goToMove(Math.max(0, this.currentMoveIndex - 1));
        });
        
        document.getElementById('next-move').addEventListener('click', () => {
            this.goToMove(Math.min(this.moveHistory.length, this.currentMoveIndex + 1));
        });
        
        document.getElementById('last-move').addEventListener('click', () => {
            this.goToMove(this.moveHistory.length);
        });
        
        // Add click event for notation rows
        document.getElementById('notation-body').addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (!row || !row.dataset.moveIndex) return;
            
            const moveIndex = parseInt(row.dataset.moveIndex);
            this.goToMove(moveIndex);
        });
        
        // Setup promotion modal event listeners
        document.getElementById('promotion-pieces').addEventListener('click', (e) => {
            const piece = e.target.closest('.promotion-piece');
            if (!piece || !piece.dataset.piece) return;
            
            this.completePromotion(piece.dataset.piece);
        });
        
        // PGN save and load
        document.getElementById('save-pgn').addEventListener('click', () => {
            const pgnContent = generatePGN(
                this.moveHistory, 
                this.gameStatus, 
                this.currentPlayer,
                document.getElementById('notation-body')
            );
            savePGN(pgnContent);
        });
        
        document.getElementById('load-pgn-btn').addEventListener('click', () => {
            document.getElementById('pgn-file-input').click();
        });
        
        document.getElementById('pgn-file-input').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    const pgnText = event.target.result;
                    loadPGN(pgnText, this);
                };
                
                reader.readAsText(file);
            }
        });
    }
    
    /**
     * Handle clicks on chess squares
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     */
    handleSquareClick(row, col) {
        // If a piece is already selected
        if (this.selectedPiece) {
            const [selectedRow, selectedCol] = this.selectedPiece;
            
            // Check if the clicked square is in possible moves
            const moveIndex = this.possibleMoves.findIndex(
                move => move[0] === row && move[1] === col
            );
            
            if (moveIndex !== -1) {
                // Special case for pawn promotion
                const piece = this.board[selectedRow][selectedCol];
                const isPawn = piece && piece.startsWith('pawn');
                const isPromotionRank = (piece.endsWith('white') && row === 0) || 
                                      (piece.endsWith('black') && row === 7);
                
                if (isPawn && isPromotionRank) {
                    this.promptPromotion(selectedRow, selectedCol, row, col);
                } else {
                    // Check if we're in the middle of the move history
                    if (this.currentMoveIndex < this.moveHistory.length) {
                        // Truncate move history and boardStates at current position
                        this.truncateMoveHistory();
                    }
                    
                    // Make the move
                    this.makeMove(selectedRow, selectedCol, row, col);
                }
                this.clearSelection();
            } else {
                // If clicking on another piece of same color, select that piece instead
                const clickedPiece = this.board[row][col];
                if (clickedPiece && clickedPiece.endsWith(this.currentPlayer)) {
                    this.selectPiece(row, col);
                } else {
                    // Otherwise clear selection
                    this.clearSelection();
                }
            }
        } else {
            // If no piece is selected, try to select one
            const piece = this.board[row][col];
            if (piece && piece.endsWith(this.currentPlayer)) {
                this.selectPiece(row, col);
            }
        }
    }
    
    /**
     * Select a piece and calculate its legal moves
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     */
    selectPiece(row, col) {
        this.selectedPiece = [row, col];
        this.possibleMoves = this.calculateLegalMoves(row, col);
        this.highlightSquares();
    }
    
    /**
     * Clear the current piece selection
     */
    clearSelection() {
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.clearHighlights();
    }
    
    /**
     * Highlight the selected piece and its possible moves
     */
    highlightSquares() {
        this.clearHighlights();
        
        // Highlight selected piece
        if (this.selectedPiece) {
            const [row, col] = this.selectedPiece;
            const selectedSquare = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
            if (selectedSquare) {
                selectedSquare.classList.add('highlighted');
            }
            
            // Highlight possible moves
            this.possibleMoves.forEach(([moveRow, moveCol]) => {
                const moveSquare = document.querySelector(`.square[data-row="${moveRow}"][data-col="${moveCol}"]`);
                if (moveSquare) {
                    moveSquare.classList.add('possible-move');
                }
            });
        }
        
        // Highlight kings in check
        for (const color of ['white', 'black']) {
            if (this.isInCheck[color]) {
                const [kingRow, kingCol] = this.kingPositions[color];
                const kingSquare = document.querySelector(`.square[data-row="${kingRow}"][data-col="${kingCol}"]`);
                if (kingSquare) {
                    kingSquare.classList.add('check');
                }
            }
        }
    }
    
    /**
     * Clear all highlights from the board
     */
    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('highlighted', 'possible-move', 'check');
        });
    }
    
    /**
     * Calculate all possible moves for a piece
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     * @returns {Array} - Array of possible moves as [row, col] pairs
     */
    calculatePossibleMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const [type, color] = piece.split('-');
        const moves = [];
        
        switch (type) {
            case 'pawn':
                this.calculatePawnMoves(row, col, color, moves);
                break;
            case 'rook':
                this.calculateRookMoves(row, col, color, moves);
                break;
            case 'knight':
                this.calculateKnightMoves(row, col, color, moves);
                break;
            case 'bishop':
                this.calculateBishopMoves(row, col, color, moves);
                break;
            case 'queen':
                this.calculateQueenMoves(row, col, color, moves);
                break;
            case 'king':
                this.calculateKingMoves(row, col, color, moves);
                break;
        }
        
        return moves;
    }
    
    /**
     * Filter moves that would leave the king in check
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     * @returns {Array} - Array of legal moves as [row, col] pairs
     */
    calculateLegalMoves(row, col) {
        const piece = this.board[row][col];
        if (!piece) return [];
        
        const [, color] = piece.split('-');
        const possibleMoves = this.calculatePossibleMoves(row, col);
        const legalMoves = [];
        
        // Test each move to see if it leaves the king in check
        for (const [toRow, toCol] of possibleMoves) {
            // Make a temporary move
            const originalBoard = this.deepCopyBoard(this.board);
            const capturedPiece = this.board[toRow][toCol];
            
            // Special case for en passant
            let capturedEnPassantPiece = null;
            let enPassantCapturePos = null;
            
            if (piece.startsWith('pawn') && col !== toCol && !capturedPiece) {
                // This is an en passant capture
                const enPassantRow = color === 'white' ? toRow + 1 : toRow - 1;
                capturedEnPassantPiece = this.board[enPassantRow][toCol];
                enPassantCapturePos = [enPassantRow, toCol];
                this.board[enPassantRow][toCol] = null;
            }
            
            // Move piece for testing
            this.board[toRow][toCol] = piece;
            this.board[row][col] = null;
            
            // Special case for castling - also move the rook
            let rookOriginalPos = null;
            let rookNewPos = null;
            
            if (piece.startsWith('king') && Math.abs(col - toCol) > 1) {
                // This is castling
                const rookCol = toCol === 6 ? 7 : 0; // Kingside or queenside
                const newRookCol = toCol === 6 ? 5 : 3; // Where rook goes
                
                rookOriginalPos = [row, rookCol];
                rookNewPos = [row, newRookCol];
                
                const rook = this.board[row][rookCol];
                this.board[row][newRookCol] = rook;
                this.board[row][rookCol] = null;
            }
            
            // Update king position if moving king
            let originalKingPos = null;
            if (piece.startsWith('king')) {
                originalKingPos = [...this.kingPositions[color]];
                this.kingPositions[color] = [toRow, toCol];
            }
            
            // Check if king is in check after the move
            const inCheck = this.isKingInCheck(color);
            
            // Restore the board
            this.board = this.deepCopyBoard(originalBoard);
            
            // Restore king position if it was moved
            if (originalKingPos) {
                this.kingPositions[color] = originalKingPos;
            }
            
            // If the move doesn't leave king in check, it's legal
            if (!inCheck) {
                legalMoves.push([toRow, toCol]);
            }
        }
        
        return legalMoves;
    }
    
    /**
     * Calculate possible moves for a pawn
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     * @param {String} color - Piece color ('white' or 'black')
     * @param {Array} moves - Array to store possible moves
     */
    calculatePawnMoves(row, col, color, moves) {
        const direction = color === 'white' ? -1 : 1;
        const startingRow = color === 'white' ? 6 : 1;
        
        // Forward move
        if (this.isInBounds(row + direction, col) && !this.board[row + direction][col]) {
            moves.push([row + direction, col]);
            
            // Double forward move from starting position
            if (row === startingRow && !this.board[row + 2 * direction][col]) {
                moves.push([row + 2 * direction, col]);
            }
        }
        
        // Capture moves (including en passant)
        for (const colOffset of [-1, 1]) {
            const newRow = row + direction;
            const newCol = col + colOffset;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                
                // Normal capture
                if (targetPiece && !targetPiece.endsWith(color)) {
                    moves.push([newRow, newCol]);
                }
                // En passant capture
                else if (this.enPassantTarget && 
                        newRow === this.enPassantTarget[0] && 
                        newCol === this.enPassantTarget[1]) {
                    moves.push([newRow, newCol]);
                }
            }
        }
    }
    
    /**
     * Calculate possible moves for a rook
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     * @param {String} color - Piece color ('white' or 'black')
     * @param {Array} moves - Array to store possible moves
     */
    calculateRookMoves(row, col, color, moves) {
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // right, down, left, up
        
        for (const [rowDir, colDir] of directions) {
            let currentRow = row + rowDir;
            let currentCol = col + colDir;
            
            while (this.isInBounds(currentRow, currentCol)) {
                const targetPiece = this.board[currentRow][currentCol];
                if (!targetPiece) {
                    moves.push([currentRow, currentCol]);
                } else {
                    if (!targetPiece.endsWith(color)) {
                        moves.push([currentRow, currentCol]);
                    }
                    break;
                }
                
                currentRow += rowDir;
                currentCol += colDir;
            }
        }
    }
    
    /**
     * Calculate possible moves for a knight
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     * @param {String} color - Piece color ('white' or 'black')
     * @param {Array} moves - Array to store possible moves
     */
    calculateKnightMoves(row, col, color, moves) {
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [rowOffset, colOffset] of offsets) {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || !targetPiece.endsWith(color)) {
                    moves.push([newRow, newCol]);
                }
            }
        }
    }
    
    /**
     * Calculate possible moves for a bishop
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     * @param {String} color - Piece color ('white' or 'black')
     * @param {Array} moves - Array to store possible moves
     */
    calculateBishopMoves(row, col, color, moves) {
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]]; // down-right, down-left, up-right, up-left
        
        for (const [rowDir, colDir] of directions) {
            let currentRow = row + rowDir;
            let currentCol = col + colDir;
            
            while (this.isInBounds(currentRow, currentCol)) {
                const targetPiece = this.board[currentRow][currentCol];
                if (!targetPiece) {
                    moves.push([currentRow, currentCol]);
                } else {
                    if (!targetPiece.endsWith(color)) {
                        moves.push([currentRow, currentCol]);
                    }
                    break;
                }
                
                currentRow += rowDir;
                currentCol += colDir;
            }
        }
    }
    
    /**
     * Calculate possible moves for a queen
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     * @param {String} color - Piece color ('white' or 'black')
     * @param {Array} moves - Array to store possible moves
     */
    calculateQueenMoves(row, col, color, moves) {
        this.calculateRookMoves(row, col, color, moves);
        this.calculateBishopMoves(row, col, color, moves);
    }
    
    /**
     * Calculate possible moves for a king
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     * @param {String} color - Piece color ('white' or 'black')
     * @param {Array} moves - Array to store possible moves
     */
    calculateKingMoves(row, col, color, moves) {
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        
        // Normal king moves
        for (const [rowOffset, colOffset] of offsets) {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || !targetPiece.endsWith(color)) {
                    moves.push([newRow, newCol]);
                }
            }
        }
        
        // Castling moves
        if (this.canCastle(row, col, color)) {
            // Check kingside castling
            if (this.castlingRights[color].kingSide && 
                !this.board[row][col+1] && 
                !this.board[row][col+2]) {
                
                // Check if squares are attacked
                if (!this.isSquareAttacked(row, col, color) && 
                    !this.isSquareAttacked(row, col+1, color) && 
                    !this.isSquareAttacked(row, col+2, color)) {
                    moves.push([row, col+2]);
                }
            }
            
            // Check queenside castling
            if (this.castlingRights[color].queenSide && 
                !this.board[row][col-1] && 
                !this.board[row][col-2] && 
                !this.board[row][col-3]) {
                
                // Check if squares are attacked
                if (!this.isSquareAttacked(row, col, color) && 
                    !this.isSquareAttacked(row, col-1, color) && 
                    !this.isSquareAttacked(row, col-2, color)) {
                    moves.push([row, col-2]);
                }
            }
        }
    }
    
    /**
     * Check if castling is allowed
     * @param {Number} row - King row index (0-7)
     * @param {Number} col - King column index (0-7)
     * @param {String} color - Piece color ('white' or 'black')
     * @returns {Boolean} - Whether castling is allowed
     */
    canCastle(row, col, color) {
        // King must be in original position and not in check
        if (color === 'white' && row === 7 && col === 4 && !this.isInCheck.white) {
            return true;
        }
        if (color === 'black' && row === 0 && col === 4 && !this.isInCheck.black) {
            return true;
        }
        return false;
    }
    
    /**
     * Check if a square is under attack
     * @param {Number} row - Row index (0-7)
     * @param {Number} col - Column index (0-7)
     * @param {String} defendingColor - Color of the defending side
     * @returns {Boolean} - Whether the square is attacked
     */
    isSquareAttacked(row, col, defendingColor) {
        const attackingColor = defendingColor === 'white' ? 'black' : 'white';
        
        // Check attacks from pawns
        const pawnDirections = defendingColor === 'white' ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
        for (const [rowDir, colDir] of pawnDirections) {
            const checkRow = row + rowDir;
            const checkCol = col + colDir;
            
            if (this.isInBounds(checkRow, checkCol)) {
                const piece = this.board[checkRow][checkCol];
                if (piece === `pawn-${attackingColor}`) {
                    return true;
                }
            }
        }
        
        // Check attacks from knights
        const knightOffsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [rowOffset, colOffset] of knightOffsets) {
            const checkRow = row + rowOffset;
            const checkCol = col + colOffset;
            
            if (this.isInBounds(checkRow, checkCol)) {
                const piece = this.board[checkRow][checkCol];
                if (piece === `knight-${attackingColor}`) {
                    return true;
                }
            }
        }
        
        // Check attacks from king
        const kingOffsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];
        
        for (const [rowOffset, colOffset] of kingOffsets) {
            const checkRow = row + rowOffset;
            const checkCol = col + colOffset;
            
            if (this.isInBounds(checkRow, checkCol)) {
                const piece = this.board[checkRow][checkCol];
                if (piece === `king-${attackingColor}`) {
                    return true;
                }
            }
        }
        
        // Check attacks from rooks and queens (horizontal and vertical)
        const straightDirections = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        for (const [rowDir, colDir] of straightDirections) {
            let checkRow = row + rowDir;
            let checkCol = col + colDir;
            
            while (this.isInBounds(checkRow, checkCol)) {
                const piece = this.board[checkRow][checkCol];
                if (piece) {
                    if (piece === `rook-${attackingColor}` || piece === `queen-${attackingColor}`) {
                        return true;
                    }
                    break; // Blocked by another piece
                }
                checkRow += rowDir;
                checkCol += colDir;
            }
        }
        
        // Check attacks from bishops and queens (diagonal)
        const diagonalDirections = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [rowDir, colDir] of diagonalDirections) {
            let checkRow = row + rowDir;
            let checkCol = col + colDir;
            
            while (this.isInBounds(checkRow, checkCol)) {
                const piece = this.board[checkRow][checkCol];
                if (piece) {
                    if (piece === `bishop-${attackingColor}` || piece === `queen-${attackingColor}`) {
                        return true;
                    }
                    break; // Blocked by another piece
                }
                checkRow += rowDir;
                checkCol += colDir;
            }
        }
        
        return false;
    }
    
    /**
     * Check if a king is in check
     * @param {String} color - King color ('white' or 'black')
     * @returns {Boolean} - Whether the king is in check
     */
    isKingInCheck(color) {
        const [kingRow, kingCol] = this.kingPositions[color];
        return this.isSquareAttacked(kingRow, kingCol, color);
    }
    
    /**
     * Check if a position is within board bounds
     * @param {Number} row - Row index
     * @param {Number} col - Column index
     * @returns {Boolean} - Whether the position is in bounds
     */
    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    /**
     * Truncate move history at current position
     */
    truncateMoveHistory() {
        // Remove all moves after the current index
        this.moveHistory = this.moveHistory.slice(0, this.currentMoveIndex);
        this.boardStates = this.boardStates.slice(0, this.currentMoveIndex + 1);
        
        // Clear the notation display from this point forward
        const notationBody = document.getElementById('notation-body');
        const rows = notationBody.getElementsByTagName('tr');
        
        let rowIndex = Math.ceil(this.currentMoveIndex / 2);
        // If we're truncating after white's move, keep the row but clear black's move
        if (this.currentMoveIndex % 2 === 1 && rowIndex < rows.length) {
            const cells = rows[rowIndex - 1].getElementsByTagName('td');
            if (cells.length >= 3) {
                cells[2].textContent = '';
            }
            // Remove all subsequent rows
            while (rows.length > rowIndex) {
                notationBody.removeChild(rows[rowIndex]);
            }
        } else {
            // Remove all rows from this point
            while (rows.length > rowIndex) {
                notationBody.removeChild(rows[rowIndex]);
            }
        }
    }
    
    /**
     * Execute a move on the board
     * @param {Number} fromRow - Source row
     * @param {Number} fromCol - Source column
     * @param {Number} toRow - Destination row
     * @param {Number} toCol - Destination column
     * @param {String} promotionPiece - Piece to promote to (optional)
     */
    makeMove(fromRow, fromCol, toRow, toCol, promotionPiece = null) {
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];
        const [pieceType, color] = piece.split('-');
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        let specialMove = '';
        let enPassantCapture = null;
        let promotedPiece = null;
        let castling = null;
        
        // Reset en passant target
        const oldEnPassantTarget = this.enPassantTarget;
        this.enPassantTarget = null;
        
        // Handle pawn special moves
        if (pieceType === 'pawn') {
            // Check for en passant capture
            if (fromCol !== toCol && !capturedPiece) {
                const enPassantRow = color === 'white' ? toRow + 1 : toRow - 1;
                enPassantCapture = [enPassantRow, toCol];
                
                // Capture the pawn
                const capturedPawn = this.board[enPassantRow][toCol];
                this.board[enPassantRow][toCol] = null;
                this.capturedPieces[color].push(capturedPawn);
                
                specialMove = 'en passant';
            }
            
            // Check for pawn promotion
            if ((color === 'white' && toRow === 0) || (color === 'black' && toRow === 7)) {
                promotedPiece = promotionPiece || 'queen'; // Default to queen if not specified
                this.board[fromRow][fromCol] = null;
                this.board[toRow][toCol] = `${promotedPiece}-${color}`;
                
                specialMove = 'promotion';
            }
            
            // Set en passant target for double move
            if (Math.abs(fromRow - toRow) === 2) {
                const enPassantRow = color === 'white' ? toRow + 1 : toRow - 1;
                this.enPassantTarget = [enPassantRow, toCol];
            }
        }
        
        // Handle castling
        if (pieceType === 'king' && Math.abs(fromCol - toCol) > 1) {
            const isKingsideCastling = toCol > fromCol;
            const rookFromCol = isKingsideCastling ? 7 : 0;
            const rookToCol = isKingsideCastling ? 5 : 3;
            
            // Move the rook
            const rook = this.board[fromRow][rookFromCol];
            this.board[fromRow][rookToCol] = rook;
            this.board[fromRow][rookFromCol] = null;
            
            castling = isKingsideCastling ? 'kingside' : 'queenside';
            specialMove = `castling ${castling}`;
        }
        
        // Update castling rights
        if (pieceType === 'king') {
            this.castlingRights[color].kingSide = false;
            this.castlingRights[color].queenSide = false;
            
            // Update king position
            this.kingPositions[color] = [toRow, toCol];
        }
        
        if (pieceType === 'rook') {
            if (fromRow === 7 && fromCol === 0 && color === 'white') {
                this.castlingRights.white.queenSide = false;
            } else if (fromRow === 7 && fromCol === 7 && color === 'white') {
                this.castlingRights.white.kingSide = false;
            } else if (fromRow === 0 && fromCol === 0 && color === 'black') {
                this.castlingRights.black.queenSide = false;
            } else if (fromRow === 0 && fromCol === 7 && color === 'black') {
                this.castlingRights.black.kingSide = false;
            }
        }
        
        // If a rook is captured, update castling rights
        if (capturedPiece === 'rook-white') {
            if (toRow === 7 && toCol === 0) this.castlingRights.white.queenSide = false;
            if (toRow === 7 && toCol === 7) this.castlingRights.white.kingSide = false;
        } else if (capturedPiece === 'rook-black') {
            if (toRow === 0 && toCol === 0) this.castlingRights.black.queenSide = false;
            if (toRow === 0 && toCol === 7) this.castlingRights.black.kingSide = false;
        }
        
        // Save move for history
        this.moveHistory.push({
            from: [fromRow, fromCol],
            to: [toRow, toCol],
            piece,
            capturedPiece,
            player: color,
            enPassantCapture,
            promotedPiece,
            castling,
            enPassantTarget: oldEnPassantTarget,
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
            specialMove
        });
        
        // Capture piece if any
        if (capturedPiece && !enPassantCapture) {
            this.capturedPieces[color].push(capturedPiece);
        }
        
        // Move piece (if not already handled by promotion)
        if (!promotedPiece) {
            this.board[toRow][toCol] = piece;
            this.board[fromRow][fromCol] = null;
        }
        
        // Switch player
        this.currentPlayer = opponentColor;
        
        // Check if opponent is in check or checkmate
        this.isInCheck.white = this.isKingInCheck('white');
        this.isInCheck.black = this.isKingInCheck('black');
        
        // Check for checkmate or stalemate
        this.checkGameEndConditions();
        
        // Store the new board state
        this.boardStates.push(this.deepCopyBoard(this.board));
        
        // Set current move index to latest move
        this.currentMoveIndex = this.moveHistory.length;
        
        // Update UI
        this.setupBoard();
        this.addMoveToHistory(fromRow, fromCol, toRow, toCol, piece, capturedPiece, specialMove);
        
        // Update navigation buttons
        this.updateNavigationButtons();
    }
    
    /**
     * Check for checkmate or stalemate
     */
    checkGameEndConditions() {
        const currentColor = this.currentPlayer;
        const hasLegalMoves = this.playerHasLegalMoves(currentColor);
        
        if (!hasLegalMoves) {
            if (this.isInCheck[currentColor]) {
                // Checkmate
                this.gameOver = true;
                this.gameStatus = `Checkmate! ${currentColor === 'white' ? 'Black' : 'White'} wins`;
            } else {
                // Stalemate
                this.gameOver = true;
                this.gameStatus = 'Stalemate! Game is a draw';
            }
        } else if (this.isInCheck[currentColor]) {
            // Just in check
            this.gameStatus = `${currentColor === 'white' ? 'White' : 'Black'} is in check!`;
        } else {
            this.gameStatus = '';
        }
    }
    
    /**
     * Check if a player has any legal moves
     * @param {String} color - Player color ('white' or 'black')
     * @returns {Boolean} - Whether the player has legal moves
     */
    playerHasLegalMoves(color) {
        // Check all pieces of this color
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.endsWith(color)) {
                    const legalMoves = this.calculateLegalMoves(row, col);
                    if (legalMoves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    /**
     * Show the pawn promotion dialog
     * @param {Number} fromRow - Source row
     * @param {Number} fromCol - Source column
     * @param {Number} toRow - Destination row
     * @param {Number} toCol - Destination column
     */
    promptPromotion(fromRow, fromCol, toRow, toCol) {
        this.promotionPending = true;
        this.promotionMove = { fromRow, fromCol, toRow, toCol };
        
        const modal = document.getElementById('promotion-modal');
        const piecesContainer = document.getElementById('promotion-pieces');
        piecesContainer.innerHTML = '';
        
        const color = this.board[fromRow][fromCol].split('-')[1];
        const pieceTypes = ['queen', 'rook', 'bishop', 'knight'];
        
        // Mapping function to convert our piece names to standard notation
        const getPieceImage = (piece) => {
            if (!piece) return null;
            
            const pieceMap = {
                'queen-white': 'wQ', 'rook-white': 'wR', 'bishop-white': 'wB', 'knight-white': 'wN',
                'queen-black': 'bQ', 'rook-black': 'bR', 'bishop-black': 'bB', 'knight-black': 'bN'
            };
            
            return pieceMap[piece];
        };
        
        pieceTypes.forEach(type => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('promotion-piece');
            pieceElement.dataset.piece = type;
            
            const pieceFileName = getPieceImage(`${type}-${color}`);
            pieceElement.style.backgroundImage = `url('img/${pieceFileName}.png')`;
            piecesContainer.appendChild(pieceElement);
        });
        
        modal.style.display = 'flex';
    }
    
    /**
     * Complete a pawn promotion with the selected piece
     * @param {String} pieceType - Type of piece to promote to
     */
    completePromotion(pieceType) {
        const { fromRow, fromCol, toRow, toCol } = this.promotionMove;
        
        // Close the modal
        document.getElementById('promotion-modal').style.display = 'none';
        
        // Check if we're in the middle of the move history
        if (this.currentMoveIndex < this.moveHistory.length) {
            // Truncate move history and boardStates at current position
            this.truncateMoveHistory();
        }
        
        // Complete the move with the promoted piece
        this.makeMove(fromRow, fromCol, toRow, toCol, pieceType);
        
        this.promotionPending = false;
        this.promotionMove = null;
    }
    
    /**
     * Add a move to the notation history
     * @param {Number} fromRow - Source row
     * @param {Number} fromCol - Source column
     * @param {Number} toRow - Destination row
     * @param {Number} toCol - Destination column
     * @param {String} piece - Piece that moved
     * @param {String} capturedPiece - Piece that was captured (if any)
     * @param {String} specialMove - Special move type (e.g., 'en passant', 'promotion')
     */
    addMoveToHistory(fromRow, fromCol, toRow, toCol, piece, capturedPiece, specialMove = '') {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        
        const fromSquare = files[fromCol] + ranks[fromRow];
        const toSquare = files[toCol] + ranks[toRow];
        
        // Get piece type (P, N, B, R, Q, K)
        let pieceType = piece.split('-')[0][0].toUpperCase();
        // Knights use 'N' instead of 'K' in algebraic notation
        if (pieceType === 'K' && piece.includes('knight')) pieceType = 'N';
        // Pawns have no prefix in algebraic notation
        if (pieceType === 'P') pieceType = '';
        
        // Build the move in algebraic notation
        let notation = '';
        
        // Handle castling
        if (specialMove.includes('castling')) {
            if (specialMove.includes('kingside')) {
                notation = 'O-O';
            } else {
                notation = 'O-O-O';
            }
        } else {
            if (capturedPiece || specialMove.includes('en passant')) {
                // Captures
                if (pieceType === '') {
                    // Pawn captures include the file
                    notation = files[fromCol] + 'x' + files[toCol] + ranks[toRow];
                } else {
                    notation = pieceType + 'x' + files[toCol] + ranks[toRow];
                }
            } else {
                // Non-captures
                notation = pieceType + files[toCol] + ranks[toRow];
            }
            
            // Add promotion
            if (specialMove.includes('promotion')) {
                const promotedTo = piece.split('-')[0][0].toUpperCase();
                notation += '=' + (promotedTo === 'K' && piece.includes('knight') ? 'N' : promotedTo);
            }
        }
        
        // Add check or checkmate
        if (this.gameStatus.includes('Checkmate')) {
            notation += '#';
        } else if (this.isInCheck.white || this.isInCheck.black) {
            notation += '+';
        }
        
        // Add to the table in the proper format
        const notationBody = document.getElementById('notation-body');
        
        // Get the player color for this move
        const color = piece.split('-')[1];
        
        if (color === 'white') {
            // Create a new row for white's move
            const tr = document.createElement('tr');
            tr.dataset.moveIndex = this.moveHistory.length;
            
            const tdNum = document.createElement('td');
            tdNum.textContent = Math.floor(this.moveHistory.length / 2) + 1 + '.';
            
            const tdWhite = document.createElement('td');
            tdWhite.textContent = notation;
            
            const tdBlack = document.createElement('td');
            // Black's move will be filled in later
            
            tr.appendChild(tdNum);
            tr.appendChild(tdWhite);
            tr.appendChild(tdBlack);
            notationBody.appendChild(tr);
        } else {
            // Add black's move to the last row
            const rows = notationBody.getElementsByTagName('tr');
            if (rows.length > 0) {
                const lastRow = rows[rows.length - 1];
                const cells = lastRow.getElementsByTagName('td');
                if (cells.length >= 3) {
                    cells[2].textContent = notation;
                }
            }
        }
        
        // Scroll to the bottom of the move history
        const moveHistory = document.getElementById('move-history');
        moveHistory.scrollTop = moveHistory.scrollHeight;
        
        // Highlight the current move
        this.highlightNotationRow(this.moveHistory.length);
    }
    
    /**
     * Highlight the current move in the notation history
     * @param {Number} moveIndex - Index of the move to highlight
     */
    highlightNotationRow(moveIndex) {
        // Remove highlight from all cells
        document.querySelectorAll('.notation-table td').forEach(cell => {
            cell.classList.remove('active');
        });
        
        if (moveIndex <= 0) return;
        
        // Calculate which row and column to highlight
        const rowIndex = Math.ceil(moveIndex / 2) - 1;
        const isWhiteMove = moveIndex % 2 === 1; // White moves are odd indices
        const columnIndex = isWhiteMove ? 1 : 2; // 1 for white, 2 for black
        
        // Get the rows in the notation table
        const rows = document.getElementById('notation-body').getElementsByTagName('tr');
        
        // Highlight the specific cell if it exists
        if (rowIndex >= 0 && rowIndex < rows.length) {
            const cells = rows[rowIndex].getElementsByTagName('td');
            if (columnIndex < cells.length) {
                cells[columnIndex].classList.add('active');
            }
        }
    }
    
    /**
     * Navigate to a specific move in the game history
     * @param {Number} moveIndex - Index of the move to go to
     */
    goToMove(moveIndex) {
        if (moveIndex < 0 || moveIndex > this.moveHistory.length) return;
        
        // Reset the game state first
        this.board = this.createInitialBoard();
        this.kingPositions = { white: [7, 4], black: [0, 4] };
        this.isInCheck = { white: false, black: false };
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.capturedPieces = { white: [], black: [] };
        this.gameOver = false;
        this.gameStatus = '';
        
        // Replay all moves up to the requested index
        for (let i = 0; i < moveIndex; i++) {
            const move = this.moveHistory[i];
            
            // Handle regular move
            const piece = this.board[move.from[0]][move.from[1]];
            
            // Handle captures
            if (move.capturedPiece) {
                this.capturedPieces[move.player].push(move.capturedPiece);
            }
            
            // Handle en passant capture
            if (move.enPassantCapture) {
                const capturedPawn = this.board[move.enPassantCapture[0]][move.enPassantCapture[1]];
                this.board[move.enPassantCapture[0]][move.enPassantCapture[1]] = null;
                this.capturedPieces[move.player].push(capturedPawn);
            }
            
            // Handle castling
            if (move.castling) {
                const row = move.from[0];
                const rookFromCol = move.castling === 'kingside' ? 7 : 0;
                const rookToCol = move.castling === 'kingside' ? 5 : 3;
                
                // Move the rook
                const rook = this.board[row][rookFromCol];
                this.board[row][rookToCol] = rook;
                this.board[row][rookFromCol] = null;
            }
            
            // Handle pawn promotion
            if (move.promotedPiece) {
                this.board[move.to[0]][move.to[1]] = `${move.promotedPiece}-${move.player}`;
                this.board[move.from[0]][move.from[1]] = null;
            } else {
                // Regular move
                this.board[move.to[0]][move.to[1]] = piece;
                this.board[move.from[0]][move.from[1]] = null;
            }
            
            // Update king position if king moved
            if (piece && piece.startsWith('king')) {
                this.kingPositions[move.player] = [move.to[0], move.to[1]];
            }
            
            // Update castling rights
            if (move.castlingRights) {
                this.castlingRights = JSON.parse(JSON.stringify(move.castlingRights));
            }
            
            // Set en passant target
            this.enPassantTarget = move.enPassantTarget;
        }
        
        this.currentMoveIndex = moveIndex;
        
        // Determine the current player
        this.currentPlayer = moveIndex % 2 === 0 ? 'white' : 'black';
        
        // Update check status
        this.isInCheck.white = this.isKingInCheck('white');
        this.isInCheck.black = this.isKingInCheck('black');
        
        // Check for game end conditions if at the latest move
        if (moveIndex === this.moveHistory.length) {
            this.checkGameEndConditions();
        } else {
            this.gameOver = false;
            this.gameStatus = '';
        }
        
        // Update UI
        this.setupBoard();
        this.highlightNotationRow(moveIndex);
        this.updateNavigationButtons();
    }
    
    /**
     * Update the navigation buttons based on current position
     */
    updateNavigationButtons() {
        // Disable/enable navigation buttons based on current position
        document.getElementById('first-move').disabled = this.currentMoveIndex === 0;
        document.getElementById('prev-move').disabled = this.currentMoveIndex === 0;
        document.getElementById('next-move').disabled = this.currentMoveIndex === this.moveHistory.length;
        document.getElementById('last-move').disabled = this.currentMoveIndex === this.moveHistory.length;
    }
    
    /**
     * Flip the board orientation
     */
    flipBoard() {
        this.boardOrientation = this.boardOrientation === 'white' ? 'black' : 'white';
        this.setupBoard();
    }
    
    /**
     * Reset the game to initial state
     */
    resetGame() {
        this.board = this.createInitialBoard();
        this.currentPlayer = 'white';
        this.selectedPiece = null;
        this.possibleMoves = [];
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.currentMoveIndex = 0;
        this.boardStates = [this.deepCopyBoard(this.board)];
        this.kingPositions = { white: [7, 4], black: [0, 4] };
        this.isInCheck = { white: false, black: false };
        this.gameOver = false;
        this.gameStatus = '';
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        
        // Reset move history display
        document.getElementById('notation-body').innerHTML = '';
        
        this.setupBoard();
        this.updateNavigationButtons();
    }
    
    /**
     * Update the turn indicator display
     */
    updateTurnIndicator() {
        document.getElementById('turn-indicator').textContent = `Current Turn: ${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}`;
    }
    
    /**
     * Update the game status display
     */
    updateGameStatus() {
        document.getElementById('game-status').textContent = this.gameStatus;
    }
    
    /**
     * Update the captured pieces display
     */
    updateCapturedPieces() {
        const whiteContainer = document.getElementById('captured-white');
        const blackContainer = document.getElementById('captured-black');
        
        whiteContainer.innerHTML = '';
        blackContainer.innerHTML = '';
        
        // Mapping function to convert our piece names to standard notation
        const getPieceImage = (piece) => {
            if (!piece) return null;
            
            const pieceMap = {
                'pawn-white': 'wP', 'rook-white': 'wR', 'knight-white': 'wN', 
                'bishop-white': 'wB', 'queen-white': 'wQ', 'king-white': 'wK',
                'pawn-black': 'bP', 'rook-black': 'bR', 'knight-black': 'bN', 
                'bishop-black': 'bB', 'queen-black': 'bQ', 'king-black': 'bK'
            };
            
            return pieceMap[piece];
        };
        
        this.capturedPieces.white.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('captured-piece');
            const pieceFileName = getPieceImage(piece);
            pieceElement.style.backgroundImage = `url('img/${pieceFileName}.png')`;
            whiteContainer.appendChild(pieceElement);
        });
        
        this.capturedPieces.black.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('captured-piece');
            const pieceFileName = getPieceImage(piece);
            pieceElement.style.backgroundImage = `url('img/${pieceFileName}.png')`;
            blackContainer.appendChild(pieceElement);
        });
    }
}
