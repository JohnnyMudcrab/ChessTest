/**
 * Custom error classes and error handling utilities
 */

/**
 * Base chess error class
 */
export class ChessError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ChessError';
  }
}

/**
 * Error for invalid moves
 */
export class InvalidMoveError extends ChessError {
  constructor(message) {
    super(message);
    this.name = 'InvalidMoveError';
  }
}

/**
 * Error for PGN parsing issues
 */
export class PGNParseError extends ChessError {
  constructor(message, line = null) {
    const lineInfo = line !== null ? ` at line ${line}` : '';
    super(`Error parsing PGN${lineInfo}: ${message}`);
    this.name = 'PGNParseError';
    this.line = line;
  }
}

/**
 * Error for storage issues
 */
export class StorageError extends ChessError {
  constructor(message) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Utility function to handle and log errors
 * 
 * @param {Error} error - The error to handle
 * @param {Function} onError - Optional callback for error notification
 */
export function handleError(error, onError = null) {
  console.error(`[${error.name}]`, error.message);
  
  if (error instanceof ChessError) {
    // Handle known errors
    if (onError) {
      onError(error.message);
    }
  } else {
    // Handle unexpected errors
    if (onError) {
      onError('An unexpected error occurred.');
    }
  }
}
