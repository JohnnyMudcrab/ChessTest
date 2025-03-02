/**
 * MoveValidator - Validates chess moves and calculates legal moves
 */
import { COLORS, PIECE_TYPES } from '../utils/Constants.js';

export class MoveValidator {
  /**
   * Create a move validator
   * @param {Board} board - The chess board
   * @param {GameState} gameState - The game state
   */
  constructor(board, gameState) {
    this.board = board;
    this.gameState = gameState;
  }

  /**
   * Calculate all legal moves for a piece
   * @param {Number} row - Row index (0-7)
   * @param {Number} col - Column index (0-7)
   * @returns {Array} Array of legal moves as [row, col] pairs
   */
  calculateLegalMoves(row, col) {
    const piece = this.board.getPiece(row, col);
    
    console.log(`Calculating legal moves for piece at ${row},${col}`);
    if (!piece) {
      console.log('No piece at position');
      return [];
    }
    
    console.log(`Piece: ${piece.type}-${piece.color}, Current player: ${this.gameState.currentPlayer}`);
    
    // Don't calculate moves for opponent's pieces
    if (piece.color !== this.gameState.currentPlayer) {
      console.log('Skipping calculation - not current player\'s piece');
      return [];
    }
  
    // Get initial possible moves based on piece movement patterns
    let possibleMoves = [];
    try {
      possibleMoves = piece.getPossibleMoves(this.board, row, col, this.gameState);
      console.log(`Possible moves before check validation: ${possibleMoves.length}`);
    } catch (error) {
      console.error('Error calculating possible moves:', error);
      return [];
    }
  
    // Test each move to see if it leaves the king in check
    const legalMoves = [];
    
    for (const moveData of possibleMoves) {
      try {
        // moveData could be [toRow, toCol] or [toRow, toCol, specialMoveType]
        const toRow = moveData[0];
        const toCol = moveData[1];
        const specialMove = moveData.length > 2 ? moveData[2] : null;
        
        // Use the fixed simulateMove method which preserves the original board
        if (this.simulateMove(row, col, toRow, toCol, specialMove)) {
          legalMoves.push(moveData);
        }
      } catch (error) {
        console.error('Error validating move:', error);
        // Continue with next move
      }
    }
  
    console.log(`Legal moves after check validation: ${legalMoves.length}`);
    return legalMoves;
  }
  

  /**
   * Simulate a move to check if it's legal
   * @param {Number} fromRow - Source row
   * @param {Number} fromCol - Source column
   * @param {Number} toRow - Destination row
   * @param {Number} toCol - Destination column
   * @param {String} specialMove - Optional special move type
   * @returns {Boolean} Whether the move is legal
   */
  simulateMove(fromRow, fromCol, toRow, toCol, specialMove = null) {
    const piece = this.board.getPiece(fromRow, fromCol);
    if (!piece) return false;
  
    // Create DEEP copies for simulation (very important!)
    const originalBoard = this.board.clone();
    const originalState = this.gameState.clone();
    
    // Use a totally separate simulation board - don't modify the real one
    const simulationBoard = originalBoard.clone();
    const simulationState = originalState.clone();
    
    // Temporarily set the simulation board and state
    const savedBoard = this.board;
    const savedState = this.gameState;
    
    this.board = simulationBoard;
    this.gameState = simulationState;
    
    // Make temporary move on the SIMULATION board
    this.makeTemporaryMove(fromRow, fromCol, toRow, toCol, specialMove);
    
    // Check if king is in check after the move
    const isInCheck = this.isKingInCheck(piece.color);
    
    // Restore original board and state
    this.board = savedBoard;
    this.gameState = savedState;
    
    return !isInCheck;
  }

  /**
   * Make a temporary move for simulation
   * @param {Number} fromRow - Source row
   * @param {Number} fromCol - Source column
   * @param {Number} toRow - Destination row
   * @param {Number} toCol - Destination column
   * @param {String} specialMove - Optional special move type
   * @returns {Piece|null} The captured piece (if any)
   */
  makeTemporaryMove(fromRow, fromCol, toRow, toCol, specialMove = null) {
    const piece = this.board.getPiece(fromRow, fromCol);
    let capturedPiece = this.board.getPiece(toRow, toCol);
  
    // Handle castling
    if (specialMove && specialMove.startsWith('castle')) {
      this.handleCastlingMove(fromRow, fromCol, toRow, toCol, specialMove);
      return null;
    }
  
    // Handle en passant
    if (piece.type === PIECE_TYPES.PAWN && 
        this.gameState.enPassantTarget && 
        toRow === this.gameState.enPassantTarget[0] && 
        toCol === this.gameState.enPassantTarget[1]) {
      
      const enPassantRow = piece.color === COLORS.WHITE ? toRow + 1 : toRow - 1;
      capturedPiece = this.board.getPiece(enPassantRow, toCol);
      this.board.setPiece(enPassantRow, toCol, null);
    }
  
    // Move piece - but use setPiece to avoid board logging since this is a simulation
    this.board.setPiece(toRow, toCol, piece);
    this.board.setPiece(fromRow, fromCol, null);
  
    // Update king position if moving king
    if (piece.type === PIECE_TYPES.KING) {
      this.gameState.kingPositions[piece.color] = [toRow, toCol];
    }
  
    return capturedPiece;
  }

