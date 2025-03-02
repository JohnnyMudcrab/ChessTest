/**
 * ChessUI - Main UI manager for the chess game
 */
import { BoardView } from './BoardView.js';
import { NotationView } from './NotationView.js';
import { COLORS, PIECE_TYPES, UI } from '../utils/Constants.js';

export class ChessUI {
  /**
   * Create a new chess UI
   */
  constructor() {
    this.elements = {
      chessboard: document.getElementById('chessboard'),
      turnIndicator: document.getElementById('turn-indicator'),
      gameStatus: document.getElementById('game-status'),
      notationBody: document.getElementById('notation-body'),
      moveHistory: document.getElementById('move-history'),
      capturedWhite: document.getElementById('captured-white'),
      capturedBlack: document.getElementById('captured-black'),
      promotionModal: document.getElementById('promotion-modal'),
      promotionPieces: document.getElementById('promotion-pieces')
    };
    
    this.boardView = new BoardView(this.elements.chessboard);
    this.notationView = new NotationView(this.elements.notationBody, this.elements.moveHistory);
    
    this.controller = null; // Will be set later
  }

  /**
   * Set the game controller
   * @param {GameController} controller - The game controller
   */
  setController(controller) {
    this.controller = controller;
    this.setupEventListeners();
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    this.setupBoardEvents();
    this.setupControlButtonEvents();
    this.setupMoveNavigationEvents();
    this.setupPromotionEvents();
    this.setupPGNEvents();
  }

  /**
   * Set up chess board event listeners
   */
  setupBoardEvents() {
    this.elements.chessboard.addEventListener('click', (e) => {
      // Ignore if game over or promotion pending
      if (this.controller.isGameOver() || this.controller.isPromotionPending()) {
        return;
      }
      
      const square = e.target.closest('.square');
      if (!square) return;
      
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      this.controller.handleSquareClick(row, col);
    });
  }

  /**
   * Set up control button event listeners
   */
  setupControlButtonEvents() {
    document.getElementById('new-game').addEventListener('click', () => {
      this.controller.resetGame();
    });
    
    document.getElementById('flip-board').addEventListener('click', () => {
      this.controller.flipBoard();
    });
  }

  /**
   * Set up move navigation event listeners
   */
  setupMoveNavigationEvents() {
    const navigationButtons = {
      'first-move': () => this.controller.goToMove(0),
      'prev-move': () => this.controller.goToMove(this.controller.getCurrentMoveIndex() - 1),
      'next-move': () => this.controller.goToMove(this.controller.getCurrentMoveIndex() + 1),
      'last-move': () => this.controller.goToMove(this.controller.getMoveHistoryLength())
    };
    
    // Set up event listeners for navigation buttons
    Object.entries(navigationButtons).forEach(([id, handler]) => {
      document.getElementById(id).addEventListener('click', handler);
    });
    
    // Event delegation for notation rows
    this.elements.notationBody.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row || !row.dataset.moveIndex) return;
      
