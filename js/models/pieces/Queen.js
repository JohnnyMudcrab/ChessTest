/**
 * Queen - Chess queen piece implementation
 */
import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../utils/Constants.js';

export class Queen extends Piece {
  /**
   * Create a new queen
   * @param {String} color - Piece color
   */
  constructor(color) {
    super(PIECE_TYPES.QUEEN, color);
  }

  /**
   * Calculate possible moves for this queen
   * @param {Board} board - The chess board
   * @param {Number} row - Current row
   * @param {Number} col - Current column
   * @returns {Array} Array of [row, col] possible moves
   */
  getPossibleMoves(board, row, col) {
    const moves = [];
    
    // Queen moves like a rook and bishop combined
    const directions = [
      [-1, 0],  // Up (rook-like)
      [1, 0],   // Down (rook-like)
      [0, -1],  // Left (rook-like)
      [0, 1],   // Right (rook-like)
      [-1, -1], // Up-left (bishop-like)
      [-1, 1],  // Up-right (bishop-like)
      [1, -1],  // Down-left (bishop-like)
      [1, 1]    // Down-right (bishop-like)
    ];

    for (const [rowDir, colDir] of directions) {
      let currentRow = row + rowDir;
      let currentCol = col + colDir;

      // Continue in this direction until reaching a piece or the board edge
      while (board.isInBounds(currentRow, currentCol)) {
        if (this.isEmpty(board, currentRow, currentCol)) {
          // Empty square - can move here
          moves.push([currentRow, currentCol]);
        } else if (this.isOpponentPiece(board, currentRow, currentCol)) {
          // Opponent's piece - can capture and stop
          moves.push([currentRow, currentCol]);
          break;
        } else {
          // Friendly piece - can't move here or beyond
          break;
        }

        // Continue in the same direction
        currentRow += rowDir;
        currentCol += colDir;
      }
    }

    return moves;
  }

  /**
   * Create a copy of this queen
   * @returns {Queen} New queen instance with the same properties
   */
  clone() {
    const copy = new Queen(this.color);
    copy.hasMoved = this.hasMoved;
    return copy;
  }
}
