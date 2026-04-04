// shared/utils/logger.ts

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  group: (label: string, fn: () => void): void => {
    if (isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
  table: (data: unknown): void => {
    if (isDevelopment) {
      console.table(data);
    }
  },
  time: (label: string, fn: () => void): void => {
    if (isDevelopment) {
      console.time(label);
      fn();
      console.timeEnd(label);
    }
  },
};

// Convenience exports
export const devLog = logger.log;
export const devInfo = logger.info;
export const devWarn = logger.warn;
export const devError = logger.error;