  /**
   * Handle a castling move
   * @param {Number} fromRow - King's row
   * @param {Number} fromCol - King's column (4)
   * @param {Number} toRow - King's destination row (same as fromRow)
   * @param {Number} toCol - King's destination column (2 or 6)
   * @param {String} castlingSide - 'castle-kingside' or 'castle-queenside'
   */
  handleCastlingMove(fromRow, fromCol, toRow, toCol, castlingSide) {
    // Move king
    this.board.movePiece(fromRow, fromCol, toRow, toCol);
    
    // Move rook
    const isKingside = castlingSide === 'castle-kingside';
    const rookFromCol = isKingside ? 7 : 0;
    const rookToCol = isKingside ? 5 : 3;
    
    this.board.movePiece(fromRow, rookFromCol, fromRow, rookToCol);
    
    // Update king position
    const piece = this.board.getPiece(toRow, toCol);
    this.gameState.updateKingPosition(piece.color, toRow, toCol);
  }

  /**
   * Check if a king is in check
   * @param {String} color - King's color
   * @returns {Boolean} Whether the king is in check
   */
  isKingInCheck(color) {
    const kingPosition = this.gameState.kingPositions[color];
    
    if (!kingPosition) {
      console.error(`King position not found for ${color}`);
      return false;
    }
    
    const [kingRow, kingCol] = kingPosition;
    return this.isSquareAttacked(kingRow, kingCol, color);
  }

  /**
   * Check if a square is under attack
   * @param {Number} row - Row index (0-7)
   * @param {Number} col - Column index (0-7)
   * @param {String} defendingColor - Color of the defending side
   * @returns {Boolean} Whether the square is attacked
   */
  isSquareAttacked(row, col, defendingColor) {
    const attackingColor = defendingColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    
    // Check attacks from each opponent piece
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board.getPiece(r, c);
        
        if (piece && piece.color === attackingColor) {
          const attackMoves = piece.getPossibleMoves(this.board, r, c, this.gameState);
          
          // Check if any move targets this square
          for (const moveData of attackMoves) {
            const [attackRow, attackCol] = moveData;
            if (attackRow === row && attackCol === col) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a player has any legal moves
   * @param {String} color - Player's color
   * @returns {Boolean} Whether the player has legal moves
   */
  playerHasLegalMoves(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board.getPiece(row, col);
        
        if (piece && piece.color === color) {
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
   * Check for checkmate or stalemate
   * @returns {Object} Game end state with status and gameOver flag
   */
  checkGameEndConditions() {
    const currentColor = this.gameState.currentPlayer;
    const hasLegalMoves = this.playerHasLegalMoves(currentColor);
    
    if (!hasLegalMoves) {
      if (this.gameState.isInCheck[currentColor]) {
        // Checkmate
        return {
          gameOver: true,
          gameStatus: `Checkmate! ${currentColor === COLORS.WHITE ? 'Black' : 'White'} wins`
        };
      } else {
        // Stalemate
        return {
          gameOver: true,
          gameStatus: 'Stalemate! Game is a draw'
        };
      }
    } else if (this.gameState.isInCheck[currentColor]) {
      // Just in check
      return {
        gameOver: false,
        gameStatus: `${currentColor === COLORS.WHITE ? 'White' : 'Black'} is in check!`
      };
    }
    
    return {
      gameOver: false,
      gameStatus: ''
    };
  }

  /**
   * Update check status for both players
   */
  updateCheckStatus() {
    // Check if either king is in check
    const whiteCheck = this.isKingInCheck(COLORS.WHITE);
    const blackCheck = this.isKingInCheck(COLORS.BLACK);
    
    // Update game state
    this.gameState.isInCheck[COLORS.WHITE] = whiteCheck;
    this.gameState.isInCheck[COLORS.BLACK] = blackCheck;
    
    console.log(`Check status - White: ${whiteCheck}, Black: ${blackCheck}`);
  }
}
