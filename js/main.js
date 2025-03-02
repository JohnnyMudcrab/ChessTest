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
import { LoggingService } from './utils/LoggingService.js';

// Set this to true for production builds
const IS_PRODUCTION = false;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize logging with appropriate level
    // Use DEBUG in development, ERROR in production
    const initialLogLevel = IS_PRODUCTION ? 
      LoggingService.LOG_LEVELS.ERROR : 
      LoggingService.LOG_LEVELS.DEBUG;
    
    LoggingService.init(initialLogLevel, IS_PRODUCTION);
    
    // Initialize debug helper if not in production
    if (!IS_PRODUCTION) {
      DebugHelper.init();
    }
    
    LoggingService.info('Initializing Pure Chess application');
    
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
    
    // Log initial state (only in debug or higher)
    LoggingService.debug('Initial game state:', gameState);
    
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
    
    // Add a global reference for debugging (only in development)
    if (!IS_PRODUCTION) {
      window.chessGame = {
        controller: gameController,
        board: board,
        gameState: gameState,
        debug: DebugHelper,
        log: LoggingService
      };
    }
    
    // Log initialization success
    LoggingService.info('Pure Chess initialized successfully');
    
  } catch (error) {
    handleError(error, (message) => {
      alert(`Failed to initialize chess game: ${message}`);
      LoggingService.error('Initialization error:', error);
    });
  }
});