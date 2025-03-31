/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  OFF = 4
}

export interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableContext: boolean;
  contextMaxLength: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private config: LoggerConfig = {
    level: environment.production ? LogLevel.ERROR : LogLevel.DEBUG,
    enableTimestamp: true,
    enableContext: true,
    contextMaxLength: 15
  };

  // CSS styles for different log levels
  private styles = {
    debug: 'color: #7f8c8d; font-weight: bold;',
    info: 'color: #3498db; font-weight: bold;',
    warn: 'color: #f39c12; font-weight: bold;',
    error: 'color: #e74c3c; font-weight: bold;',
    timestamp: 'color: #95a5a6;',
    context: 'color: #27ae60; font-weight: bold;'
  };

  // Context-specific colors (optional)
  private contextColors: Record<string, string> = {
    API: '#8e44ad',
    AUTH: '#2980b9',
    ROUTER: '#d35400',
    STORE: '#16a085',
    COMPONENT: '#c0392b',
    SERVICE: '#2c3e50',
    DEFAULT: '#27ae60'
  };

  constructor() {
    console.log(
      '%cLogger Service Initialized',
      'color: #3498db; font-weight: bold;'
    );
  }

  /**
   * Configure the logger
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add a custom context color
   */
  addContextColor(context: string, color: string): void {
    this.contextColors[context.toUpperCase()] = color;
  }

  /**
   * Debug level logging
   * @param message The message to log
   * @param context Optional context for the log
   * @param optionalParams Additional parameters to log
   */
  debug(message: any, context?: string, ...optionalParams: any[]): void {
    this.logWithLevel(LogLevel.DEBUG, message, context, optionalParams);
  }

  /**
   * Info level logging
   * @param message The message to log
   * @param context Optional context for the log
   * @param optionalParams Additional parameters to log
   */
  info(message: any, context?: string, ...optionalParams: any[]): void {
    this.logWithLevel(LogLevel.INFO, message, context, optionalParams);
  }

  /**
   * Warning level logging
   * @param message The message to log
   * @param context Optional context for the log
   * @param optionalParams Additional parameters to log
   */
  warn(message: any, context?: string, ...optionalParams: any[]): void {
    this.logWithLevel(LogLevel.WARN, message, context, optionalParams);
  }

  /**
   * Error level logging
   * @param message The message to log
   * @param context Optional context for the log
   * @param optionalParams Additional parameters to log
   */
  error(message: any, context?: string, ...optionalParams: any[]): void {
    this.logWithLevel(LogLevel.ERROR, message, context, optionalParams);
  }

  /**
   * Log with any level
   * @param message The message to log
   * @param context Optional context for the log
   * @param optionalParams Additional parameters to log
   */
  log(message: any, context?: string, ...optionalParams: any[]): void {
    this.logWithLevel(LogLevel.INFO, message, context, optionalParams);
  }

  /**
   * Internal method to handle logging with level check
   */
  private logWithLevel(
    level: LogLevel,
    message: any,
    context?: string,
    optionalParams: any[] = []
  ): void {
    // Skip if logging is disabled for this level
    if (level < this.config.level) {
      return;
    }

    const timestamp = this.config.enableTimestamp ? this.getTimestamp() : null;
    const formattedContext = this.formatContext(context);

    // Choose the console method based on level
    let consoleMethod: 'debug' | 'log' | 'info' | 'warn' | 'error';
    let levelStyle: string;
    switch (level) {
      case LogLevel.DEBUG:
        consoleMethod = 'debug';
        levelStyle = this.styles.debug;
        break;
      case LogLevel.INFO:
        consoleMethod = 'info';
        levelStyle = this.styles.info;
        break;
      case LogLevel.WARN:
        consoleMethod = 'warn';
        levelStyle = this.styles.warn;
        break;
      case LogLevel.ERROR:
        consoleMethod = 'error';
        levelStyle = this.styles.error;
        break;
      default:
        consoleMethod = 'log';
        levelStyle = this.styles.info;
    }

    // Format the log parts
    const parts: string[] = [];
    const styles: string[] = [];

    // Add timestamp if enabled
    if (timestamp) {
      parts.push('%c[%s]');
      styles.push(this.styles.timestamp);
    }

    // Add context if enabled and provided
    if (formattedContext) {
      parts.push('%c[%s]');
      styles.push(this.getContextStyle(context));
    }

    // Add the message part
    parts.push('%c%s');
    styles.push(levelStyle);

    // Combine all parts
    const format = parts.join(' ');

    // Handle different message types
    if (typeof message === 'string') {
      const args = [
        format,
        ...(timestamp ? [this.styles.timestamp, timestamp] : []),
        ...(formattedContext
          ? [this.getContextStyle(context), formattedContext]
          : []),
        levelStyle,
        message,
        ...optionalParams
      ];
      console[consoleMethod](...args);
    } else if (message instanceof Error) {
      const args = [
        format,
        ...(timestamp ? [this.styles.timestamp, timestamp] : []),
        ...(formattedContext
          ? [this.getContextStyle(context), formattedContext]
          : []),
        levelStyle,
        message.message,
        ...optionalParams
      ];
      console[consoleMethod](...args);
      console[consoleMethod](message.stack);
    } else {
      // For objects, first log the formatted header
      const args = [
        format,
        ...(timestamp ? [this.styles.timestamp, timestamp] : []),
        ...(formattedContext
          ? [this.getContextStyle(context), formattedContext]
          : []),
        levelStyle,
        typeof message === 'object' ? 'Object:' : message,
        ...optionalParams
      ];
      console[consoleMethod](...args);

      // Then log the object itself for better inspection
      if (typeof message === 'object') {
        console[consoleMethod](message);
      }
    }
  }

  /**
   * Get current timestamp in HH:MM:SS.mmm format
   */
  private getTimestamp(): string {
    const now = new Date();
    return now.toISOString().split('T')[1].split('Z')[0];
  }

  /**
   * Format the context string
   */
  private formatContext(context?: string): string | null {
    if (!this.config.enableContext || !context) {
      return null;
    }

    // Convert to uppercase and truncate if needed
    const upperContext = context.toUpperCase();
    if (upperContext.length > this.config.contextMaxLength) {
      return upperContext.substring(0, this.config.contextMaxLength);
    }
    return upperContext;
  }

  /**
   * Get the style for a specific context
   */
  private getContextStyle(context?: string): string {
    if (!context) {
      return this.styles.context;
    }
    const upperContext = context.toUpperCase();
    const color =
      this.contextColors[upperContext] || this.contextColors['DEFAULT'];
    return `color: ${color}; font-weight: bold;`;
  }
}
