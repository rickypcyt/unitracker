// Logger utility for structured logging
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message, data = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data,
    };
  }

  log(level, message, data = {}) {
    const formattedMessage = this.formatMessage(level, message, data);
    
    if (this.isDevelopment) {
      console.log(`[${level}] ${message}`, data);
    }
    // En producción, no hacer logging para mejorar rendimiento
    // Si se necesita debugging, usar herramientas como Sentry
  }

  debug(message, data) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message, data) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message, data) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message, data) {
    this.log(LOG_LEVELS.ERROR, message, data);
  }
}

export const logger = new Logger(); 