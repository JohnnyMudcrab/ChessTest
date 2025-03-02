/**
 * StorageService - Handles game persistence via localStorage
 */
import { STORAGE_KEY } from '../utils/Constants.js';
import { StorageError } from '../utils/ErrorHandler.js';

export class StorageService {
  /**
   * Save the current game state to localStorage
   * 
   * @param {String} pgnData - PGN string representation of the game
   * @param {Object} gameState - Additional game state data
   * @returns {Boolean} - Whether the save was successful
   */
  saveGame(pgnData, gameState) {
    try {
      // Create a complete game data object
      const gameData = {
        pgn: pgnData,
        timestamp: new Date().toISOString(),
        capturedPieces: gameState.capturedPieces,
        currentMoveIndex: gameState.currentMoveIndex,
        boardOrientation: gameState.boardOrientation,
        gameOver: gameState.gameOver
      };

      // Convert to JSON and save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
      return true;
    } catch (error) {
      console.error('Error saving game:', error);
      throw new StorageError('Failed to save game: ' + error.message);
    }
  }

  /**
   * Load a saved game from localStorage
   * 
   * @returns {Object|null} - Saved game data or null if none exists
   */
  loadGame() {
    try {
      const savedGameJSON = localStorage.getItem(STORAGE_KEY);
      if (!savedGameJSON) {
        return null;
      }

      return JSON.parse(savedGameJSON);
    } catch (error) {
      console.error('Error loading game:', error);
      throw new StorageError('Failed to load saved game: ' + error.message);
    }
  }

  /**
   * Clear any saved game data
   * 
   * @returns {Boolean} - Whether the operation was successful
   */
  clearSavedGame() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing saved game:', error);
      throw new StorageError('Failed to clear saved game: ' + error.message);
    }
  }

  /**
   * Check if a saved game exists
   * 
   * @returns {Boolean} - Whether a saved game exists
   */
  hasSavedGame() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Get the timestamp of the saved game
   * 
   * @returns {String|null} - Timestamp or null if no saved game
   */
  getSavedGameTimestamp() {
    try {
      const savedGameJSON = localStorage.getItem(STORAGE_KEY);
      if (!savedGameJSON) {
        return null;
      }

      const gameData = JSON.parse(savedGameJSON);
      return gameData.timestamp;
    } catch (error) {
      console.error('Error getting saved game timestamp:', error);
      return null;
    }
  }

  /**
   * Format a timestamp for display
   * 
   * @param {String} timestamp - ISO timestamp string
   * @returns {String} - Formatted date and time
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return timestamp;
    }
  }
}