      const moveIndex = parseInt(row.dataset.moveIndex);
      this.controller.goToMove(moveIndex);
    });
  }

  /**
   * Set up pawn promotion event listeners
   */
  setupPromotionEvents() {
    this.elements.promotionPieces.addEventListener('click', (e) => {
      const piece = e.target.closest('.promotion-piece');
      if (!piece || !piece.dataset.piece) return;
      
      this.controller.completePromotion(piece.dataset.piece);
    });
  }

  /**
   * Set up PGN import/export event listeners
   */
  setupPGNEvents() {
    document.getElementById('save-pgn').addEventListener('click', () => {
      this.controller.savePGN();
    });
    
    document.getElementById('load-pgn-btn').addEventListener('click', () => {
      document.getElementById('pgn-file-input').click();
    });
    
    document.getElementById('pgn-file-input').addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const pgnText = event.target.result;
          this.controller.loadPGN(pgnText);
        };
        
        reader.readAsText(file);
      }
    });
  }

  /**
   * Render the chess board
   * @param {Board} board - The chess board
   * @param {GameState} gameState - The game state
   */
  renderBoard(board, gameState) {
    this.boardView.renderBoard(board, gameState);
    this.updateTurnIndicator(gameState.currentPlayer);
    this.updateGameStatus(gameState.gameStatus);
    this.updateCapturedPieces(gameState.capturedPieces);
    this.updateNavigationButtons(gameState.currentMoveIndex, gameState.moveHistory.length);
    this.boardView.highlightChecks(gameState);
  }

  /**
   * Highlight the selected piece and its possible moves
   * @param {Array} selectedPosition - [row, col] of selected piece
   * @param {Array} possibleMoves - Array of [row, col] possible moves
   */
  highlightSquares(selectedPosition, possibleMoves) {
    this.boardView.highlightSquares(selectedPosition, possibleMoves);
  }

  /**
   * Clear all highlights from the board
   */
  clearHighlights() {
    this.boardView.clearHighlights();
  }

  /**
   * Update the turn indicator display
   * @param {String} currentPlayer - Current player ('white' or 'black')
   */
  updateTurnIndicator(currentPlayer) {
    this.elements.turnIndicator.textContent = `Current Turn: ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}`;
  }

  /**
   * Update the game status display
   * @param {String} status - Current game status text
   */
  updateGameStatus(status) {
    this.elements.gameStatus.textContent = status;
  }

  /**
   * Update the captured pieces display
   * @param {Object} capturedPieces - Object with arrays of captured pieces by color
   */
  updateCapturedPieces(capturedPieces) {
    this.elements.capturedWhite.innerHTML = '';
    this.elements.capturedBlack.innerHTML = '';
    
    // Create captured piece elements
    this.renderCapturedPieces(capturedPieces[COLORS.WHITE], this.elements.capturedWhite);
    this.renderCapturedPieces(capturedPieces[COLORS.BLACK], this.elements.capturedBlack);
  }

  /**
   * Render captured pieces for a container
   * @param {Array} pieces - Array of captured pieces
   * @param {HTMLElement} container - Container to add pieces to
   */
  renderCapturedPieces(pieces, container) {
    pieces.forEach(piece => {
      const pieceElement = document.createElement('div');
      pieceElement.classList.add('captured-piece');
      pieceElement.style.backgroundImage = `url('img/${piece.getImageName()}.png')`;
      container.appendChild(pieceElement);
    });
  }

  /**
   * Update navigation buttons based on current position
   * @param {Number} currentIndex - Current move index
   * @param {Number} historyLength - Total moves in history
   */
  updateNavigationButtons(currentIndex, historyLength) {
    document.getElementById('first-move').disabled = currentIndex === 0;
    document.getElementById('prev-move').disabled = currentIndex === 0;
    document.getElementById('next-move').disabled = currentIndex === historyLength;
    document.getElementById('last-move').disabled = currentIndex === historyLength;
  }

  /**
   * Show the pawn promotion dialog
   * @param {String} color - Color of the pawn being promoted
   * @param {Function} callback - Function to call with selected piece type
   */
  showPromotionDialog(color) {
    const piecesContainer = this.elements.promotionPieces;
    piecesContainer.innerHTML = '';
    
    const pieceTypes = [PIECE_TYPES.QUEEN, PIECE_TYPES.ROOK, PIECE_TYPES.BISHOP, PIECE_TYPES.KNIGHT];
    
    pieceTypes.forEach(type => {
      const pieceElement = document.createElement('div');
      pieceElement.classList.add('promotion-piece');
      pieceElement.dataset.piece = type;
      
      const pieceCode = type === PIECE_TYPES.KNIGHT ? 'N' : type[0].toUpperCase();
      const colorCode = color === COLORS.WHITE ? 'w' : 'b';
      pieceElement.style.backgroundImage = `url('img/${colorCode}${pieceCode}.png')`;
      
      piecesContainer.appendChild(pieceElement);
    });
    
    this.elements.promotionModal.style.display = 'flex';
  }

  /**
   * Hide the pawn promotion dialog
   */
  hidePromotionDialog() {
    this.elements.promotionModal.style.display = 'none';
  }

  /**
   * Show a temporary message in the game status
   * @param {String} message - Message to display
   * @param {Number} duration - Duration in milliseconds
   */
  showMessage(message, duration = UI.MESSAGE_DURATION) {
    const originalMessage = this.elements.gameStatus.textContent;
    this.elements.gameStatus.textContent = message;
    
    setTimeout(() => {
      // Restore original message if it hasn't changed
      if (this.elements.gameStatus.textContent === message) {
        this.elements.gameStatus.textContent = originalMessage;
      }
    }, duration);
  }
}
