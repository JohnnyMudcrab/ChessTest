/**
 * GameState - Manages the state of a chess game
 */
import { COLORS, RESULTS } from '../utils/Constants.js';

export class GameState {
  /**
   * Create a new game state
   */
  constructor() {
    this.currentPlayer = COLORS.WHITE;
    this.moveHistory = [];
    this.boardStates = [];
    this.capturedPieces = { 
      [COLORS.WHITE]: [], 
      [COLORS.BLACK]: [] 
    };
    this.kingPositions = { 
      [COLORS.WHITE]: [7, 4], 
      [COLORS.BLACK]: [0, 4] 
    };
    this.isInCheck = { 
      [COLORS.WHITE]: false, 
      [COLORS.BLACK]: false 
    };
    this.castlingRights = {
      [COLORS.WHITE]: { kingSide: true, queenSide: true },
      [COLORS.BLACK]: { kingSide: true, queenSide: true }
    };
    this.enPassantTarget = null;
    this.currentMoveIndex = 0;
    this.gameOver = false;
    this.gameStatus = '';
    this.result = RESULTS.IN_PROGRESS;
    this.boardOrientation = COLORS.WHITE;
    
    // For pawn promotion
    this.promotionPending = false;
    this.promotionMove = null;
  }

  /**
   * Switch the current player
   */
  switchPlayer() {
    const oldPlayer = this.currentPlayer;
    this.currentPlayer = this.currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    console.log(`Switched player from ${oldPlayer} to ${this.currentPlayer}`);
  }

  /**
   * Add a move to the history
   * @param {Object} move - Move object with details
   * @param {Board} boardState - Current board state after the move
   */
  addMove(move, boardState) {
    console.log(`Adding move to history: ${move.piece.type} from ${move.from} to ${move.to}`);
    
    // If we're in the middle of history, truncate future moves
    if (this.currentMoveIndex < this.moveHistory.length) {
      console.log(`Truncating history at index ${this.currentMoveIndex}`);
      this.truncateHistory();
    }
    
    // Add the move and board state
    this.moveHistory.push(move);
    this.boardStates.push(boardState);
    
    // Update the current move index
    this.currentMoveIndex = this.moveHistory.length;
    
    console.log(`Move added, new history length: ${this.moveHistory.length}`);
  }

  /**
   * Truncate move history and board states at current position
   */
  truncateHistory() {
    this.moveHistory = this.moveHistory.slice(0, this.currentMoveIndex);
    this.boardStates = this.boardStates.slice(0, this.currentMoveIndex + 1);
  }

  /**
   * Update the game result based on game status
   */
  updateResult() {
    if (this.gameStatus.includes('Checkmate')) {
      if (this.currentPlayer === COLORS.WHITE) {
        this.result = RESULTS.BLACK_WIN;
      } else {
        this.result = RESULTS.WHITE_WIN;
      }
    } else if (this.gameStatus.includes('Stalemate') || 
              this.gameStatus.includes('Draw')) {
      this.result = RESULTS.DRAW;
    } else {
      this.result = RESULTS.IN_PROGRESS;
    }
  }

  /**
   * Reset the game state for a new game
   */
  reset() {
    console.log('Resetting game state');
    
    this.currentPlayer = COLORS.WHITE;
    this.moveHistory = [];
    this.boardStates = [];
    this.capturedPieces = { 
      [COLORS.WHITE]: [], 
      [COLORS.BLACK]: [] 
    };
    this.kingPositions = { 
      [COLORS.WHITE]: [7, 4], 
      [COLORS.BLACK]: [0, 4] 
    };
    this.isInCheck = { 
      [COLORS.WHITE]: false, 
      [COLORS.BLACK]: false 
    };
    this.castlingRights = {
      [COLORS.WHITE]: { kingSide: true, queenSide: true },
      [COLORS.BLACK]: { kingSide: true, queenSide: true }
    };
    this.enPassantTarget = null;
    this.currentMoveIndex = 0;
    this.gameOver = false;
    this.gameStatus = '';
    this.result = RESULTS.IN_PROGRESS;
    this.promotionPending = false;
    this.promotionMove = null;
    // Keep the board orientation as is
    
    console.log('Game state reset complete');
  }

  /**
   * Get the opponent's color
   * @returns {String} Opponent's color
   */
  getOpponentColor() {
    return this.currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
  }

  /**
   * Add a captured piece
   * @param {Piece} piece - The captured piece
   */
  addCapturedPiece(piece) {
    const capturer = this.currentPlayer;
    this.capturedPieces[capturer].push(piece);
  }

  /**
   * Update king position after a move
   * @param {String} color - King's color
   * @param {Number} row - New row
   * @param {Number} col - New column
   */
  updateKingPosition(color, row, col) {
    this.kingPositions[color] = [row, col];
  }

  /**
   * Get the current PGN result string
   * @returns {String} PGN result notation
   */
  getPGNResult() {
    return this.result;
  }

  /**
   * Check if the game is over
   * @returns {Boolean} Whether the game is over
   */
  isGameOver() {
    return this.gameOver;
  }

  /**
   * Clone the current game state (for testing moves)
   * @returns {GameState} New game state instance with the same properties
   */
  clone() {
    const newState = new GameState();
    
    newState.currentPlayer = this.currentPlayer;
    newState.kingPositions = JSON.parse(JSON.stringify(this.kingPositions));
    newState.isInCheck = JSON.parse(JSON.stringify(this.isInCheck));
    newState.castlingRights = JSON.parse(JSON.stringify(this.castlingRights));
    newState.enPassantTarget = this.enPassantTarget ? [...this.enPassantTarget] : null;
    newState.gameOver = this.gameOver;
    newState.gameStatus = this.gameStatus;
    newState.result = this.result;
    
    return newState;
  }
}
