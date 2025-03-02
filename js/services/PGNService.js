/**
 * PGNService - Handles PGN import and export
 */
import { FILES, RANKS, PIECE_TYPES, COLORS } from '../utils/Constants.js';
import { PGNParseError } from '../utils/ErrorHandler.js';
import { NotationView } from '../views/NotationView.js';

export class PGNService {
  /**
   * Generate a PGN string from game data
   * 
   * @param {Array} moveHistory - Array of move objects
   * @param {String} gameStatus - Current game status
   * @param {String} currentPlayer - Current player ('white' or 'black')
   * @param {HTMLElement} notationBody - DOM element containing move notation
   * @returns {String} - Formatted PGN string
   */
  generatePGN(moveHistory, gameStatus, currentPlayer, notationBody) {
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
    pgn += '[Result "' + this.getPGNResult(gameStatus, currentPlayer) + '"]\n';
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
    moveLine += this.getPGNResult(gameStatus, currentPlayer);
    
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
  getPGNResult(gameStatus, currentPlayer) {
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
  savePGNToFile(pgnContent) {
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
   * Parse and load a PGN file
   * 
   * @param {String} pgnText - Content of the PGN file
   * @returns {Object} - Parsed PGN data with headers and moves
   */
  parsePGN(pgnText) {
    try {
      const result = {
        headers: {},
        moves: []
      };
      
      // Parse PGN
      const lines = pgnText.split('\n');
      let tagSection = true;
      let movesText = '';
      
      // Extract headers and moves text
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine === '') {
          if (tagSection) tagSection = false;
          continue;
        }
        
        if (tagSection) {
          // Parse header tag
          const match = trimmedLine.match(/\[(\w+)\s+"(.*)"\]/);
          if (match) {
            const [_, tag, value] = match;
            result.headers[tag] = value;
          }
        } else {
          // Collect movetext
          movesText += trimmedLine + ' ';
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
        
        // Add white's move
        if (whiteMove) {
          result.moves.push({
            color: COLORS.WHITE,
            notation: whiteMove
          });
        }
        
        // Add black's move if present
        if (blackMove) {
          result.moves.push({
            color: COLORS.BLACK,
            notation: blackMove
          });
        }
      }
      
      return result;
    } catch (error) {
      throw new PGNParseError(`Failed to parse PGN: ${error.message}`);
    }
  }

  /**
   * Process algebraic notation for a single move
   * 
   * @param {String} moveNotation - Algebraic chess notation (e.g., "e4", "Nf3", "O-O")
   * @param {String} color - Player color making the move
   * @param {Board} board - Reference to the chess board
   * @param {GameState} gameState - Current game state
   * @returns {Object|null} - Move data or null if invalid
   */
  parseAlgebraicNotation(moveNotation, color, board, gameState) {
    if (!moveNotation) return null;
    
    try {
      // Handle special notations first
      if (moveNotation === 'O-O' || moveNotation === 'O-O-O') {
        return this.parseCastlingMove(moveNotation, color, gameState);
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
        const pieceMap = { 'Q': PIECE_TYPES.QUEEN, 'R': PIECE_TYPES.ROOK, 'B': PIECE_TYPES.BISHOP, 'N': PIECE_TYPES.KNIGHT };
        promotionPiece = pieceMap[promoteTo] || PIECE_TYPES.QUEEN;
      }
      
      // Parse piece type, capture, and destination
      let pieceType = PIECE_TYPES.PAWN; // Default is pawn
      let capture = false;
      let sourceFile = null;
      let sourceRank = null;
      let destFile = null;
      let destRank = null;
      
      if (moveNotation[0] === moveNotation[0].toUpperCase() && 
          'KQRBN'.includes(moveNotation[0])) {
        // This is a piece move (not a pawn)
        const pieceMap = { 
          'K': PIECE_TYPES.KING, 
          'Q': PIECE_TYPES.QUEEN, 
          'R': PIECE_TYPES.ROOK, 
          'B': PIECE_TYPES.BISHOP, 
          'N': PIECE_TYPES.KNIGHT 
        };
        pieceType = pieceMap[moveNotation[0]];
        moveNotation = moveNotation.substring(1);
      }
      
      // Check for captures
      if (moveNotation.includes('x')) {
        capture = true;
        // For pawn captures, the first character is the source file
        if (pieceType === PIECE_TYPES.PAWN && moveNotation[0] >= 'a' && moveNotation[0] <= 'h') {
          sourceFile = moveNotation[0];
        }
        moveNotation = moveNotation.replace('x', '');
      }
      
      // Handle disambiguation (when multiple pieces can move to the same square)
      if (pieceType !== PIECE_TYPES.PAWN && moveNotation.length > 2) {
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
        throw new PGNParseError(`Invalid move notation: ${moveNotation}`);
      }
      
      // Convert algebraic coordinates to array indices
      const fileToCol = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7 };
      const rankToRow = { '8': 0, '7': 1, '6': 2, '5': 3, '4': 4, '3': 5, '2': 6, '1': 7 };
      
      let destCol = fileToCol[destFile];
      let destRow = rankToRow[destRank];
      
      // Find the piece that can make this move
      let foundPiece = false;
      let fromRow, fromCol;
      
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board.getPiece(row, col);
          
          // Skip empty squares or opponent's pieces
          if (!piece || piece.color !== color) continue;
          
          // Check if this piece matches the type we're looking for
          if (piece.type !== pieceType) continue;
          
          // Check if this piece matches source file/rank constraints
          if (sourceFile && fileToCol[sourceFile] !== col) continue;
          if (sourceRank && rankToRow[sourceRank] !== row) continue;
          
          // We found a potential piece, now check if it can make the move
          const from = [row, col];
          const to = [destRow, destCol];
          
          // This is where we would need to check if the move is legal
          // For complete implementation, we would need to adapt existing move validation logic
          
          foundPiece = true;
          fromRow = row;
          fromCol = col;
          break;
        }
        if (foundPiece) break;
      }
      
      if (!foundPiece) {
        throw new PGNParseError(`Could not find piece for move: ${moveNotation}`);
      }
      
      return {
        from: [fromRow, fromCol],
        to: [destRow, destCol],
        pieceType,
        promotion: promotionPiece,
        capture,
        notation: moveNotation
      };
    } catch (error) {
      if (error instanceof PGNParseError) {
        throw error;
      } else {
        throw new PGNParseError(`Error processing move notation: ${error.message}`);
      }
    }
  }

  /**
   * Parse a castling move from PGN notation
   * 
   * @param {String} moveNotation - Castling notation ('O-O' or 'O-O-O')
   * @param {String} color - Player color
   * @param {GameState} gameState - Current game state
   * @returns {Object|null} - Move data or null if invalid
   */
  parseCastlingMove(moveNotation, color, gameState) {
    const isKingside = moveNotation === 'O-O';
    const row = color === COLORS.WHITE ? 7 : 0;
    const kingCol = 4;
    const destCol = isKingside ? 6 : 2;
    
    return {
      from: [row, kingCol],
      to: [row, destCol],
      pieceType: PIECE_TYPES.KING,
      promotion: null,
      capture: false,
      castling: isKingside ? 'kingside' : 'queenside',
      notation: moveNotation
    };
  }
}
