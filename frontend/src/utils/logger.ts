/**
 * Logging utility that respects environment
 * 
 * In production (VITE_USE_MOCK !== 'true'), console.log is suppressed
 * console.error and console.warn are always preserved for debugging
 */

const isDev = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true';

export const logger = {
    /**
     * Log informational messages (suppressed in production)
     */
    log: (...args: unknown[]): void => {
        if (isDev) {
            console.log('[Ecobilda]', ...args);
        }
    },

    /**
     * Log debug messages (suppressed in production)
     */
    debug: (...args: unknown[]): void => {
        if (isDev) {
            console.log('[Debug]', ...args);
        }
    },

    /**
     * Log warnings (always shown)
     */
    warn: (...args: unknown[]): void => {
        console.warn('[Ecobilda]', ...args);
    },

    /**
     * Log errors (always shown)
     */
    error: (...args: unknown[]): void => {
        console.error('[Ecobilda]', ...args);
    },

    /**
     * Log WebSocket events (suppressed in production)
     */
    ws: (event: string, ...args: unknown[]): void => {
        if (isDev) {
            console.log(`[WebSocket:${event}]`, ...args);
        }
    },

    /**
     * Log API events (suppressed in production)
     */
    api: (method: string, url: string, ...args: unknown[]): void => {
        if (isDev) {
            console.log(`[API:${method}]`, url, ...args);
        }
    },
};

export default logger;
