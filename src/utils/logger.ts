/**
 * Logging utility that respects development/production mode
 * Only logs in development mode, silent in production
 */

import { isDevelopment } from "./config";

export type LogLevel = "log" | "info" | "warn" | "error" | "debug";

interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

class DevLogger implements Logger {
  log(...args: unknown[]): void {
    if (isDevelopment()) {
      console.log(...args);
    }
  }

  info(...args: unknown[]): void {
    if (isDevelopment()) {
      console.info(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (isDevelopment()) {
      console.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    if (isDevelopment()) {
      console.error(...args);
    }
  }

  debug(...args: unknown[]): void {
    if (isDevelopment()) {
      console.debug(...args);
    }
  }
}

class ProdLogger implements Logger {
  log(): void {
    // Silent in production
  }

  info(): void {
    // Silent in production
  }

  warn(): void {
    // Silent in production
  }

  error(): void {
    // Silent in production
  }

  debug(): void {
    // Silent in production
  }
}

// Create logger instance based on environment
const logger: Logger = isDevelopment() ? new DevLogger() : new ProdLogger();

// Export the logger instance
export default logger;

// Also export individual methods for convenience
export const { log, info, warn, error, debug } = logger;
