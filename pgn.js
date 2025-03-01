/**
 * PGN (Portable Game Notation) utilities for chess
 * This module provides functions for importing and exporting chess games in PGN format
 */

/**
 * Generate a PGN string from the game's move history
 * 
 * @param {Array} moveHistory - Array of move objects
 * @param {String} gameStatus - Current game status
 * @param {String} currentPlayer - Current player ('white' or 'black')
 * @param {HTMLElement} notationBody - DOM element containing move notation
 * @returns {String} - Formatted PGN string
 */
function generatePGN(moveHistory, gameStatus, currentPlayer, notationBody) {
    // Create PGN header with tag pairs
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '.');
    
    let pgn = '';
    pgn += '[Event "Casual Game"]\n';
    pgn += '[Site "Web Chess"]\n';
    pgn += '[Date "' + dateStr + '"]\n';
    pgn += '[Round "?"]\n';
    pgn += '[White "Player 1"]\n';
    pgn += '[Black "Player 2"]\n';
    pgn += '[Result "' + getPGNResult(gameStatus, currentPlayer) + '"]\n';
    pgn += '\n';
    
    // Generate movetext
    let moveNumber = 1;
    let moveLine = '';
    
    for (let i = 0; i < moveHistory.length; i++) {
        // Get the move notation from the UI
        const moveIndex = i + 1;
        const rowIndex = Math.ceil(moveIndex / 2) - 1;
        const isWhiteMove = moveIndex % 2 === 1;
        const columnIndex = isWhiteMove ? 1 : 2;
        
        const rows = notationBody.getElementsByTagName('tr');
        if (rowIndex >= 0 && rowIndex < rows.length) {
            const cells = rows[rowIndex].getElementsByTagName('td');
            
            if (isWhiteMove) {
                // Start a new move number for white's move
                moveLine += moveNumber + '. ';
                moveNumber++;
            }
            
            if (columnIndex < cells.length && cells[columnIndex].textContent) {
                moveLine += cells[columnIndex].textContent + ' ';
            }
        }
        
        // Add a newline every 5 moves (10 half-moves) for readability
        if (moveIndex % 10 === 0) {
            moveLine += '\n';
        }
    }
    
    // Add result
    moveLine += getPGNResult(gameStatus, currentPlayer);
    
    pgn += moveLine;
    return pgn;
}

/**
 * Determine the PGN result notation based on game status
 * 
 * @param {String} gameStatus - Current game status text
 * @param {String} currentPlayer - Current player ('white' or 'black')
 * @returns {String} - PGN result notation ('1-0', '0-1', '1/2-1/2', or '*')
 */
function getPGNResult(gameStatus, currentPlayer) {
    const gameOver = gameStatus.includes('Checkmate') || gameStatus.includes('Stalemate');
    
    if (!gameOver) return '*'; // Game in progress
    
    if (gameStatus.includes('Checkmate')) {
        if (currentPlayer === 'white') {
            return '0-1'; // Black wins
        } else {
            return '1-0'; // White wins
        }
    } else if (gameStatus.includes('Stalemate')) {
        return '1/2-1/2'; // Draw
    }
    
    return '*'; // Unknown/game in progress
}

/**
 * Save a PGN file with the current game
 * 
 * @param {String} pgnContent - PGN content to save
 */
