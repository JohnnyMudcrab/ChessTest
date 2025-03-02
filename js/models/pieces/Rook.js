/**
 * Rook - Chess rook piece implementation
 */
import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../utils/Constants.js';

export class Rook extends Piece {
  /**
   * Create a new rook
   * @param {String} color - Piece color
   */
  constructor(color) {
    super(PIECE_TYPES.ROOK, color);
  }

  /**
   * Calculate possible moves for this rook
   * @param {Board} board - The chess board
   * @param {Number} row - Current row
   * @param {Number} col - Current column
   * @returns {Array} Array of [row, col] possible moves
   */
  getPossibleMoves(board, row, col) {
    const moves = [];
    const directions = [
      [-1, 0],  // Up
      [1, 0],   // Down
      [0, -1],  // Left
      [0, 1]    // Right
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
   * Create a copy of this rook
   * @returns {Rook} New rook instance with the same properties
   */
  clone() {
    const copy = new Rook(this.color);
    copy.hasMoved = this.hasMoved;
    return copy;
  }
}
