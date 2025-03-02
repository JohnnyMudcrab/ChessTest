/**
 * GameController - Main controller for the chess game
 * Coordinates the models, views, and services
 */
import { PieceFactory } from '../models/pieces/PieceFactory.js';
import { COLORS, PIECE_TYPES, SPECIAL_MOVES } from '../utils/Constants.js';
import { handleError } from '../utils/ErrorHandler.js';
import { NotationView } from '../views/NotationView.js';

export class GameController {
  /**
   * Create a new game controller
   * @param {Board} board - The chess board
   * @param {GameState} gameState - The game state
   * @param {MoveValidator} moveValidator - The move validator
   * @param {ChessUI} ui - The user interface
   * @param {PGNService} pgnService - The PGN service
   * @param {StorageService} storageService - The storage service
   */
  constructor(board, gameState, moveValidator, ui, pgnService, storageService) {
    this.board = board;
    this.gameState = gameState;
    this.moveValidator = moveValidator;
    this.ui = ui;
    this.pgnService = pgnService;
    this.storageService = storageService;
    
    this.selectedPiece = null;
    this.possibleMoves = [];
  }

/**
 * Initialize the game
 */
initialize() {
  console.log('Initializing game...');
  
  // Reset game state completely
  this.gameState.reset();
  
  // Set up the initial board position
  this.board.clear();
  this.board.setupInitialPosition();
  
  // Start with an empty move history
  this.gameState.moveHistory = [];
  this.gameState.currentMoveIndex = 0;
  this.gameState.boardStates = [this.board.clone()];
  
  // Explicitly set initial player to white
  this.gameState.currentPlayer = COLORS.WHITE;
  
  // Reset kingPositions to initial positions
  this.gameState.kingPositions = { 
    [COLORS.WHITE]: [7, 4], 
    [COLORS.BLACK]: [0, 4] 
  };
  
  // Reset all castling rights
  this.gameState.castlingRights = {
    [COLORS.WHITE]: { kingSide: true, queenSide: true },
    [COLORS.BLACK]: { kingSide: true, queenSide: true }
  };
  
  // Reset check status
  this.gameState.isInCheck = { 
    [COLORS.WHITE]: false, 
    [COLORS.BLACK]: false 
  };
  
  // Reset game end conditions
  this.gameState.gameOver = false;
  this.gameState.gameStatus = '';
  
  // Reset selection state
  this.selectedPiece = null;
  this.possibleMoves = [];
  
  // Update the check status
  this.moveValidator.updateCheckStatus();
  
  // Update UI
  this.ui.renderBoard(this.board, this.gameState);
  this.ui.notationView.clearNotation();
  this.ui.clearHighlights();
  
  console.log('Game initialized with current player:', this.gameState.currentPlayer);
}

  /**
   * Handle a square click
   * @param {Number} row - Row index (0-7)
   * @param {Number} col - Column index (0-7)
   */
  handleSquareClick(row, col) {
    console.log(`Square clicked: ${row},${col} - Current player: ${this.gameState.currentPlayer}`);
    
    // If game is over or promotion is pending, ignore clicks
    if (this.gameState.gameOver || this.gameState.promotionPending) {
      console.log('Game over or promotion pending - ignoring click');
      return;
    }
    
    // If viewing history, return to current position first
    if (this.gameState.currentMoveIndex < this.gameState.moveHistory.length) {
      console.log('In history view - returning to current game state');
      this.goToMove(this.gameState.moveHistory.length);
      this.clearSelection();
      return;
    }
    
    // If a piece is already selected
    if (this.selectedPiece) {
      const [selectedRow, selectedCol] = this.selectedPiece;
      
      // Check if the clicked square is a possible move
      const moveIndex = this.possibleMoves.findIndex(
        moveData => moveData[0] === row && moveData[1] === col
      );
      
      console.log(`Selected piece at ${selectedRow},${selectedCol} - Move index: ${moveIndex}`);
      
      if (moveIndex !== -1) {
        // We found a valid move
        const piece = this.board.getPiece(selectedRow, selectedCol);
        
        // Check for pawn promotion
        if (piece && 
            piece.type === PIECE_TYPES.PAWN && 
            ((piece.color === COLORS.WHITE && row === 0) || 
            (piece.color === COLORS.BLACK && row === 7))) {
          console.log('Pawn promotion triggered');
          this.promptPromotion(selectedRow, selectedCol, row, col);
        } else {
          // Handle any special move flags
          const specialMove = this.possibleMoves[moveIndex].length > 2 ? 
                            this.possibleMoves[moveIndex][2] : null;
          
          // Make the move
          console.log(`Making move: ${selectedRow},${selectedCol} -> ${row},${col}`);
          this.makeMove(selectedRow, selectedCol, row, col, specialMove);
        }
        
        this.clearSelection();
      } else {
        // If clicking on another piece of the same color, select that piece instead
        const clickedPiece = this.board.getPiece(row, col);
        if (clickedPiece && clickedPiece.color === this.gameState.currentPlayer) {
          console.log(`Selecting different piece: ${row},${col}`);
          this.selectPiece(row, col);
        } else {
          // Otherwise clear selection
          console.log('Clearing selection');
          this.clearSelection();
        }
      }
    } else {
      // If no piece is selected, try to select one
      const piece = this.board.getPiece(row, col);
      
      if (piece) {
        console.log(`Attempting to select piece: ${piece.type}-${piece.color} at ${row},${col}`);
        console.log(`Current player: ${this.gameState.currentPlayer}, Piece color: ${piece.color}`);
      }
      
      if (piece && piece.color === this.gameState.currentPlayer) {
        this.selectPiece(row, col);
      }
    }
  }

