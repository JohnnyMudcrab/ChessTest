/**
 * Board class - Represents the chess board
 */
import { BOARD_SIZE } from '../utils/Constants.js';
import { PieceFactory } from './pieces/PieceFactory.js';

export class Board {
  /**
   * Create a new chess board
   */
  constructor() {
    this.grid = this.createEmptyGrid();
  }

  /**
   * Create an empty 8x8 grid
   * @returns {Array} 8x8 grid with null values
   */
  createEmptyGrid() {
    const grid = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      grid[row] = Array(BOARD_SIZE).fill(null);
    }
    return grid;
  }

  /**
   * Initialize the board with the starting position
   */
  setupInitialPosition() {
    this.grid = PieceFactory.createInitialBoard();
  }

  /**
   * Get the piece at a specific position
   * @param {Number} row - Row index (0-7)
   * @param {Number} col - Column index (0-7)
   * @returns {Piece|null} The piece at the position or null if empty
   */
  getPiece(row, col) {
    if (!this.isInBounds(row, col)) return null;
    return this.grid[row][col];
  }

  /**
   * Set a piece at a specific position
   * @param {Number} row - Row index (0-7)
   * @param {Number} col - Column index (0-7)
   * @param {Piece|null} piece - The piece to place or null to clear
   * @returns {Boolean} Whether the operation was successful
   */
  setPiece(row, col, piece) {
    if (!this.isInBounds(row, col)) return false;
    this.grid[row][col] = piece;
    return true;
  }

  /**
   * Move a piece on the board
   * @param {Number} fromRow - Source row
   * @param {Number} fromCol - Source column
   * @param {Number} toRow - Destination row
   * @param {Number} toCol - Destination column
   * @returns {Piece|null} The captured piece (if any) or null
   */
  movePiece(fromRow, fromCol, toRow, toCol) {
    console.log(`Board.movePiece: ${fromRow},${fromCol} -> ${toRow},${toCol}`);
    
    if (!this.isInBounds(fromRow, fromCol) || !this.isInBounds(toRow, toCol)) {
      console.error('Board.movePiece: Out of bounds coordinates');
      return null;
    }
  
    const piece = this.grid[fromRow][fromCol];
    
    if (!piece) {
      console.error(`Board.movePiece: No piece at source position ${fromRow},${fromCol}`);
      // Debug what's currently on the board
      console.log('Current board state:');
      for (let row = 0; row < 8; row++) {
        let rowStr = '';
        for (let col = 0; col < 8; col++) {
          const p = this.grid[row][col];
          rowStr += p ? `${p.type.charAt(0)}${p.color.charAt(0)} ` : '.. ';
        }
        console.log(`${row}: ${rowStr}`);
      }
      return null;
    }
  
    const capturedPiece = this.grid[toRow][toCol];
    
    // Move the piece
    this.grid[toRow][toCol] = piece;
    this.grid[fromRow][fromCol] = null;
    
    // Mark the piece as moved (for pawns, kings, rooks)
    if (typeof piece.setHasMoved === 'function') {
      piece.setHasMoved(true);
    }
    
    console.log(`Board.movePiece: Moved ${piece.type}-${piece.color}`);
    return capturedPiece;
  }

  /**
   * Check if coordinates are within board bounds
   * @param {Number} row - Row index
   * @param {Number} col - Column index
   * @returns {Boolean} Whether the coordinates are valid
   */
  isInBounds(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  /**
   * Find piece positions by type and color
   * @param {String} type - Piece type
   * @param {String} color - Piece color
   * @returns {Array} Array of [row, col] positions
   */
  findPiecePositions(type, color) {
    const positions = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = this.grid[row][col];
        if (piece && piece.type === type && piece.color === color) {
          positions.push([row, col]);
        }
      }
    }
    
    return positions;
  }

  /**
   * Create a deep copy of the board
   * @returns {Board} New board instance with the same position
   */
  clone() {
    // Create new board instance
    const newBoard = new Board();
    
    // Clear the new board's grid (just to be safe)
    newBoard.grid = this.createEmptyGrid();
    
    // Copy each piece, making sure to clone the piece objects
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.grid[row][col];
        if (piece) {
          // Clone the piece (don't just reference it)
          newBoard.grid[row][col] = piece.clone();
        }
      }
    }
    
    return newBoard;
  }

  /**
   * Clear the board
   */
  clear() {
    this.grid = this.createEmptyGrid();
  }
}
