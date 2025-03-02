/**
 * PieceFactory - Creates and instantiates chess pieces
 */
import { Pawn } from './Pawn.js';
import { Knight } from './Knight.js';
import { Bishop } from './Bishop.js';
import { Rook } from './Rook.js';
import { Queen } from './Queen.js';
import { King } from './King.js';
import { PIECE_TYPES, COLORS, BOARD_SIZE } from '../../utils/Constants.js';

export class PieceFactory {
  /**
   * Create a piece instance based on type and color
   * @param {String} type - Piece type
   * @param {String} color - Piece color
   * @returns {Piece} New piece instance
   */
  static createPiece(type, color) {
    switch (type) {
      case PIECE_TYPES.PAWN:
        return new Pawn(color);
      case PIECE_TYPES.KNIGHT:
        return new Knight(color);
      case PIECE_TYPES.BISHOP:
        return new Bishop(color);
      case PIECE_TYPES.ROOK:
        return new Rook(color);
      case PIECE_TYPES.QUEEN:
        return new Queen(color);
      case PIECE_TYPES.KING:
        return new King(color);
      default:
        throw new Error(`Unknown piece type: ${type}`);
    }
  }

  /**
   * Create a piece from a string representation
   * @param {String} pieceString - String like "pawn-white"
   * @returns {Piece} New piece instance
   */
  static createPieceFromString(pieceString) {
    if (!pieceString) return null;
    
    const [type, color] = pieceString.split('-');
    return this.createPiece(type, color);
  }

  /**
   * Create the initial chess board with all pieces
   * @returns {Array} 2D array with piece instances
   */
  static createInitialBoard() {
    const grid = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
    
    // Set up pawns
    for (let col = 0; col < BOARD_SIZE; col++) {
      grid[1][col] = new Pawn(COLORS.BLACK);
      grid[6][col] = new Pawn(COLORS.WHITE);
    }
    
    // Set up other pieces
    const backRankPieces = [
      PIECE_TYPES.ROOK,
      PIECE_TYPES.KNIGHT,
      PIECE_TYPES.BISHOP,
      PIECE_TYPES.QUEEN,
      PIECE_TYPES.KING,
      PIECE_TYPES.BISHOP,
      PIECE_TYPES.KNIGHT,
      PIECE_TYPES.ROOK
    ];
    
    for (let col = 0; col < BOARD_SIZE; col++) {
      grid[0][col] = this.createPiece(backRankPieces[col], COLORS.BLACK);
      grid[7][col] = this.createPiece(backRankPieces[col], COLORS.WHITE);
    }
    
    return grid;
  }

  /**
   * Create pieces for specific positions
   * @param {Array} pieceData - Array of {type, color, row, col} objects
   * @returns {Array} 2D array with piece instances
   */
  static createCustomBoard(pieceData) {
    const grid = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
    
    pieceData.forEach(({ type, color, row, col }) => {
      grid[row][col] = this.createPiece(type, color);
    });
    
    return grid;
  }
}