  /**
   * Select a piece and calculate its legal moves
   * @param {Number} row - Row index (0-7)
   * @param {Number} col - Column index (0-7)
   */
  selectPiece(row, col) {
    console.log(`Selecting piece at ${row},${col}`);
    
    const piece = this.board.getPiece(row, col);
    if (!piece) {
      console.error('No piece at position');
      return;
    }
    
    console.log(`Piece: ${piece.type}-${piece.color}, Current player: ${this.gameState.currentPlayer}`);
    
    // Only allow selecting current player's pieces
    if (piece.color !== this.gameState.currentPlayer) {
      console.warn('Cannot select opponent\'s piece');
      return;
    }
    
    this.selectedPiece = [row, col];
    this.possibleMoves = this.moveValidator.calculateLegalMoves(row, col);
    
    console.log(`Possible moves calculated: ${this.possibleMoves.length}`);
    console.log(this.possibleMoves);
    
    this.ui.highlightSquares(this.selectedPiece, this.possibleMoves);
  }

  /**
   * Clear the current piece selection
   */
  clearSelection() {
    this.selectedPiece = null;
    this.possibleMoves = [];
    this.ui.clearHighlights();
  }

  /**
   * Execute a move on the board
   * @param {Number} fromRow - Source row
   * @param {Number} fromCol - Source column
   * @param {Number} toRow - Destination row
   * @param {Number} toCol - Destination column
   * @param {String} specialMove - Special move type (if any)
   * @param {String} promotionPiece - Piece to promote to (if applicable)
   */
  makeMove(fromRow, fromCol, toRow, toCol, specialMove = null, promotionPiece = null) {
    console.log(`Making move from ${fromRow},${fromCol} to ${toRow},${toCol}`);
    console.log(`Current player: ${this.gameState.currentPlayer}`);
    
    // Debug board state before move
    console.log('BOARD STATE BEFORE MOVE:');
    for (let row = 0; row < 8; row++) {
      let rowStr = '';
      for (let col = 0; col < 8; col++) {
        const piece = this.board.getPiece(row, col);
        if (piece) {
          rowStr += `${piece.type.charAt(0)}${piece.color.charAt(0)} `;
        } else {
          rowStr += '.. ';
        }
      }
      console.log(`${row}: ${rowStr}`);
    }
    
    // Check if we need to retrieve the piece from the UI selection
    if (!this.board.getPiece(fromRow, fromCol) && this.selectedPiece) {
      console.warn(`No piece found at ${fromRow},${fromCol}, but we have a selected piece`);
      // Try to use the board coordinates directly from selectedPiece
      [fromRow, fromCol] = this.selectedPiece;
      console.log(`Updated move coordinates to ${fromRow},${fromCol} -> ${toRow},${toCol}`);
    }
    
    try {
      const piece = this.board.getPiece(fromRow, fromCol);
      if (!piece) {
        console.error(`No piece at source position ${fromRow},${fromCol}`);
        return false;
      }
      
      console.log(`Moving piece: ${piece.type}-${piece.color}`);
      
      const pieceType = piece.type;
      const pieceColor = piece.color;
      const opponentColor = pieceColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
      
      // Store old en passant target
      const oldEnPassantTarget = this.gameState.enPassantTarget;
      this.gameState.enPassantTarget = null;
      
      let capturedPiece = null;
      let enPassantCapture = null;
      let promotedPiece = null;
      let castling = null;
      
      // Handle special moves
      if (specialMove && specialMove.startsWith('castle')) {
        castling = specialMove === SPECIAL_MOVES.CASTLE_KINGSIDE ? 'kingside' : 'queenside';
        this.handleCastling(fromRow, fromCol, toRow, toCol, castling);
      } else {
        // Handle pawn special moves
        if (pieceType === PIECE_TYPES.PAWN) {
          // Check for en passant capture
          if (fromCol !== toCol && !this.board.getPiece(toRow, toCol)) {
            const enPassantRow = pieceColor === COLORS.WHITE ? toRow + 1 : toRow - 1;
            enPassantCapture = [enPassantRow, toCol];
            
            // Capture the pawn
            capturedPiece = this.board.getPiece(enPassantRow, toCol);
            this.board.setPiece(enPassantRow, toCol, null);
            
            if (capturedPiece) {
              this.gameState.capturedPieces[pieceColor].push(capturedPiece);
            }
          }
          
          // Check for pawn promotion
          if (promotionPiece) {
            promotedPiece = promotionPiece;
            const newPiece = PieceFactory.createPiece(promotionPiece, pieceColor);
            this.board.setPiece(toRow, toCol, newPiece);
            this.board.setPiece(fromRow, fromCol, null);
          } else {
            // Set en passant target for double move
            if (Math.abs(fromRow - toRow) === 2) {
              const enPassantRow = pieceColor === COLORS.WHITE ? toRow + 1 : toRow - 1;
              this.gameState.enPassantTarget = [enPassantRow, toCol];
            }
            
            // Regular move
            capturedPiece = this.board.getPiece(toRow, toCol);
            this.board.movePiece(fromRow, fromCol, toRow, toCol);
          }
        } else {
          // Regular move for non-pawn pieces
          capturedPiece = this.board.getPiece(toRow, toCol);
          this.board.movePiece(fromRow, fromCol, toRow, toCol);
        }
      }
      
      // Add captured piece to history (if not from en passant - that's already handled)
      if (capturedPiece && !enPassantCapture) {
        this.gameState.capturedPieces[pieceColor].push(capturedPiece);
      }
      
      // Update castling rights
      this.updateCastlingRights(fromRow, fromCol, toRow, toCol, piece);
      
      // Update king position if king moved
      if (pieceType === PIECE_TYPES.KING) {
        this.gameState.kingPositions[pieceColor] = [toRow, toCol];
      }
      
      // Generate move notation
      const notation = this.generateNotation(
        piece, 
        [fromRow, fromCol], 
        [toRow, toCol], 
        !!capturedPiece, 
        specialMove, 
        promotionPiece
      );
      
      // Create move object for history
      const move = {
        piece,
        from: [fromRow, fromCol],
        to: [toRow, toCol],
        capturedPiece,
        player: pieceColor,
        enPassantCapture,
        promotedPiece,
        castling,
        enPassantTarget: oldEnPassantTarget,
        castlingRights: JSON.parse(JSON.stringify(this.gameState.castlingRights)),
        notation
      };
      
      // Add move to history and store board state
      this.gameState.addMove(move, this.board.clone());
      
      // SWITCH PLAYER - very important!
      console.log(`SWITCHING PLAYER from ${this.gameState.currentPlayer}`);
      this.gameState.currentPlayer = opponentColor;  // Direct assignment for clarity
      console.log(`NEW CURRENT PLAYER: ${this.gameState.currentPlayer}`);
      
      // Update check status
      this.moveValidator.updateCheckStatus();
      
      // Check for checkmate or stalemate
      const endConditions = this.moveValidator.checkGameEndConditions();
      this.gameState.gameOver = endConditions.gameOver;
      this.gameState.gameStatus = endConditions.gameStatus;
      
      // Update result based on game status
      this.gameState.updateResult();
      
      // Render board with updated state
      this.ui.renderBoard(this.board, this.gameState);
      
      // Add move to notation and highlight
      this.ui.notationView.addMoveToHistory(
        move, 
        this.gameState.moveHistory.length, // Changed from length-1
        this.gameState.isInCheck[opponentColor],
        this.gameState.gameOver && this.gameState.isInCheck[opponentColor]
      );
      
      // Highlight current move in notation
      this.ui.notationView.highlightMove(this.gameState.moveHistory.length);
      
      // Save game automatically
      this.autoSaveGame();
      
      return true;
    } catch (error) {
      console.error('Error making move:', error);
      this.ui.showMessage(`Error: ${error.message}`);
      return false;
    }
  }

