/**
 * Production-safe logging utility
 * 
 * Provides conditional logging based on environment.
 * In development: logs everything
 * In production: only logs errors
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private addLog(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  log(message: string, data?: any) {
    this.addLog('log', message, data);
    if (this.isDevelopment) {
      console.log(`[LOG] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data);
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data);
    // Always log errors
    console.error(`[ERROR] ${message}`, data || '');
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data);
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data || '');
    }
  }

  debug(message: string, data?: any) {
    this.addLog('debug', message, data);
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
