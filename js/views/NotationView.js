/**
 * NotationView - Renders the chess notation view
 */
import { COLORS } from '../utils/Constants.js';

export class NotationView {
  /**
   * Create a notation view
   * @param {HTMLElement} notationBody - The notation table body element
   * @param {HTMLElement} moveHistory - The move history container
   */
  constructor(notationBody, moveHistory) {
    this.notationBody = notationBody;
    this.moveHistory = moveHistory;
  }

  /**
   * Add a move to the notation history
   * @param {Object} move - Move object with details
   * @param {Number} moveIndex - Index of the move in history
   * @param {Boolean} isChecking - Whether the move puts opponent in check
   * @param {Boolean} isCheckmate - Whether the move is checkmate
   */
  addMoveToHistory(move, moveIndex, isChecking = false, isCheckmate = false) {
    console.log(`Adding move to notation history: ${move.notation}, index: ${moveIndex}`);
    
    // Get piece and player info
    const { piece, notation } = move;
    
    // Determine move number (1-based)
    const moveNumber = Math.ceil(moveIndex / 2);
    
    // Determine if white or black move
    const isWhiteMove = piece.color === COLORS.WHITE;
    
    console.log(`Move #${moveNumber}, ${isWhiteMove ? 'White' : 'Black'}: ${notation}`);
    
    if (isWhiteMove) {
      // Create a new row for white's move
      const tr = document.createElement('tr');
      tr.dataset.moveIndex = moveIndex;
      
      const tdNum = document.createElement('td');
      tdNum.textContent = moveNumber + '.';
      
      const tdWhite = document.createElement('td');
      tdWhite.textContent = notation;
      
      const tdBlack = document.createElement('td');
      // Black's move will be filled in later
      
      tr.appendChild(tdNum);
      tr.appendChild(tdWhite);
      tr.appendChild(tdBlack);
      this.notationBody.appendChild(tr);
    } else {
      // Add black's move to the last row
      const rows = this.notationBody.getElementsByTagName('tr');
      if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        const cells = lastRow.getElementsByTagName('td');
        if (cells.length >= 3) {
          cells[2].textContent = notation;
          // Update the row's moveIndex to the black move's index
          lastRow.dataset.moveIndex = moveIndex;
        }
      }
    }
    
    // Scroll to the bottom of the move history
    this.moveHistory.scrollTop = this.moveHistory.scrollHeight;
  }

  /**
   * Highlight the current move in the notation history
   * @param {Number} moveIndex - Index of the move to highlight
   */
  highlightMove(moveIndex) {
    // Remove highlight from all cells
    document.querySelectorAll('.notation-table td').forEach(cell => {
      cell.classList.remove('active');
    });
    
    if (moveIndex <= 0) return;
    
    // Calculate which row and column to highlight
    const rowIndex = Math.ceil(moveIndex / 2) - 1;
    const isWhiteMove = moveIndex % 2 === 1; // White moves are odd indices
    const columnIndex = isWhiteMove ? 1 : 2; // 1 for white, 2 for black
    
    // Get the rows in the notation table
    const rows = this.notationBody.getElementsByTagName('tr');
    
    // Highlight the specific cell if it exists
    if (rowIndex >= 0 && rowIndex < rows.length) {
      const cells = rows[rowIndex].getElementsByTagName('td');
      if (columnIndex < cells.length) {
        cells[columnIndex].classList.add('active');
      }
    }
  }

  /**
   * Clear the notation history
   */
  clearNotation() {
    this.notationBody.innerHTML = '';
  }

  /**
   * Truncate notation history at a specific move index
   * @param {Number} moveIndex - Index to truncate at
   */
  truncateNotation(moveIndex) {
    const rows = this.notationBody.getElementsByTagName('tr');
    
    let rowIndex = Math.ceil(moveIndex / 2);
    // If we're truncating after white's move, keep the row but clear black's move
    if (moveIndex % 2 === 1 && rowIndex < rows.length) {
      const cells = rows[rowIndex - 1].getElementsByTagName('td');
      if (cells.length >= 3) {
        cells[2].textContent = '';
      }
      // Remove all subsequent rows
      while (rows.length > rowIndex) {
        this.notationBody.removeChild(rows[rowIndex]);
      }
    } else {
      // Remove all rows from this point
      while (rows.length > rowIndex) {
        this.notationBody.removeChild(rows[rowIndex]);
      }
    }
  }

  /**
   * Generate algebraic notation for a move
   * @param {Board} board - Chess board
   * @param {Piece} piece - The piece that moved
   * @param {Array} from - [fromRow, fromCol] source position
   * @param {Array} to - [toRow, toCol] destination position
   * @param {Boolean} isCapture - Whether the move is a capture
   * @param {String} specialMove - Special move type (if any)
   * @param {String} promotionPiece - Promotion piece type (if any)
   * @param {Boolean} isCheck - Whether the move puts opponent in check
   * @param {Boolean} isCheckmate - Whether the move is checkmate
   * @returns {String} - Algebraic notation for the move
   */
  static generateNotation(board, piece, from, to, isCapture, specialMove, promotionPiece, isCheck, isCheckmate) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
    
    // Get piece type (P, N, B, R, Q, K)
    let pieceType = piece.type[0].toUpperCase();
    // Knights use 'N' instead of 'K' in algebraic notation
    if (pieceType === 'K' && piece.type === 'knight') pieceType = 'N';
    // Pawns have no prefix in algebraic notation
    if (pieceType === 'P') pieceType = '';
    
    // Build the move in algebraic notation
    let notation = '';
    
    // Handle castling
    if (specialMove && specialMove.startsWith('castle')) {
      notation = specialMove.includes('kingside') ? 'O-O' : 'O-O-O';
    } else {
      if (isCapture) {
        // Captures
        if (pieceType === '') {
          // Pawn captures include the file
          notation = files[fromCol] + 'x' + files[toCol] + ranks[toRow];
        } else {
          notation = pieceType + 'x' + files[toCol] + ranks[toRow];
        }
      } else {
        // Non-captures
        notation = pieceType + files[toCol] + ranks[toRow];
      }
      
      // Add promotion
      if (promotionPiece) {
        const promotedTo = promotionPiece[0].toUpperCase();
        notation += '=' + (promotedTo === 'K' && promotionPiece === 'knight' ? 'N' : promotedTo);
      }
    }
    
    // Add check or checkmate
    if (isCheckmate) {
      notation += '#';
    } else if (isCheck) {
      notation += '+';
    }
    
    return notation;
  }
}
