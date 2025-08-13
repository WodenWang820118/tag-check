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
  private readonly styles = {
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

  // Helper to map log level to console method and style
  private getLevelSettings(level: LogLevel): {
    consoleMethod: 'debug' | 'info' | 'warn' | 'error' | 'log';
    levelStyle: string;
  } {
    switch (level) {
      case LogLevel.DEBUG:
        return { consoleMethod: 'debug', levelStyle: this.styles.debug };
      case LogLevel.INFO:
        return { consoleMethod: 'info', levelStyle: this.styles.info };
      case LogLevel.WARN:
        return { consoleMethod: 'warn', levelStyle: this.styles.warn };
      case LogLevel.ERROR:
        return { consoleMethod: 'error', levelStyle: this.styles.error };
      default:
        return { consoleMethod: 'log', levelStyle: this.styles.info };
    }
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
    const { consoleMethod, levelStyle } = this.getLevelSettings(level);

    const parts: string[] = [];
    const stylesArr: string[] = [];
    const values: any[] = [];

    if (timestamp) {
      parts.push('%c[%s]');
      stylesArr.push(this.styles.timestamp);
      values.push(timestamp);
    }

    if (formattedContext) {
      parts.push('%c[%s]');
      stylesArr.push(this.getContextStyle(context));
      values.push(formattedContext);
    }

    parts.push('%c%s');
    stylesArr.push(levelStyle);

    const format = parts.join(' ');

    let messageText: string;
    if (message instanceof Error) {
      messageText = message.message;
    } else if (typeof message === 'string') {
      messageText = message;
    } else {
      messageText = 'Object:';
    }

    const args = [
      format,
      ...stylesArr,
      ...values,
      messageText,
      ...optionalParams
    ];
    console[consoleMethod](...args);

    if (message instanceof Error) {
      console[consoleMethod](message.stack);
    } else if (typeof message === 'object') {
      console[consoleMethod](message);
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
