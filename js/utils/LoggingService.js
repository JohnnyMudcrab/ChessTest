/**
 * LoggingService - Provides configurable logging functionality
 */

export class LoggingService {
  static LOG_LEVELS = {
    NONE: 0,    // No logging
    ERROR: 1,   // Only errors
    WARN: 2,    // Errors and warnings
    INFO: 3,    // Errors, warnings, and info
    DEBUG: 4,   // All logs including debug
    VERBOSE: 5  // Extremely detailed logs
  };

  static currentLevel = LoggingService.LOG_LEVELS.INFO; // Default level
  static isProduction = false; // Set to true in production

  /**
   * Initialize the logging service
   * @param {Number} level - Initial log level
   * @param {Boolean} production - Whether we're in production mode
   */
  static init(level = LoggingService.LOG_LEVELS.INFO, production = false) {
    this.currentLevel = level;
    this.isProduction = production;
    
    // In production, default to ERROR level unless explicitly set
    if (this.isProduction && level === LoggingService.LOG_LEVELS.INFO) {
      this.currentLevel = LoggingService.LOG_LEVELS.ERROR;
    }
    
    // Add controls if in development mode
    if (!this.isProduction) {
      this.addLogControls();
    }
    
    // Log initialization
    this.info(`Logging initialized at level: ${this.getLevelName(this.currentLevel)}`);
  }

  /**
   * Error level log - always logged
   * @param {String} message - Message to log
   * @param {Object} data - Optional data to include
   */
  static error(message, data = null) {
    if (this.currentLevel >= this.LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, data || '');
    }
  }

  /**
   * Warning level log
   * @param {String} message - Message to log
   * @param {Object} data - Optional data to include
   */
  static warn(message, data = null) {
    if (this.currentLevel >= this.LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  /**
   * Info level log
   * @param {String} message - Message to log
   * @param {Object} data - Optional data to include
   */
  static info(message, data = null) {
    if (this.currentLevel >= this.LOG_LEVELS.INFO) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }

  /**
   * Debug level log
   * @param {String} message - Message to log
   * @param {Object} data - Optional data to include
   */
  static debug(message, data = null) {
    if (this.currentLevel >= this.LOG_LEVELS.DEBUG) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }

  /**
   * Verbose level log - most detailed
   * @param {String} message - Message to log
   * @param {Object} data - Optional data to include
   */
  static verbose(message, data = null) {
    if (this.currentLevel >= this.LOG_LEVELS.VERBOSE) {
      console.log(`[VERBOSE] ${message}`, data || '');
    }
  }

  /**
   * Set the current log level
   * @param {Number} level - New log level
   */
  static setLogLevel(level) {
    if (level >= this.LOG_LEVELS.NONE && level <= this.LOG_LEVELS.VERBOSE) {
      this.currentLevel = level;
      this.info(`Log level changed to: ${this.getLevelName(level)}`);
    }
  }

  /**
   * Get the name of a log level
   * @param {Number} level - Log level
   * @returns {String} - Name of the log level
   */
  static getLevelName(level) {
    return Object.keys(this.LOG_LEVELS).find(key => this.LOG_LEVELS[key] === level) || 'UNKNOWN';
  }

  /**
   * Add log level controls to the page (development only)
   */
  static addLogControls() {
    // Only add once
    if (document.getElementById('log-controls')) return;
    
    const container = document.createElement('div');
    container.id = 'log-controls';
    container.style.cssText = `
      position: fixed;
      bottom: 10px;
      left: 10px;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
    `;
    
    const label = document.createElement('span');
    label.textContent = 'Log Level: ';
    
    const select = document.createElement('select');
    Object.entries(this.LOG_LEVELS).forEach(([name, value]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = name;
      option.selected = value === this.currentLevel;
      select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
      this.setLogLevel(parseInt(e.target.value));
    });
    
    container.appendChild(label);
    container.appendChild(select);
    document.body.appendChild(container);
  }
}