  /**
   * Handle castling move
   * @param {Number} fromRow - King's row
   * @param {Number} fromCol - King's column (4)
   * @param {Number} toRow - King's destination row (same as fromRow)
   * @param {Number} toCol - King's destination column (2 or 6)
   * @param {String} castlingSide - 'kingside' or 'queenside'
   */
  handleCastling(fromRow, fromCol, toRow, toCol, castlingSide) {
    // Move king
    this.board.movePiece(fromRow, fromCol, toRow, toCol);
    
    // Move rook
    const isKingside = castlingSide === 'kingside';
    const rookFromCol = isKingside ? 7 : 0;
    const rookToCol = isKingside ? 5 : 3;
    
    this.board.movePiece(fromRow, rookFromCol, fromRow, rookToCol);
  }

  /**
   * Update castling rights after a move
   * @param {Number} fromRow - Source row
   * @param {Number} fromCol - Source column
   * @param {Number} toRow - Destination row
   * @param {Number} toCol - Destination column
   * @param {Piece} piece - Piece that moved
   */
  updateCastlingRights(fromRow, fromCol, toRow, toCol, piece) {
    // If king moves, lose all castling rights for that color
    if (piece.type === PIECE_TYPES.KING) {
      this.gameState.castlingRights[piece.color].kingSide = false;
      this.gameState.castlingRights[piece.color].queenSide = false;
    }
    
    // If rook moves, lose castling rights for that side
    if (piece.type === PIECE_TYPES.ROOK) {
      if (fromRow === 7 && fromCol === 0 && piece.color === COLORS.WHITE) {
        this.gameState.castlingRights.white.queenSide = false;
      } else if (fromRow === 7 && fromCol === 7 && piece.color === COLORS.WHITE) {
        this.gameState.castlingRights.white.kingSide = false;
      } else if (fromRow === 0 && fromCol === 0 && piece.color === COLORS.BLACK) {
        this.gameState.castlingRights.black.queenSide = false;
      } else if (fromRow === 0 && fromCol === 7 && piece.color === COLORS.BLACK) {
        this.gameState.castlingRights.black.kingSide = false;
      }
    }
    
    // If a rook is captured, update castling rights
    const capturedPiece = this.board.getPiece(toRow, toCol);
    if (capturedPiece && capturedPiece.type === PIECE_TYPES.ROOK) {
      if (toRow === 7 && toCol === 0) this.gameState.castlingRights.white.queenSide = false;
      if (toRow === 7 && toCol === 7) this.gameState.castlingRights.white.kingSide = false;
      if (toRow === 0 && toCol === 0) this.gameState.castlingRights.black.queenSide = false;
      if (toRow === 0 && toCol === 7) this.gameState.castlingRights.black.kingSide = false;
    }
  }

