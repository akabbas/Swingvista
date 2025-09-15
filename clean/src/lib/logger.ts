'use client';

export enum LogLevel { DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3, FATAL = 4 }

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private logLevel: LogLevel;
  private sessionId: string;
  private userId?: string;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    this.sessionId = this.generateSessionId();
    this.setupErrorHandlers();
  }

  private generateSessionId(): string { return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }

  private setupErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Global error caught', { message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno, error: event.error });
      });
      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', { reason: event.reason, promise: event.promise });
      });
    }
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };
  }

  private shouldLog(level: LogLevel): boolean { return level >= this.logLevel; }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs = this.logs.slice(-this.maxLogs);
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = this.getConsoleMethod(entry.level);
      consoleMethod(`[${entry.timestamp}] ${entry.context ? `[${entry.context}] ` : ''}${entry.message}`, entry.data || '');
    }
    if (process.env.NODE_ENV === 'production' && entry.level >= LogLevel.ERROR) {
      this.sendToMonitoring(entry);
    }
  }

  private getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
      case LogLevel.DEBUG: return console.debug;
      case LogLevel.INFO: return console.info;
      case LogLevel.WARN: return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL: return console.error;
      default: return console.log;
    }
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const errorLogs = JSON.parse(localStorage.getItem('swingvista_errors') || '[]');
        errorLogs.push(entry);
        localStorage.setItem('swingvista_errors', JSON.stringify(errorLogs.slice(-50)));
      }
    } catch (error) {
      console.error('Failed to send log to monitoring service:', error);
    }
  }

  debug(message: string, data?: unknown, context?: string): void { if (this.shouldLog(LogLevel.DEBUG)) this.addLog(this.createLogEntry(LogLevel.DEBUG, message, data, context)); }
  info(message: string, data?: unknown, context?: string): void { if (this.shouldLog(LogLevel.INFO)) this.addLog(this.createLogEntry(LogLevel.INFO, message, data, context)); }
  warn(message: string, data?: unknown, context?: string): void { if (this.shouldLog(LogLevel.WARN)) this.addLog(this.createLogEntry(LogLevel.WARN, message, data, context)); }
  error(message: string, data?: unknown, context?: string): void { if (this.shouldLog(LogLevel.ERROR)) this.addLog(this.createLogEntry(LogLevel.ERROR, message, data, context)); }
  fatal(message: string, data?: unknown, context?: string): void { if (this.shouldLog(LogLevel.FATAL)) this.addLog(this.createLogEntry(LogLevel.FATAL, message, data, context)); }
  setUserId(userId: string): void { this.userId = userId; }
  getLogs(): LogEntry[] { return [...this.logs]; }
  getErrorLogs(): LogEntry[] { return this.logs.filter(log => log.level >= LogLevel.ERROR); }
  clearLogs(): void { this.logs = []; }
  exportLogs(): string { return JSON.stringify(this.logs, null, 2); }
}

export const logger = new Logger();
export const logDebug = (message: string, data?: any, context?: string) => logger.debug(message, data, context);
export const logInfo = (message: string, data?: any, context?: string) => logger.info(message, data, context);
export const logWarn = (message: string, data?: any, context?: string) => logger.warn(message, data, context);
export const logError = (message: string, data?: any, context?: string) => logger.error(message, data, context);
export const logFatal = (message: string, data?: any, context?: string) => logger.fatal(message, data, context);


