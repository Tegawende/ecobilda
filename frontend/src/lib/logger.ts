const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log('[Ecobilda]', ...args);
    }
  },
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.log('[Debug]', ...args);
    }
  },
  warn: (...args: unknown[]): void => {
    console.warn('[Ecobilda]', ...args);
  },
  error: (...args: unknown[]): void => {
    console.error('[Ecobilda]', ...args);
  },
  ws: (event: string, ...args: unknown[]): void => {
    if (isDev) {
      console.log(`[WebSocket:${event}]`, ...args);
    }
  },
  api: (method: string, url: string, ...args: unknown[]): void => {
    if (isDev) {
      console.log(`[API:${method}]`, url, ...args);
    }
  },
};

export default logger;