function savePGN(pgnContent) {
    const blob = new Blob([pgnContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chess_game.pgn';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

/**
 * Process algebraic notation for a single move
 * 
 * @param {String} moveNotation - Algebraic chess notation (e.g., "e4", "Nf3", "O-O")
 * @param {ChessGame} game - Reference to the chess game object
 * @returns {Boolean} - Whether the move was processed successfully
 */
function processAlgebraicNotation(moveNotation, game) {
    if (!moveNotation) return false;
    
    // Handle special notations first
    if (moveNotation === 'O-O' || moveNotation === 'O-O-O') {
        return processCastlingMove(moveNotation, game);
    }
    
    // Strip check/checkmate symbols
    moveNotation = moveNotation.replace(/[+#]$/, '');
    
    // Handle pawn promotion
    let promotionPiece = null;
    if (moveNotation.includes('=')) {
        const parts = moveNotation.split('=');
        moveNotation = parts[0];
        const promoteTo = parts[1];
        
        // Convert promotion piece notation to our format
        const pieceMap = { 'Q': 'queen', 'R': 'rook', 'B': 'bishop', 'N': 'knight' };
        promotionPiece = pieceMap[promoteTo] || 'queen';
    }
    
    // Parse piece type, capture, and destination
    let pieceType = 'pawn'; // Default is pawn
    let capture = false;
    let sourceFile = null;
    let sourceRank = null;
    let destFile = null;
    let destRank = null;
    
    if (moveNotation[0] === moveNotation[0].toUpperCase() && 
        'KQRBN'.includes(moveNotation[0])) {
        // This is a piece move (not a pawn)
        const pieceMap = { 'K': 'king', 'Q': 'queen', 'R': 'rook', 'B': 'bishop', 'N': 'knight' };
        pieceType = pieceMap[moveNotation[0]];
        moveNotation = moveNotation.substring(1);
    }
    
    // Check for captures
    if (moveNotation.includes('x')) {
        capture = true;
        // For pawn captures, the first character is the source file
        if (pieceType === 'pawn' && moveNotation[0] >= 'a' && moveNotation[0] <= 'h') {
            sourceFile = moveNotation[0];
        }
        moveNotation = moveNotation.replace('x', '');
    }
    
    // Handle disambiguation (when multiple pieces can move to the same square)
    if (pieceType !== 'pawn' && moveNotation.length > 2) {
        // If we have something like Nbd7, the 'b' is the source file
        if (moveNotation.length === 3 && moveNotation[0] >= 'a' && moveNotation[0] <= 'h') {
            sourceFile = moveNotation[0];
            moveNotation = moveNotation.substring(1);
        }
        // If we have something like N1d7, the '1' is the source rank
        else if (moveNotation.length === 3 && moveNotation[0] >= '1' && moveNotation[0] <= '8') {
            sourceRank = moveNotation[0];
            moveNotation = moveNotation.substring(1);
        }
        // If we have something like Nb1d7, 'b1' is the source square
        else if (moveNotation.length === 4) {
            sourceFile = moveNotation[0];
            sourceRank = moveNotation[1];
            moveNotation = moveNotation.substring(2);
        }
    }
    
    // Get destination square
    if (moveNotation.length >= 2) {
        destFile = moveNotation[0];
        destRank = moveNotation[1];
    } else {
        console.error('Invalid move notation:', moveNotation);
        return false;
    }
    
    // Convert algebraic coordinates to array indices
    const fileToCol = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7 };
    const rankToRow = { '8': 0, '7': 1, '6': 2, '5': 3, '4': 4, '3': 5, '2': 6, '1': 7 };
    
    let destCol = fileToCol[destFile];
    let destRow = rankToRow[destRank];
    
    // Find the piece that can make this move
    const color = game.currentPlayer;
    let foundPiece = false;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = game.board[row][col];
            
            // Skip empty squares or opponent's pieces
            if (!piece || !piece.endsWith(color)) continue;
            
            // Check if this piece matches the type we're looking for
            const [currentPieceType] = piece.split('-');
            if (currentPieceType !== pieceType) continue;
            
            // Check if this piece matches source file/rank constraints
            if (sourceFile && fileToCol[sourceFile] !== col) continue;
            if (sourceRank && rankToRow[sourceRank] !== row) continue;
            
            // Check if this piece can legally move to the destination
            const legalMoves = game.calculateLegalMoves(row, col);
            const canMoveToTarget = legalMoves.some(([r, c]) => r === destRow && c === destCol);
            
            if (canMoveToTarget) {
                // We found the piece that can make this move
                if (promotionPiece) {
                    game.makeMove(row, col, destRow, destCol, promotionPiece);
                } else {
                    game.makeMove(row, col, destRow, destCol);
                }
                foundPiece = true;
                break;
            }
        }
        if (foundPiece) break;
    }
    
    if (!foundPiece) {
        console.error('Could not find piece for move:', moveNotation);
        return false;
    }
    
    return true;
}

/**
 * Process a castling move from PGN notation
 * 
 * @param {String} moveNotation - Castling notation ('O-O' or 'O-O-O')
 * @param {ChessGame} game - Reference to the chess game object
 * @returns {Boolean} - Whether the move was processed successfully
 */
function processCastlingMove(moveNotation, game) {
    const isKingside = moveNotation === 'O-O';
    const color = game.currentPlayer;
    const row = color === 'white' ? 7 : 0;
    const kingCol = 4;
    
    // Get king
    const king = game.board[row][kingCol];
    if (!king || !king.startsWith('king')) {
        console.error('King not found for castling:', moveNotation);
        return false;
    }
    
    // Destination column for king
    const destCol = isKingside ? 6 : 2;
    
    // Make the castling move
    game.makeMove(row, kingCol, row, destCol);
    return true;
}

/**
 * Parse and load a PGN file
 * 
 * @param {String} pgnText - Content of the PGN file
 * @param {ChessGame} game - Reference to the chess game object
 */
function loadPGN(pgnText, game) {
    try {
        // Reset the game first
        game.resetGame();
        
        // Parse PGN
        const lines = pgnText.split('\n');
        let tagSection = true;
        let movesText = '';
        
        // Extract moves text
        for (const line of lines) {
            if (line.trim() === '') {
                if (tagSection) tagSection = false;
                continue;
            }
            
            if (!tagSection) {
                movesText += line + ' ';
            }
        }
        
        // Parse moves
        movesText = movesText.trim();
        // Remove result from the end if present
        movesText = movesText.replace(/\s+1-0$|\s+0-1$|\s+1\/2-1\/2$|\s+\*$/, '');
        
        // Extract individual moves
        const moveRegex = /\d+\.\s+([^\s]+)(?:\s+([^\s]+))?/g;
        let match;
        
        while ((match = moveRegex.exec(movesText)) !== null) {
            const whiteMove = match[1];
            const blackMove = match[2];
            
            // Process white's move
            processAlgebraicNotation(whiteMove, game);
            
            // Process black's move if present
            if (blackMove) {
                processAlgebraicNotation(blackMove, game);
            }
        }
        
        // Update the board with final position
        game.goToMove(game.moveHistory.length);
        
    } catch (error) {
        console.error('Error loading PGN:', error);
        alert('Error loading PGN file. Please check the file format.');
    }
}