  /**
   * Generate algebraic notation for a move
   * @param {Piece} piece - The piece that moved
   * @param {Array} from - [fromRow, fromCol] source position
   * @param {Array} to - [toRow, toCol] destination position
   * @param {Boolean} isCapture - Whether the move is a capture
   * @param {String} specialMove - Special move type (if any)
   * @param {String} promotionPiece - Promotion piece type (if any)
   * @returns {String} - Algebraic notation for the move
   */
  generateNotation(piece, from, to, isCapture, specialMove, promotionPiece) {
    return NotationView.generateNotation(
      this.board,
      piece,
      from,
      to,
      isCapture,
      specialMove,
      promotionPiece,
      this.gameState.isInCheck[this.gameState.getOpponentColor()],
      this.gameState.gameOver && this.gameState.isInCheck[this.gameState.getOpponentColor()]
    );
  }

  /**
   * Show the pawn promotion dialog
   * @param {Number} fromRow - Source row
   * @param {Number} fromCol - Source column
   * @param {Number} toRow - Destination row
   * @param {Number} toCol - Destination column
   */
  promptPromotion(fromRow, fromCol, toRow, toCol) {
    this.gameState.promotionPending = true;
    this.gameState.promotionMove = { fromRow, fromCol, toRow, toCol };
    
    const piece = this.board.getPiece(fromRow, fromCol);
    this.ui.showPromotionDialog(piece.color);
  }

