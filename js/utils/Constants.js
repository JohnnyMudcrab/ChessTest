/**
 * Game constants used throughout the application
 */

// Player colors
export const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

// Piece types
export const PIECE_TYPES = {
  PAWN: 'pawn',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  ROOK: 'rook',
  QUEEN: 'queen',
  KING: 'king'
};

// Board dimensions
export const BOARD_SIZE = 8;

// Algebraic notation helpers
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

// Game results
export const RESULTS = {
  WHITE_WIN: '1-0',
  BLACK_WIN: '0-1',
  DRAW: '1/2-1/2',
  IN_PROGRESS: '*'
};

// Special move types
export const SPECIAL_MOVES = {
  CASTLE_KINGSIDE: 'castle-kingside',
  CASTLE_QUEENSIDE: 'castle-queenside',
  EN_PASSANT: 'en-passant',
  PROMOTION: 'promotion'
};

// Local storage key
export const STORAGE_KEY = 'pureChess_savedGame';

// UI-related constants
export const UI = {
  SQUARE_CLASSES: {
    LIGHT: 'light',
    DARK: 'dark',
    HIGHLIGHTED: 'highlighted',
    POSSIBLE_MOVE: 'possible-move',
    CHECK: 'check'
  },
  MESSAGE_DURATION: 3000 // Duration for temporary messages in ms
};

// Image mapping for pieces
export const PIECE_IMAGES = {
  [`${PIECE_TYPES.PAWN}-${COLORS.WHITE}`]: 'wP',
  [`${PIECE_TYPES.KNIGHT}-${COLORS.WHITE}`]: 'wN',
  [`${PIECE_TYPES.BISHOP}-${COLORS.WHITE}`]: 'wB',
  [`${PIECE_TYPES.ROOK}-${COLORS.WHITE}`]: 'wR',
  [`${PIECE_TYPES.QUEEN}-${COLORS.WHITE}`]: 'wQ',
  [`${PIECE_TYPES.KING}-${COLORS.WHITE}`]: 'wK',
  [`${PIECE_TYPES.PAWN}-${COLORS.BLACK}`]: 'bP',
  [`${PIECE_TYPES.KNIGHT}-${COLORS.BLACK}`]: 'bN',
  [`${PIECE_TYPES.BISHOP}-${COLORS.BLACK}`]: 'bB',
  [`${PIECE_TYPES.ROOK}-${COLORS.BLACK}`]: 'bR',
  [`${PIECE_TYPES.QUEEN}-${COLORS.BLACK}`]: 'bQ',
  [`${PIECE_TYPES.KING}-${COLORS.BLACK}`]: 'bK'
};
