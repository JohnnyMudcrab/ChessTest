/**
 * Main entry point for the Pure Chess application
 */
import { Board } from './models/Board.js';
import { GameState } from './models/GameState.js';
import { MoveValidator } from './models/MoveValidator.js';
import { ChessUI } from './views/ChessUI.js';
import { GameController } from './controllers/GameController.js';
import { PGNService } from './services/PGNService.js';
import { StorageService } from './services/StorageService.js';
import { handleError } from './utils/ErrorHandler.js';
import { DebugHelper } from './utils/DebugHelper.js';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize debug helper
    DebugHelper.init();
    
    console.log('Initializing Pure Chess application...');
    
    // Initialize models
    const board = new Board();
    const gameState = new GameState();
    const moveValidator = new MoveValidator(board, gameState);
    
    // Initialize services
    const pgnService = new PGNService();
    const storageService = new StorageService();
    
    // Initialize UI
    const ui = new ChessUI();
    
    // Initialize controller
    const gameController = new GameController(
      board,
      gameState,
      moveValidator,
      ui,
      pgnService,
      storageService
    );
    
    // Connect UI with controller
    ui.setController(gameController);
    
    // Initialize the game
    gameController.initialize();
    
    // Log initial state
    DebugHelper.logGameState(gameState);
    
    // Check for saved game
    if (storageService.hasSavedGame()) {
      const timestamp = storageService.getSavedGameTimestamp();
      const formattedTime = storageService.formatTimestamp(timestamp);
      
      const shouldLoad = confirm(
        `A saved game from ${formattedTime} was found. Would you like to load it?`
      );
      
      if (shouldLoad) {
        gameController.loadSavedGame();
      }
    }
    
    // Add a global reference for debugging
    window.chessGame = {
      controller: gameController,
      board: board,
      gameState: gameState,
      debug: DebugHelper
    };
    
    // Log initialization success
    console.log('Pure Chess initialized successfully');
    
  } catch (error) {
    handleError(error, (message) => {
      alert(`Failed to initialize chess game: ${message}`);
      console.error('Initialization error:', error);
    });
  }
});
