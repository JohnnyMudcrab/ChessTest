/**
 * Piece class - Base class for all chess pieces
 */
import { PIECE_IMAGES } from '../../utils/Constants.js';

export class Piece {
  /**
   * Create a new chess piece
   * @param {String} type - The type of piece (pawn, knight, etc.)
   * @param {String} color - The color of the piece (white or black)
   */
  constructor(type, color) {
    this.type = type;
    this.color = color;
    this.hasMoved = false;
  }

  /**
   * Get a string representation of the piece
   * @returns {String} Piece identifier (e.g., "pawn-white")
   */
  toString() {
    return `${this.type}-${this.color}`;
  }

  /**
   * Get the image name for this piece
   * @returns {String} Image filename code (e.g., "wP" for white pawn)
   */
  getImageName() {
    return PIECE_IMAGES[this.toString()];
  }

  /**
   * Calculate possible moves for this piece
   * To be implemented by subclasses
   * @param {Board} board - The chess board
   * @param {Number} row - Current row
   * @param {Number} col - Current column
   * @returns {Array} Array of [row, col] possible moves
   */
  getPossibleMoves(board, row, col) {
    // Subclasses should override this method
    return [];
  }

  /**
   * Update the piece's movement status
   * @param {Boolean} moved - Whether the piece has moved
   */
  setHasMoved(moved) {
    this.hasMoved = moved;
  }

  /**
   * Check if the piece has moved
   * @returns {Boolean} Whether the piece has moved
   */
  getHasMoved() {
    return this.hasMoved;
  }

  /**
   * Create a copy of this piece
   * @returns {Piece} New piece instance with the same properties
   */
  clone() {
    // Subclasses should override this to return proper instance
    const copy = new Piece(this.type, this.color);
    copy.hasMoved = this.hasMoved;
    return copy;
  }

  /**
   * Check if a target square has an opponent's piece
   * @param {Board} board - The chess board
   * @param {Number} row - Target row
   * @param {Number} col - Target column
   * @returns {Boolean} Whether the square has an opponent's piece
   */
  isOpponentPiece(board, row, col) {
    const piece = board.getPiece(row, col);
    return piece !== null && piece.color !== this.color;
  }

  /**
   * Check if a target square has a friendly piece
   * @param {Board} board - The chess board
   * @param {Number} row - Target row
   * @param {Number} col - Target column
   * @returns {Boolean} Whether the square has a friendly piece
   */
  isFriendlyPiece(board, row, col) {
    const piece = board.getPiece(row, col);
    return piece !== null && piece.color === this.color;
  }

  /**
   * Check if a target square is empty
   * @param {Board} board - The chess board
   * @param {Number} row - Target row
   * @param {Number} col - Target column
   * @returns {Boolean} Whether the square is empty
   */
  isEmpty(board, row, col) {
    return board.getPiece(row, col) === null;
  }
}
