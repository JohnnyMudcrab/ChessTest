/**
 * Knight - Chess knight piece implementation
 */
import { Piece } from './Piece.js';
import { PIECE_TYPES } from '../../utils/Constants.js';

export class Knight extends Piece {
  /**
   * Create a new knight
   * @param {String} color - Piece color
   */
  constructor(color) {
    super(PIECE_TYPES.KNIGHT, color);
  }

  /**
   * Calculate possible moves for this knight
   * @param {Board} board - The chess board
   * @param {Number} row - Current row
   * @param {Number} col - Current column
   * @returns {Array} Array of [row, col] possible moves
   */
  getPossibleMoves(board, row, col) {
    const moves = [];
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [rowOffset, colOffset] of offsets) {
      const newRow = row + rowOffset;
      const newCol = col + colOffset;

      if (board.isInBounds(newRow, newCol)) {
        // Can move if square is empty or has opponent's piece
        if (this.isEmpty(board, newRow, newCol) || 
            this.isOpponentPiece(board, newRow, newCol)) {
          moves.push([newRow, newCol]);
        }
      }
    }

    return moves;
  }

  /**
   * Create a copy of this knight
   * @returns {Knight} New knight instance with the same properties
   */
  clone() {
    const copy = new Knight(this.color);
    copy.hasMoved = this.hasMoved;
    return copy;
  }
}
