/**
 * King - Chess king piece implementation
 */
import { Piece } from './Piece.js';
import { PIECE_TYPES, COLORS, SPECIAL_MOVES } from '../../utils/Constants.js';

export class King extends Piece {
  /**
   * Create a new king
   * @param {String} color - Piece color
   */
  constructor(color) {
    super(PIECE_TYPES.KING, color);
  }

  /**
   * Calculate possible moves for this king
   * @param {Board} board - The chess board
   * @param {Number} row - Current row
   * @param {Number} col - Current column
   * @param {Object} gameState - Current game state for castling
   * @returns {Array} Array of [row, col] possible moves
   */
  getPossibleMoves(board, row, col, gameState = null) {
    const moves = [];
    
    // Standard king moves (one square in any direction)
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [rowDir, colDir] of directions) {
      const newRow = row + rowDir;
      const newCol = col + colDir;

      if (board.isInBounds(newRow, newCol)) {
        if (this.isEmpty(board, newRow, newCol) || 
            this.isOpponentPiece(board, newRow, newCol)) {
          moves.push([newRow, newCol]);
        }
      }
    }

    // Castling moves (handled by MoveValidator to check for checks)
    if (gameState && !this.hasMoved && !gameState.isInCheck[this.color]) {
      this.addCastlingMoves(board, row, col, moves, gameState);
    }

    return moves;
  }

  /**
   * Add castling moves if applicable
   * @param {Board} board - The chess board
   * @param {Number} row - Current king row
   * @param {Number} col - Current king column (should be 4)
   * @param {Array} moves - Array to add castling moves to
   * @param {Object} gameState - Current game state
   */
  addCastlingMoves(board, row, col, moves, gameState) {
    // Kingside castling
    if (gameState.castlingRights[this.color].kingSide) {
      if (this.canCastleKingside(board, row, col)) {
        moves.push([row, col + 2, SPECIAL_MOVES.CASTLE_KINGSIDE]);
      }
    }

    // Queenside castling
    if (gameState.castlingRights[this.color].queenSide) {
      if (this.canCastleQueenside(board, row, col)) {
        moves.push([row, col - 2, SPECIAL_MOVES.CASTLE_QUEENSIDE]);
      }
    }
  }

  /**
   * Check if kingside castling is possible
   * @param {Board} board - The chess board
   * @param {Number} row - Current king row
   * @param {Number} col - Current king column
   * @returns {Boolean} Whether kingside castling is possible
   */
  canCastleKingside(board, row, col) {
    // Check if squares between king and rook are empty
    return this.isEmpty(board, row, col + 1) && 
           this.isEmpty(board, row, col + 2) &&
           // Check if the rook is in place and hasn't moved
           board.isInBounds(row, col + 3) &&
           this.isRookForCastling(board, row, col + 3);
  }

  /**
   * Check if queenside castling is possible
   * @param {Board} board - The chess board
   * @param {Number} row - Current king row
   * @param {Number} col - Current king column
   * @returns {Boolean} Whether queenside castling is possible
   */
  canCastleQueenside(board, row, col) {
    // Check if squares between king and rook are empty
    return this.isEmpty(board, row, col - 1) && 
           this.isEmpty(board, row, col - 2) &&
           this.isEmpty(board, row, col - 3) &&
           // Check if the rook is in place and hasn't moved
           board.isInBounds(row, col - 4) &&
           this.isRookForCastling(board, row, col - 4);
  }

  /**
   * Check if a piece is a valid rook for castling
   * @param {Board} board - The chess board
   * @param {Number} row - Rook row
   * @param {Number} col - Rook column
   * @returns {Boolean} Whether the piece is a valid rook for castling
   */
  isRookForCastling(board, row, col) {
    const piece = board.getPiece(row, col);
    return piece && 
           piece.type === PIECE_TYPES.ROOK && 
           piece.color === this.color && 
           !piece.hasMoved;
  }

  /**
   * Create a copy of this king
   * @returns {King} New king instance with the same properties
   */
  clone() {
    const copy = new King(this.color);
    copy.hasMoved = this.hasMoved;
    return copy;
  }
}