  /**
   * Complete a pawn promotion with the selected piece
   * @param {String} pieceType - Type of piece to promote to
   */
  completePromotion(pieceType) {
    const { fromRow, fromCol, toRow, toCol } = this.gameState.promotionMove;
    
    // Close the modal
    this.ui.hidePromotionDialog();
    
    // Complete the move with the promoted piece
    this.makeMove(fromRow, fromCol, toRow, toCol, null, pieceType);
    
    this.gameState.promotionPending = false;
    this.gameState.promotionMove = null;
  }

  /**
   * Navigate to a specific move in the game history
   * @param {Number} moveIndex - Index of the move to go to
   */
  goToMove(moveIndex) {
    if (moveIndex < 0 || moveIndex > this.gameState.moveHistory.length) return;
    
    // Use the stored board state
    if (moveIndex <= this.gameState.boardStates.length - 1) {
      this.board = this.gameState.boardStates[moveIndex].clone();
    } else {
      // Fallback to recreating from scratch if needed
      this.rebuildBoardState(moveIndex);
    }
    
    // Update current move index
    this.gameState.currentMoveIndex = moveIndex;
    
    // Determine the current player
    this.gameState.currentPlayer = moveIndex % 2 === 0 ? COLORS.WHITE : COLORS.BLACK;
    
    // Update check status
    this.moveValidator.updateCheckStatus();
    
    // Check for game end conditions if at the latest move
    if (moveIndex === this.gameState.moveHistory.length) {
      const endConditions = this.moveValidator.checkGameEndConditions();
      this.gameState.gameOver = endConditions.gameOver;
      this.gameState.gameStatus = endConditions.gameStatus;
    } else {
      this.gameState.gameOver = false;
      this.gameState.gameStatus = '';
    }
    
    // Update UI
    this.ui.renderBoard(this.board, this.gameState);
    this.ui.notationView.highlightMove(moveIndex);
  }

  /**
   * Rebuild the board state for a specific move index
   * @param {Number} moveIndex - Index to rebuild to
   */
  rebuildBoardState(moveIndex) {
    // Reset the board to initial state
    this.board.setupInitialPosition();
    
    // Replay all moves up to the requested index
    for (let i = 0; i < moveIndex; i++) {
      const move = this.gameState.moveHistory[i];
      
      // Apply move (simplified version, real implementation would be more comprehensive)
      const piece = this.board.getPiece(move.from[0], move.from[1]);
      
      // Handle captures
      if (move.capturedPiece) {
        this.gameState.addCapturedPiece(move.capturedPiece);
      }
      
      // Handle en passant capture
      if (move.enPassantCapture) {
        const capturedPawn = this.board.getPiece(move.enPassantCapture[0], move.enPassantCapture[1]);
        this.board.setPiece(move.enPassantCapture[0], move.enPassantCapture[1], null);
        this.gameState.addCapturedPiece(capturedPawn);
      }
      
      // Handle castling
      if (move.castling) {
        const row = move.from[0];
        const rookFromCol = move.castling === 'kingside' ? 7 : 0;
        const rookToCol = move.castling === 'kingside' ? 5 : 3;
        
        // Move the rook
        const rook = this.board.getPiece(row, rookFromCol);
        this.board.setPiece(row, rookToCol, rook);
        this.board.setPiece(row, rookFromCol, null);
      }
      
      // Handle pawn promotion
      if (move.promotedPiece) {
        const newPiece = PieceFactory.createPiece(move.promotedPiece, move.player);
        this.board.setPiece(move.to[0], move.to[1], newPiece);
        this.board.setPiece(move.from[0], move.from[1], null);
      } else {
        // Regular move
        this.board.movePiece(move.from[0], move.from[1], move.to[0], move.to[1]);
      }
      
      // Update king position if king moved
      if (piece && piece.type === PIECE_TYPES.KING) {
        this.gameState.updateKingPosition(move.player, move.to[0], move.to[1]);
      }
      
      // Update castling rights
      if (move.castlingRights) {
        this.gameState.castlingRights = JSON.parse(JSON.stringify(move.castlingRights));
      }
      
      // Set en passant target
      this.gameState.enPassantTarget = move.enPassantTarget;
    }
  }

