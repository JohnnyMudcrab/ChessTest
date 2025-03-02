/**
 * Debug Helper - Provides utility functions for debugging
 */

export class DebugHelper {
  static init() {
    // Create a debug panel if in development
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      this.createDebugPanel();
    }
    
    // Override console.log to add to debug panel
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog.apply(console, args);
      this.addToDebugLog(args);
    };
    
    console.log('Debug helper initialized');
  }
  
  static createDebugPanel() {
    // Create debug panel container
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 400px;
      height: 300px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      overflow: auto;
      z-index: 9999;
      display: none;
    `;
    
    // Create log area
    const logArea = document.createElement('div');
    logArea.id = 'debug-log';
    logArea.style.cssText = `
      height: 250px;
      overflow: auto;
      margin-bottom: 10px;
      white-space: pre-wrap;
      word-break: break-word;
    `;
    
    // Create controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      justify-content: space-between;
    `;
    
    // Toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Toggle Debug Panel';
    toggleButton.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 10000;
      padding: 5px;
      background: #333;
      color: white;
      border: none;
      cursor: pointer;
    `;
    
    toggleButton.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    
    // Clear button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.addEventListener('click', () => {
      document.getElementById('debug-log').innerHTML = '';
    });
    
    // Add elements to the DOM
    controls.appendChild(clearButton);
    panel.appendChild(logArea);
    panel.appendChild(controls);
    document.body.appendChild(panel);
    document.body.appendChild(toggleButton);
  }
  
  static addToDebugLog(args) {
    const logElement = document.getElementById('debug-log');
    if (!logElement) return;
    
    // Format the arguments
    let logText = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    // Add timestamp
    const now = new Date();
    const timestamp = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
    
    // Create log entry
    const entry = document.createElement('div');
    entry.textContent = `${timestamp} ${logText}`;
    
    // Add color based on log type
    if (logText.includes('ERROR') || logText.includes('error')) {
      entry.style.color = '#ff5555';
    } else if (logText.includes('WARN') || logText.includes('warn')) {
      entry.style.color = '#ffaa00';
    } else if (logText.includes('Current player') || logText.includes('SWITCHING PLAYER')) {
      entry.style.color = '#55ff55';
    }
    
    // Add to log and scroll to bottom
    logElement.appendChild(entry);
    logElement.scrollTop = logElement.scrollHeight;
  }
  
  static logGameState(gameState) {
    console.log('GAME STATE:', {
      currentPlayer: gameState.currentPlayer,
      moveHistoryLength: gameState.moveHistory.length,
      currentMoveIndex: gameState.currentMoveIndex,
      whiteInCheck: gameState.isInCheck.white,
      blackInCheck: gameState.isInCheck.black,
      gameOver: gameState.gameOver,
      gameStatus: gameState.gameStatus
    });
  }

  static visualizeBoard(board) {
    console.log('Current Board Visualization:');
    console.log('  a b c d e f g h');
    console.log('  ---------------');
    
    for (let row = 0; row < 8; row++) {
      let rowStr = (8 - row) + '|';
      for (let col = 0; col < 8; col++) {
        const piece = board.getPiece(row, col);
        
        if (!piece) {
          // Use different background for light/dark squares
          rowStr += (row + col) % 2 === 0 ? '□ ' : '■ ';
        } else {
          // Unicode chess symbols
          const pieceSymbols = {
            'king-white': '♔', 'queen-white': '♕', 'rook-white': '♖',
            'bishop-white': '♗', 'knight-white': '♘', 'pawn-white': '♙',
            'king-black': '♚', 'queen-black': '♛', 'rook-black': '♜',
            'bishop-black': '♝', 'knight-black': '♞', 'pawn-black': '♟'
          };
          
          const symbol = pieceSymbols[`${piece.type}-${piece.color}`] || '?';
          rowStr += symbol + ' ';
        }
      }
      console.log(rowStr);
    }
    console.log('  ---------------');
    console.log('  a b c d e f g h');
  }
}
