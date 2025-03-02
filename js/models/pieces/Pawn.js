/**
 * Pawn - Chess pawn piece implementation
 */
import { Piece } from './Piece.js';
import { PIECE_TYPES, COLORS } from '../../utils/Constants.js';

export class Pawn extends Piece {
  /**
   * Create a new pawn
   * @param {String} color - Piece color
   */
  constructor(color) {
    super(PIECE_TYPES.PAWN, color);
  }

  /**
   * Calculate possible moves for this pawn
   * @param {Board} board - The chess board
   * @param {Number} row - Current row
   * @param {Number} col - Current column
   * @param {Object} gameState - Current game state for en passant
   * @returns {Array} Array of [row, col] possible moves
   */
  getPossibleMoves(board, row, col, gameState = null) {
    const moves = [];
    const direction = this.color === COLORS.WHITE ? -1 : 1;
    const startingRow = this.color === COLORS.WHITE ? 6 : 1;

    // Forward move
    if (board.isInBounds(row + direction, col) && 
        this.isEmpty(board, row + direction, col)) {
      moves.push([row + direction, col]);

      // Double forward from starting position
      if (row === startingRow && 
          this.isEmpty(board, row + 2 * direction, col)) {
        moves.push([row + 2 * direction, col]);
      }
    }

    // Capture moves (diagonal)
    for (const colOffset of [-1, 1]) {
      const captureRow = row + direction;
      const captureCol = col + colOffset;

      if (board.isInBounds(captureRow, captureCol)) {
        // Normal capture
        if (this.isOpponentPiece(board, captureRow, captureCol)) {
          moves.push([captureRow, captureCol]);
        }
        
        // En passant capture
        if (gameState && gameState.enPassantTarget && 
            captureRow === gameState.enPassantTarget[0] && 
            captureCol === gameState.enPassantTarget[1]) {
          moves.push([captureRow, captureCol]);
        }
      }
    }

    return moves;
  }

  /**
   * Check if this pawn can be promoted
   * @param {Number} row - Target row
   * @returns {Boolean} Whether the pawn can be promoted
   */
  canPromote(row) {
    return (this.color === COLORS.WHITE && row === 0) || 
           (this.color === COLORS.BLACK && row === 7);
  }

  /**
   * Create a copy of this pawn
   * @returns {Pawn} New pawn instance with the same properties
   */
  clone() {
    const copy = new Pawn(this.color);
    copy.hasMoved = this.hasMoved;
    return copy;
  }
}