  /**
   * Flip the board orientation
   */
  flipBoard() {
    this.gameState.boardOrientation = 
      this.gameState.boardOrientation === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
    this.ui.renderBoard(this.board, this.gameState);
  }

  /**
   * Reset the game to initial state
   */
  resetGame() {
    // Reset models
    this.board.setupInitialPosition();
    this.gameState.reset();
    
    // Store initial board state
    this.gameState.boardStates = [this.board.clone()];
    
    // Reset UI
    this.ui.renderBoard(this.board, this.gameState);
    this.ui.notationView.clearNotation();
    this.clearSelection();
    
    // Clear saved game
    this.storageService.clearSavedGame();
  }

  /**
   * Save the current game to localStorage
   */
  autoSaveGame() {
    try {
      // Only save if not viewing history
      if (this.gameState.currentMoveIndex === this.gameState.moveHistory.length) {
        const pgnContent = this.pgnService.generatePGN(
          this.gameState.moveHistory,
          this.gameState.gameStatus,
          this.gameState.currentPlayer,
          document.getElementById('notation-body')
        );
        
        this.storageService.saveGame(pgnContent, this.gameState);
      }
    } catch (error) {
      handleError(error, (message) => console.warn('Auto-save failed:', message));
    }
  }

  /**
   * Save the current game as PGN file
   */
  savePGN() {
    try {
      const pgnContent = this.pgnService.generatePGN(
        this.gameState.moveHistory,
        this.gameState.gameStatus,
        this.gameState.currentPlayer,
        document.getElementById('notation-body')
      );
      
      this.pgnService.savePGNToFile(pgnContent);
    } catch (error) {
      handleError(error, (message) => this.ui.showMessage(message));
    }
  }

  /**
   * Load a game from PGN
   * @param {String} pgnText - PGN text to load
   */
  loadPGN(pgnText) {
    try {
      const pgnData = this.pgnService.parsePGN(pgnText);
      
      // Reset the game first
      this.resetGame();
      
      // Process each move
      for (const move of pgnData.moves) {
        const parsedMove = this.pgnService.parseAlgebraicNotation(
          move.notation, move.color, this.board, this.gameState
        );
        
        if (parsedMove) {
          const { from, to, promotion } = parsedMove;
          this.makeMove(from[0], from[1], to[0], to[1], null, promotion);
        }
      }
      
      this.ui.showMessage('PGN loaded successfully');
    } catch (error) {
      handleError(error, (message) => this.ui.showMessage('Error loading PGN: ' + message));
    }
  }

  /**
   * Load a game from localStorage
   */
  loadSavedGame() {
    try {
      const savedGame = this.storageService.loadGame();
      if (!savedGame) {
        this.ui.showMessage('No saved game found');
        return false;
      }
      
      // Load the PGN
      this.loadPGN(savedGame.pgn);
      
      // Restore additional game state
      if (savedGame.boardOrientation) {
        this.gameState.boardOrientation = savedGame.boardOrientation;
      }
      
      if (savedGame.currentMoveIndex !== undefined) {
        // Go to the saved move index
        this.goToMove(savedGame.currentMoveIndex);
      }
      
      // Update the board
      this.ui.renderBoard(this.board, this.gameState);
      
      this.ui.showMessage('Saved game loaded');
      return true;
    } catch (error) {
      handleError(error, (message) => this.ui.showMessage(message));
      return false;
    }
  }

  /**
   * Check if a game is over
   * @returns {Boolean} - Whether the game is over
   */
  isGameOver() {
    return this.gameState.gameOver;
  }

  /**
   * Check if promotion is pending
   * @returns {Boolean} - Whether promotion is pending
   */
  isPromotionPending() {
    return this.gameState.promotionPending;
  }

  /**
   * Get the current move index
   * @returns {Number} - Current move index
   */
  getCurrentMoveIndex() {
    return this.gameState.currentMoveIndex;
  }

  /**
   * Get the length of move history
   * @returns {Number} - Number of moves in history
   */
  getMoveHistoryLength() {
    return this.gameState.moveHistory.length;
  }
}
